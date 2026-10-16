import { appendConsoleMessage } from '../ui/console.js';
import { robot, setWheelSpeeds } from './robot.js';
import { asyncTicket } from '../runtime/runState.js';
import { play_tone as _play_tone, play_note as _play_note, audio_stop as _audio_stop, set_volume as _set_volume, get_volume as _get_volume } from './audio.js';
import {
  display_text as _display_text,
  display_show_label as _display_show_label,
  display_set_colour as _display_set_colour,
  display_fill as _display_fill,
  display_draw_pixel as _display_draw_pixel,
  display_clear as _display_clear,
  println_display,
} from '../ui/display.js';
import { led_on as _led_on, led_off as _led_off, led_set_all as _led_set_all } from './leds.js';
import {
  sensorUltrasonic,
  sensorQuadRGBColour, sensorQuadRGBBrightness, sensorQuadRGBRGB, sensorQuadRGBLine,
  sensorQuadRGBForProbe,
  sensorLine,
  sensorGyro, sensorGyroReset,
  sensorAccelerometer,
  sensorEncoder, sensorEncoderReset,
  sensorTimer, sensorTimerReset,
  sensorKey, sensorJoystick,
  sensorLight, sensorSound,
} from './sensors.js';

// FIFO message bus: channel → string[]. Resets on each program run.
const _messageBus = new Map();

// Central robotAPI object — the only surface the generated JS code calls into.

