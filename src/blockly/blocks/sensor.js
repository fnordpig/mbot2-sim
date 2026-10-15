import { t } from '../../i18n/index.js';
import * as Blockly from 'blockly';

export function registerSensorBlocks() {

  // ── Distance / Vision ──────────────────────────────────────────────────

  Blockly.Blocks['robSensors_ultrasonic_getSample'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_ULTRASONIC_SENSOR_VALUE'))
        .appendField(new Blockly.FieldDropdown([
          ['1', '1'],
        ]), 'SENSORPORT')
        .appendField(t('BLOCK_IN_CM'));
      this.setOutput(true, 'Number');
      this.setColour('200');
      this.setTooltip(t('BLOCK_READ_THE_ULTRASONIC_SENSOR_DISTANCE_IN_CM_0_300_CM_300_NO_ECHO'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robSensors_quadrgb_getSample'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_RGB_SENSOR_VALUE'))
        .appendField(new Blockly.FieldDropdown([
          ['1', '1'],
        ]), 'SENSORPORT')
        .appendField(t('BLOCK_PROBE'))
        .appendField(new Blockly.FieldDropdown([
          ['1', '1'],
          ['2', '2'],
          ['3', '3'],
          ['4', '4'],
        ]), 'SLOT')
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_COLOUR'),       'COLOUR'],
          [t('BLOCK_LIGHT_LEVEL'), 'LIGHT'],
          ['RGB',       'RGB'],
        ]), 'MODE');
      this.setOutput(true, null);
      this.setColour('200');
      this.setTooltip(t('BLOCK_READ_ONE_PROBE_1_4_OF_THE_QUAD_RGB_SENSOR_RETURNS_A_COLOUR_NAME_COLOUR_BRIGHTNESS_0_100_LIGHT_OR_AN_R_G_B_LIST_RGB'));
      this.setHelpUrl('');
    },
  };

  // ── Onboard sensors ────────────────────────────────────────────────────

  Blockly.Blocks['robSensors_sound_getSample'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_MICROPHONE_VALUE_IN'));
      this.setOutput(true, 'Number');
      this.setColour('200');
      this.setTooltip(t('BLOCK_READ_THE_BUILT_IN_MICROPHONE_SOUND_LEVEL_0_100'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robSensors_sound_record'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_RECORD_SOUND'))
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_START'), 'START'],
          [t('BLOCK_STOP'),   'STOP'],
        ]), 'CMD')
        .appendField(t('BLOCK_FOR_DURANTE'));
      this.appendValueInput('DURATION').setCheck('Number');
      this.appendDummyInput().appendField('s');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('200');
      this.setTooltip(t('BLOCK_START_OR_STOP_SOUND_RECORDING_FOR_A_DURATION_IN_SECONDS'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robSensors_joystickKeys_getSample'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_JOYSTICK_DIRECTION_VALUE'))
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_UP'),     'UP'],
          [t('BLOCK_DOWN'),    'DOWN'],
          [t('BLOCK_LEFT'), 'LEFT'],
          [t('BLOCK_RIGHT'),  'RIGHT'],
          [t('BLOCK_CENTRE'),   'MIDDLE'],
        ]), 'DIRECTION');
      this.setOutput(true, 'Boolean');
      this.setColour('200');
      this.setTooltip(t('BLOCK_CHECK_WHETHER_THE_JOYSTICK_IS_PRESSED_IN_THE_SPECIFIED_DIRECTION'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robSensors_key_getSample'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_BUTTON'))
        .appendField(new Blockly.FieldDropdown([
          ['A', 'A'],
          ['B', 'B'],
        ]), 'KEY')
        .appendField(t('BLOCK_PRESSED'));
      this.setOutput(true, 'Boolean');
      this.setColour('200');
      this.setTooltip(t('BLOCK_CHECK_WHETHER_BUTTON_A_OR_B_IS_PRESSED'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robSensors_light_getSample'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_LIGHT_SENSOR_VALUE_IN'));
      this.setOutput(true, 'Number');
      this.setColour('200');
      this.setTooltip(t('BLOCK_READ_THE_BUILT_IN_LIGHT_SENSOR_0_100'));
      this.setHelpUrl('');
    },
  };

  // ⚠ Field name SLOT (measurement type) could not be verified from XML — Open Roberta may use MODE instead.
  Blockly.Blocks['robSensors_gyro_getSample'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_GYROSCOPE'))
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_ANGLE'),     'ANGLE'],
          [t('BLOCK_SPEED'), 'RATE'],
        ]), 'SLOT')
        .appendField(new Blockly.FieldDropdown([
          ['x', 'X'],
          ['y', 'Y'],
          ['z', 'Z'],
        ]), 'AXIS');
      this.setOutput(true, 'Number');
      this.setColour('200');
      this.setTooltip(t('BLOCK_READ_THE_GYROSCOPE_ANGLE_DEGREES_OR_ANGULAR_SPEED_DEGREES_S_ON_AN_AXIS'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robSensors_gyro_reset_axis'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_RESET_GYROSCOPE'))
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_ALL'), 'ALL'],
          ['x',     'X'],
          ['y',     'Y'],
          ['z',     'Z'],
        ]), 'AXIS');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('200');
      this.setTooltip(t('BLOCK_RESET_THE_GYROSCOPE_ON_THE_SELECTED_AXIS'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robSensors_accelerometer_getSample'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_ACCELEROMETER'))
        .appendField(new Blockly.FieldDropdown([
          ['x', 'X'],
          ['y', 'Y'],
          ['z', 'Z'],
        ]), 'AXIS');
      this.setOutput(true, 'Number');
      this.setColour('200');
      this.setTooltip(t('BLOCK_READ_THE_ACCELEROMETER_ON_AN_AXIS'));
      this.setHelpUrl('');
    },
  };

  // ── Time / Encoder ─────────────────────────────────────────────────────

  Blockly.Blocks['robSensors_timer_getSample'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_TIMER'))
        .appendField(new Blockly.FieldDropdown([
          ['1', '1'],
          ['2', '2'],
        ]), 'SENSORPORT');
      this.setOutput(true, 'Number');
      this.setColour('200');
      this.setTooltip(t('BLOCK_READ_THE_TIMER_S_ELAPSED_TIME_IN_MS'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robSensors_timer_reset'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_RESET_TIMER'))
        .appendField(new Blockly.FieldDropdown([
          ['1', '1'],
          ['2', '2'],
        ]), 'SENSORPORT');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('200');
      this.setTooltip(t('BLOCK_RESET_THE_SELECTED_TIMER_TO_ZERO'));
      this.setHelpUrl('');
    },
  };

  // ⚠ MODE codes (ROTATION/DEGREE/DISTANCE) could not be verified from XML.
  Blockly.Blocks['robSensors_encoder_getSample'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_MOTOR_ENCODER'))
        .appendField(new Blockly.FieldDropdown([
          ['EM1', 'EM1'],
          ['EM2', 'EM2'],
        ]), 'MOTORPORT')
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_ROTATIONS'),  'ROTATION'],
          [t('BLOCK_DEGREES'),     'DEGREE'],
          [t('BLOCK_DISTANCE'), 'DISTANCE'],
        ]), 'MODE');
      this.setOutput(true, 'Number');
      this.setColour('200');
      this.setTooltip(t('BLOCK_READ_THE_MOTOR_ENCODER_ROTATIONS_DEGREES_OR_DISTANCE_IN_CM'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robSensors_encoder_reset'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_RESET_ENCODER'))
        .appendField(new Blockly.FieldDropdown([
          ['EM1', 'EM1'],
          ['EM2', 'EM2'],
        ]), 'MOTORPORT');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('200');
      this.setTooltip(t('BLOCK_RESET_THE_MOTOR_ENCODER_TO_ZERO'));
      this.setHelpUrl('');
    },
  };

  // ── Line follower ──────────────────────────────────────────────────────

  // ⚠ MODE codes (L/R/ALL/CODE) could not be verified from XML.
  Blockly.Blocks['robSensors_line_getSample'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_LINE_SENSOR'))
        .appendField(new Blockly.FieldDropdown([
          ['1', '1'],
        ]), 'SENSORPORT')
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_LEFT'), 'L'],
          [t('BLOCK_RIGHT'),  'R'],
          [t('BLOCK_BOTH'),    'ALL'],
          [t('BLOCK_CODE'),   'CODE'],
        ]), 'MODE');
      this.setOutput(true, null);
      this.setColour('200');
      this.setTooltip(t('BLOCK_READ_THE_LINE_SENSOR_LEFT_RIGHT_BOTH_BOOLEAN_OR_NUMERIC_CODE'));
      this.setHelpUrl('');
    },
  };

  // ── Generic dispatcher ─────────────────────────────────────────────────

  Blockly.Blocks['robSensors_getSample'] = {
    init() {
      // TODO Phase 4: dynamic field reconstruction based on SENSORTYPE
      this.appendDummyInput()
        .appendField(t('BLOCK_GET_VALUE_FROM'))
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_ULTRASONIC'), 'ULTRASONIC'],
          ['RGB',          'QUADRGB'],
          [t('BLOCK_BUTTON'),        'KEY'],
          [t('BLOCK_JOYSTICK'),     'JOYSTICK'],
          [t('BLOCK_LIGHT'),          'LIGHT'],
          [t('BLOCK_GYROSCOPE'),   'GYRO'],
          [t('BLOCK_ACCELEROMETER'), 'ACCEL'],
          [t('BLOCK_TIMER'), 'TIMER'],
          [t('BLOCK_ENCODER'),  'ENCODER'],
          [t('BLOCK_LINE'),        'LINE'],
          [t('BLOCK_SOUND'),          'SOUND'],
        ]), 'SENSORTYPE')
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_VALUE'),      'VALUE'],
          [t('BLOCK_COLOUR'),        'COLOR'],
          [t('BLOCK_LINE'),      'LINE'],
          [t('BLOCK_ANGLE'),     'ANGLE'],
          [t('BLOCK_SPEED'), 'RATE'],
          [t('BLOCK_STATE'),     'STA'],
          ['RGB',        'RGB'],
          [t('BLOCK_LIGHT_LEVEL'),  'BRIGHTNESS'],
        ]), 'SENSORMODE');
      this.setOutput(true, null);
      this.setColour('200');
      this.setTooltip(t('BLOCK_GENERIC_BLOCK_USE_INSIDE_A_WAIT_BLOCK'));
      this.setHelpUrl('');
    },
  };
}
