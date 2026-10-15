import { t } from '../../i18n/index.js';
import * as Blockly from 'blockly';

// kind: 'value' → setOutput(true); 'statement' → setPreviousStatement + setNextStatement
// inputs: value-input names that must exist on the block so toolbox shadow blocks can attach
//         (Blockly throws MissingConnection if you specify inputs.X.shadow but X doesn't exist)
const STUB_SPECS = new Map([
  // ── Drive / Move ──────────────────────────────────────────────────────────
  ['robActions_motorDiff_on_for',    { kind: 'statement', inputs: ['POWER', 'DISTANCE'] }],
  ['robActions_motorDiff_on',        { kind: 'statement', inputs: ['POWER'] }],
  ['robActions_motorDiff_stop',      { kind: 'statement', inputs: [] }],
  ['robActions_motorDiff_turn_for',  { kind: 'statement', inputs: ['POWER', 'DEGREE'] }],
  ['robActions_motorDiff_turn',      { kind: 'statement', inputs: ['POWER'] }],
  ['robActions_motorDiff_curve_for', { kind: 'statement', inputs: ['POWER_LEFT', 'POWER_RIGHT', 'DISTANCE'] }],
  ['robActions_motorDiff_curve',     { kind: 'statement', inputs: ['POWER_LEFT', 'POWER_RIGHT'] }],
  ['robActions_motor_on',            { kind: 'statement', inputs: ['POWER'] }],
  ['robActions_motor_on_for',        { kind: 'statement', inputs: ['POWER', 'VALUE'] }],
  ['robActions_motor_stop',          { kind: 'statement', inputs: [] }],
  // ── Display ───────────────────────────────────────────────────────────────
  ['robActions_display_text',        { kind: 'statement', inputs: ['OUT', 'COL', 'ROW'] }],
  ['robActions_println',             { kind: 'statement', inputs: ['OUT'] }],
  ['robActions_display_set_colour',  { kind: 'statement', inputs: ['COLOR'] }],
  ['robActions_display_clear',       { kind: 'statement', inputs: [] }],
  ['robActions_serial_print',        { kind: 'statement', inputs: ['OUT'] }],
  // ── Sound ─────────────────────────────────────────────────────────────────
  ['mbedActions_play_tone',          { kind: 'statement', inputs: ['FREQUENCE', 'DURATION'] }],
  ['robActions_play_setVolume',      { kind: 'statement', inputs: ['VOLUME'] }],
  ['robActions_play_getVolume',      { kind: 'value',     inputs: [] }],
  ['mbedActions_play_note',          { kind: 'statement', inputs: [] }],
  ['robActions_play_recording',      { kind: 'statement', inputs: [] }],
  // ── Light ─────────────────────────────────────────────────────────────────
  ['actions_rgbLed_hidden_on_mbot2', { kind: 'statement', inputs: ['COLOUR'] }],
  ['actions_rgbLed_hidden_off_mbot2',{ kind: 'statement', inputs: [] }],
  ['robActions_led_setBrightness',   { kind: 'statement', inputs: ['BRIGHTNESS'] }],
  ['robActions_ultrasonic2_led',     { kind: 'statement', inputs: ['BRIGHTNESS'] }],
  ['robActions_quadRGB_led_on',      { kind: 'statement', inputs: ['COLOR'] }],
  ['robActions_quadRGB_led_off',     { kind: 'statement', inputs: [] }],
  // ── Sensors ───────────────────────────────────────────────────────────────
  ['robSensors_ultrasonic_getSample',    { kind: 'value', inputs: [] }],
  ['robSensors_quadrgb_getSample',       { kind: 'value', inputs: [] }],
  ['robSensors_sound_getSample',         { kind: 'value', inputs: [] }],
  ['robSensors_sound_record',            { kind: 'statement', inputs: [] }],
  ['robSensors_joystickKeys_getSample',  { kind: 'value', inputs: [] }],
  ['robSensors_key_getSample',           { kind: 'value', inputs: [] }],
  ['robSensors_light_getSample',         { kind: 'value', inputs: [] }],
  ['robSensors_gyro_getSample',          { kind: 'value', inputs: [] }],
  ['robSensors_gyro_reset_axis',         { kind: 'statement', inputs: [] }],
  ['robSensors_accelerometer_getSample', { kind: 'value', inputs: [] }],
  ['robSensors_timer_getSample',         { kind: 'value', inputs: [] }],
  ['robSensors_timer_reset',             { kind: 'statement', inputs: [] }],
  ['robSensors_encoder_getSample',       { kind: 'value', inputs: [] }],
  ['robSensors_encoder_reset',           { kind: 'statement', inputs: [] }],
  ['robSensors_line_getSample',          { kind: 'value', inputs: [] }],
  ['robSensors_getSample',               { kind: 'value', inputs: [] }],
  // ── Control ───────────────────────────────────────────────────────────────
  ['robControls_if',         { kind: 'statement', inputs: [] }],
  ['robControls_ifElse',     { kind: 'statement', inputs: [] }],
  ['robControls_loopForever',{ kind: 'statement', inputs: [] }],
  ['robControls_for',        { kind: 'statement', inputs: ['FROM', 'TO', 'BY'] }],
  ['robControls_forEach',    { kind: 'statement', inputs: [] }],
  ['robControls_wait',       { kind: 'statement', inputs: [] }],
  ['robControls_wait_time',  { kind: 'statement', inputs: ['WAIT'] }],
  ['robControls_wait_for',   { kind: 'statement', inputs: ['WAIT0'] }],
  // ── Math / Text / List (custom) ───────────────────────────────────────────
  ['robMath_change',              { kind: 'statement', inputs: ['DELTA'] }],
  ['math_cast_toString',          { kind: 'value',     inputs: [] }],
  ['math_cast_toChar',            { kind: 'value',     inputs: [] }],
  ['text_cast_string_toNumber',   { kind: 'value',     inputs: [] }],
  ['text_cast_char_toNumber',     { kind: 'value',     inputs: [] }],
  ['robText_join',                { kind: 'value',     inputs: [] }],
  ['robText_append',              { kind: 'statement', inputs: [] }],
  ['text_comment',                { kind: 'statement', inputs: [] }],
  ['robLists_create_with',        { kind: 'value',     inputs: [] }],
  ['robLists_repeat',             { kind: 'value',     inputs: ['NUM'] }],
  ['robLists_length',             { kind: 'value',     inputs: [] }],
  ['robLists_isEmpty',            { kind: 'value',     inputs: [] }],
  ['robLists_indexOf',            { kind: 'value',     inputs: [] }],
  ['robLists_getIndex',           { kind: 'value',     inputs: [] }],
  ['robLists_setIndex',           { kind: 'statement', inputs: [] }],
  ['robLists_getSublist',         { kind: 'value',     inputs: [] }],
  // ── Colour ────────────────────────────────────────────────────────────────
  ['robColour_picker', { kind: 'value', inputs: [] }],
  ['naoColour_rgb',    { kind: 'value', inputs: ['RED', 'GREEN', 'BLUE'] }],
  // ── Communication ─────────────────────────────────────────────────────────
  ['communication_send_message',    { kind: 'statement', inputs: ['CHANNEL', 'MESSAGE'] }],
  ['communication_receive_message', { kind: 'value',     inputs: ['CHANNEL'] }],
]);

export function registerUnknownStubs() {
  for (const [type, spec] of STUB_SPECS) {
    if (Blockly.Blocks[type]) continue;
    Blockly.Blocks[type] = {
      init() {
        this.appendDummyInput().appendField(`⚠ ${type}`);
        for (const name of spec.inputs) {
          this.appendValueInput(name);
        }
        this.setColour('#ff4444');
        this.setTooltip(t('BLOCK_BLOCK_NOT_YET_IMPLEMENTED_PHASE_3B'));
        if (spec.kind === 'value') {
          this.setOutput(true);
        } else {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
        }
      },
    };
  }
}