export const robotAPI = {

  // ── Console I/O ───────────────────────────────────────────────────────────

  println(text) {
    const s = String(text ?? '');
    console.log('[robot]', s);
    appendConsoleMessage(s, 'info');
    println_display(s);
  },

  print(text) { this.println(text); },

  warn(text) {
    const s = String(text ?? '');
    console.warn('[robot]', s);
    appendConsoleMessage(s, 'warn');
  },

  error(text) {
    const s = String(text ?? '');
    console.error('[robot]', s);
    appendConsoleMessage(s, 'error');
  },

  serial_print(text) { this.println(text); },

  // ── Locomotion — synchronous ───────────────────────────────────────────────

  // robActions_motorDiff_on
  drive(direction, power) {
    const p = Number(power) || 0;
    const sign = String(direction) === 'BACKWARD' ? -1 : 1;
    setWheelSpeeds(sign * p, sign * p);
  },

  // robActions_motorDiff_stop
  drive_stop() { setWheelSpeeds(0, 0); },

  // robActions_motorDiff_turn (continuous pivot)
  turn(direction, power) {
    const p = Number(power) || 0;
    if (String(direction) === 'LEFT') {
      setWheelSpeeds(-p, p);   // left backward, right forward → CCW → left
    } else {
      setWheelSpeeds(p, -p);   // left forward, right backward → CW → right
    }
  },

  // robActions_motorDiff_curve (continuous curve)
  curve(direction, powerL, powerR) {
    const pL = Number(powerL) || 0;
    const pR = Number(powerR) || 0;
    const sign = String(direction) === 'BACKWARD' ? -1 : 1;
    setWheelSpeeds(sign * pL, sign * pR);
  },

  // robActions_motor_on (single motor, runs forever)
  motor_on(port, power) {
    const p = Number(power) || 0;
    if (String(port) === 'EM1') {
      setWheelSpeeds(p, robot.vR);
    } else {
      setWheelSpeeds(robot.vL, p);
    }
  },

  // robActions_motor_stop (single motor)
  motor_stop(port) {
    if (String(port) === 'EM1') {
      setWheelSpeeds(0, robot.vR);
    } else {
      setWheelSpeeds(robot.vL, 0);
    }
  },

  // robActions_motorDiff_stop / general stop
  EM_stop() { setWheelSpeeds(0, 0); },

  // Legacy aliases kept for any pre-4-1 callers
  drive_speed(left, right) { setWheelSpeeds(Number(left) || 0, Number(right) || 0); },
  set_motor_speed(port, speed) { this.motor_on(port, speed); },

  // ── Locomotion — asynchronous ──────────────────────────────────────────────

  // robActions_motorDiff_on_for — drive straight for distance (cm)
  drive_for(direction, power, distance_cm, callback) {
    const p = Number(power) || 0;
    const d = Math.abs(Number(distance_cm) || 0);
    const sign = String(direction) === 'BACKWARD' ? -1 : 1;
    setWheelSpeeds(sign * p, sign * p);
    const startDist = robot.totalDistanceCm;
    asyncTicket.pending = true;
    asyncTicket.callback = callback;
    asyncTicket.resolveCondition = () => {
      const traveled = robot.totalDistanceCm - startDist;
      if (traveled >= d) {
        // Snap back the overshoot so the robot lands exactly at the target distance.
        // The canvas loop already advanced the position by one full frame; we undo the excess.
        const overshoot = traveled - d;
        if (overshoot > 0) {
          // Wheel travel continues while the body slides or stalls against a wall.
          if (!robot.collided) {
            robot.x -= sign * Math.cos(robot.theta) * overshoot;
            robot.y -= sign * Math.sin(robot.theta) * overshoot;
          }
          robot.totalDistanceCm -= overshoot;
        }
        setWheelSpeeds(0, 0);
        return true;
      }
      return false;
    };
  },

  // robActions_motorDiff_turn_for — pivot turn for degrees
  turn_for(direction, power, degrees, callback) {
    const p = Math.abs(Number(power) || 0);
    const targetRad = Math.abs(Number(degrees) || 0) * Math.PI / 180;
    // RIGHT → left forward / right backward → (vL−vR)/L > 0 → theta increases (CW)
    // LEFT  → left backward / right forward → (vL−vR)/L < 0 → theta decreases (CCW)
    const turnSign = String(direction) === 'RIGHT' ? 1 : -1;
    setWheelSpeeds(turnSign * p, -turnSign * p);
    const startRot = robot.totalRotationRad;
    asyncTicket.pending = true;
    asyncTicket.callback = callback;
    asyncTicket.resolveCondition = () => {
      const turned = robot.totalRotationRad - startRot;
      if (turned >= targetRad) {
        const overshoot = turned - targetRad;
        if (overshoot > 0) {
          robot.theta -= turnSign * overshoot;
          // Normalise theta to (-π, π]
          if (robot.theta > Math.PI)  robot.theta -= 2 * Math.PI;
          if (robot.theta < -Math.PI) robot.theta += 2 * Math.PI;
          robot.totalRotationRad -= overshoot;
          // robot.gyroCumulativeRad is intentionally NOT corrected here.
          // The async ticket resolves the frame AFTER the threshold is crossed, so
          // the robot turns slightly past the target before wheels stop. This gives
          // the gyro a ~1-3° reading overshoot — matching real CyberPi inertia
          // behaviour. The accepted tolerance per Phase 4 spec is ≤4°.
        }
        setWheelSpeeds(0, 0);
        return true;
      }
      return false;
    };
  },

  // robActions_motorDiff_curve_for — drive curved for distance (cm)
  curve_for(direction, powerL, powerR, distance_cm, callback) {
    const pL = Number(powerL) || 0;
    const pR = Number(powerR) || 0;
    const d = Math.abs(Number(distance_cm) || 0);
    const sign = String(direction) === 'BACKWARD' ? -1 : 1;
    setWheelSpeeds(sign * pL, sign * pR);
    const startDist = robot.totalDistanceCm;
    asyncTicket.pending = true;
    asyncTicket.callback = callback;
    asyncTicket.resolveCondition = () => {
      const traveled = robot.totalDistanceCm - startDist;
      if (traveled >= d) {
        const overshoot = traveled - d;
        if (overshoot > 0) {
          // Approximate correction along the current heading (good enough for small overshoot)
          if (!robot.collided) {
            robot.x -= sign * Math.cos(robot.theta) * overshoot;
            robot.y -= sign * Math.sin(robot.theta) * overshoot;
          }
          robot.totalDistanceCm -= overshoot;
        }
        setWheelSpeeds(0, 0);
        return true;
      }
      return false;
    };
  },

  // robActions_motor_on_for — single motor for rotations or degrees
  motor_on_for(port, power, value, motorRotation, callback) {
    const p = Number(power) || 0;
    const rotations = String(motorRotation) === 'DEGREE'
      ? Math.abs(Number(value) || 0) / 360
      : Math.abs(Number(value) || 0);
    const isLeft = String(port) === 'EM1';
    if (isLeft) {
      setWheelSpeeds(p, robot.vR);
    } else {
      setWheelSpeeds(robot.vL, p);
    }
    const startEnc = isLeft ? robot.encoderLeftAbs : robot.encoderRightAbs;
    asyncTicket.pending = true;
    asyncTicket.callback = callback;
    asyncTicket.resolveCondition = () => {
      const enc = isLeft ? robot.encoderLeftAbs : robot.encoderRightAbs;
      const traveled = enc - startEnc;
      if (traveled >= rotations) {
        const overshoot = traveled - rotations;
        if (overshoot > 0) {
          if (isLeft) robot.encoderLeftAbs  -= overshoot;
          else        robot.encoderRightAbs -= overshoot;
        }
        if (isLeft) setWheelSpeeds(0, robot.vR);
        else        setWheelSpeeds(robot.vL, 0);
        return true;
      }
      return false;
    };
  },

  // wait_ms — suspend execution for ms (Phase 4-3 control block, but registered here)
  wait_ms(ms, callback) {
    const endTime = performance.now() + Math.max(0, Number(ms) || 0);
    asyncTicket.pending = true;
    asyncTicket.callback = callback;
    asyncTicket.resolveCondition = () => performance.now() >= endTime;
  },

  // ── Audio ─────────────────────────────────────────────────────────────────

  play_tone(freq, ms)      { _play_tone(freq, ms); },
  play_note(note, dur)     { _play_note(note, dur); },
  play_recording(name)     { console.log('[audio] play_recording stub:', name); },
  audio_stop()             { _audio_stop(); },
  set_volume(v)            { _set_volume(v); },
  get_volume()             { return _get_volume(); },

  // ── Display ───────────────────────────────────────────────────────────────

  display_text(text, col, row)          { _display_text(text, col, row); },
  display_show_label(text, size, x, y)  { _display_show_label(text, size, x, y); },
  display_set_colour(hex)               { _display_set_colour(hex); },
  display_fill(colour)                  { _display_fill(colour); },
  display_draw_pixel(x, y, colour)      { _display_draw_pixel(x, y, colour); },
  display_clear()                       { _display_clear(); },

  // ── LED ───────────────────────────────────────────────────────────────────

  led_on(led, colour)    { _led_on(led, colour); },
  led_off(led)           { _led_off(led); },
  led_set_all(colour)    { _led_set_all(colour); },
  led_brightness(b)      { /* brightness applied globally to all LEDs — stub */ },
  ultrasonic_led(led, b) { /* ultrasonic ring LED brightness — stub */ },
  quadrgb_led_on(hex)    { /* quad RGB sensor LED — stub */ },
  quadrgb_led_off()      { /* quad RGB sensor LED off — stub */ },

  // ── Sensors (Phase 4-2) ───────────────────────────────────────────────────

  ultrasonic()         { return sensorUltrasonic(); },
  ultrasonic_get()     { return sensorUltrasonic(); },

  // Legacy single-probe API (defaults to probe 1)
  quadrgb(mode) {
    if (mode === 'RGB')   return sensorQuadRGBRGB();
    if (mode === 'LIGHT') return sensorQuadRGBBrightness();
    if (mode === 'LINE')  return sensorQuadRGBLine();
    return sensorQuadRGBColour(); // COLOUR or default
  },

  // Per-probe API: property=COLOUR|LIGHT|RGB, sensor='1', probe='1'..'4'
  quadRGB(property, _sensor, probe) {
    return sensorQuadRGBForProbe(String(property), parseInt(probe, 10) || 1);
  },

  // 4-bit bitmask (0–15): bit0=probe1(LSB/left)..bit3=probe4(MSB/right)
  // bit=1 → light (off line), bit=0 → dark (on line). Threshold: brightness > 128.
  lineSensor(_sensor) { return sensorQuadRGBLine(); },

  sound()              { return sensorSound(); },
  sound_record(cmd, _dur) { console.log('[audio] sound_record stub:', cmd); },

  joystick(direction)  { return sensorJoystick(direction); },
  key(name)            { return sensorKey(name); },

  light()              { return sensorLight(); },

  gyro(slot, axis)     { return sensorGyro(slot, axis); },
  gyro_reset(axis)     { sensorGyroReset(axis); },

  accel(axis)          { return sensorAccelerometer(axis); },

  line(mode)           { return sensorLine(mode); },

  timer(slot)          { return sensorTimer(slot); },
  timer_reset(slot)    { sensorTimerReset(slot); },

  encoder(port, mode)  { return sensorEncoder(port, mode); },
  encoder_reset(port)  { sensorEncoderReset(port); },

  // ── Communication (local pub/sub bus — single-robot sim) ─────────────────
  // CLAUDE.md rule 6: no real multi-robot comms; bus is local loopback only.
  // send_message / receive_message are synchronous (no async ticket).

  send_message(channel, msg) {
    const ch = String(channel ?? 'default');
    if (!_messageBus.has(ch)) _messageBus.set(ch, []);
    _messageBus.get(ch).push(String(msg ?? ''));
    appendConsoleMessage('[msg→' + ch + '] ' + String(msg ?? ''), 'info');
  },

  receive_message(channel) {
    const ch = String(channel ?? 'default');
    const queue = _messageBus.get(ch);
    if (!queue || queue.length === 0) return '';
    return queue.shift();
  },

  comm_send(channel, message) { this.send_message(channel, message); },
  comm_receive(channel) { return this.receive_message(channel); },

  _resetMessageBus() { _messageBus.clear(); },
};

// Mark async methods so sandbox.js uses createAsyncFunction for them
robotAPI.drive_for._async    = true;
robotAPI.turn_for._async     = true;
robotAPI.curve_for._async    = true;
robotAPI.motor_on_for._async = true;
robotAPI.wait_ms._async      = true;
