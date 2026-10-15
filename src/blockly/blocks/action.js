import { t } from '../../i18n/index.js';
import * as Blockly from 'blockly';

export function registerActionBlocks() {
  // ── Drive ──────────────────────────────────────────────────────────────

  Blockly.Blocks['robActions_motorDiff_on'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_DRIVE'))
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_FORWARD'), 'FOREWARD'],
          [t('BLOCK_BACKWARD'),     'BACKWARD'],
        ]), 'DIRECTION')
        .appendField(t('BLOCK_AT_SPEED'));
      this.appendValueInput('POWER').setCheck('Number');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_DRIVE_THE_ROBOT_IN_A_DIRECTION_AT_A_SPEED'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robActions_motorDiff_on_for'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_DRIVE'))
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_FORWARD'), 'FOREWARD'],
          [t('BLOCK_BACKWARD'),     'BACKWARD'],
        ]), 'DIRECTION')
        .appendField(t('BLOCK_AT_SPEED'));
      this.appendValueInput('POWER').setCheck('Number');
      this.appendDummyInput().appendField(t('BLOCK_FOR_A_DISTANCE'));
      this.appendValueInput('DISTANCE').setCheck('Number');
      this.appendDummyInput().appendField('cm');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_DRIVE_THE_ROBOT_IN_A_DIRECTION_AT_A_SPEED_FOR_A_DISTANCE'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robActions_motorDiff_stop'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_STOP_DRIVING'));
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_STOP_THE_DRIVE_MOTORS'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robActions_motorDiff_turn'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_TURN'))
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_TO_THE_LEFT'), 'LEFT'],
          [t('BLOCK_TO_THE_RIGHT'),  'RIGHT'],
        ]), 'DIRECTION')
        .appendField(t('BLOCK_AT_SPEED'));
      this.appendValueInput('POWER').setCheck('Number');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_TURN_THE_ROBOT_CONTINUOUSLY_AT_A_SPEED'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robActions_motorDiff_turn_for'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_TURN'))
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_TO_THE_LEFT'), 'LEFT'],
          [t('BLOCK_TO_THE_RIGHT'),  'RIGHT'],
        ]), 'DIRECTION')
        .appendField(t('BLOCK_AT_SPEED'));
      this.appendValueInput('POWER').setCheck('Number');
      this.appendDummyInput().appendField(t('BLOCK_FOR'));
      this.appendValueInput('DEGREE').setCheck('Number');
      this.appendDummyInput().appendField('°');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_TURN_THE_ROBOT_IN_A_DIRECTION_AT_A_SPEED_THROUGH_AN_ANGLE'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robActions_motorDiff_curve'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_DRIVE_IN_A_CURVE'))
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_FORWARD'), 'FOREWARD'],
          [t('BLOCK_BACKWARD'),     'BACKWARD'],
        ]), 'DIRECTION')
        .appendField(t('BLOCK_LEFT_SPEED'));
      this.appendValueInput('POWER_LEFT').setCheck('Number');
      this.appendDummyInput().appendField(t('BLOCK_RIGHT_SPEED'));
      this.appendValueInput('POWER_RIGHT').setCheck('Number');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_DRIVE_THE_ROBOT_IN_A_CURVE_WITH_INDEPENDENT_SPEEDS_FOR_EACH_MOTOR'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robActions_motorDiff_curve_for'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_DRIVE_IN_A_CURVE'))
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_FORWARD'), 'FOREWARD'],
          [t('BLOCK_BACKWARD'),     'BACKWARD'],
        ]), 'DIRECTION')
        .appendField(t('BLOCK_LEFT_SPEED'));
      this.appendValueInput('POWER_LEFT').setCheck('Number');
      this.appendDummyInput().appendField(t('BLOCK_RIGHT_SPEED'));
      this.appendValueInput('POWER_RIGHT').setCheck('Number');
      this.appendDummyInput().appendField(t('BLOCK_FOR_A_DISTANCE'));
      this.appendValueInput('DISTANCE').setCheck('Number');
      this.appendDummyInput().appendField('cm');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_DRIVE_THE_ROBOT_IN_A_CURVE_WITH_INDEPENDENT_SPEEDS_FOR_A_DISTANCE'));
      this.setHelpUrl('');
    },
  };

  // ── Single motor ────────────────────────────────────────────────────────

  Blockly.Blocks['robActions_motor_on'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_MOTOR'))
        .appendField(new Blockly.FieldDropdown([
          ['EM1', 'EM1'],
          ['EM2', 'EM2'],
        ]), 'MOTORPORT')
        .appendField(t('BLOCK_START_AT_SPEED'));
      this.appendValueInput('POWER').setCheck('Number');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_START_A_MOTOR_AT_A_SPEED'));
      this.setHelpUrl('');
    },
  };

  // Input is named VALUE (not ROTATIONS) — matches toolbox shadow definition.
  Blockly.Blocks['robActions_motor_on_for'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_MOTOR'))
        .appendField(new Blockly.FieldDropdown([
          ['EM1', 'EM1'],
          ['EM2', 'EM2'],
        ]), 'MOTORPORT')
        .appendField(t('BLOCK_START_AT_SPEED'));
      this.appendValueInput('POWER').setCheck('Number');
      this.appendDummyInput().appendField(t('BLOCK_FOR'));
      this.appendValueInput('VALUE').setCheck('Number');
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_ROTATIONS'), 'ROTATIONS'],
          [t('BLOCK_DEGREES'),    'DEGREE'],
        ]), 'MOTORROTATION');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_START_A_MOTOR_AT_A_SPEED_FOR_A_NUMBER_OF_ROTATIONS_OR_DEGREES'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robActions_motor_stop'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_MOTOR'))
        .appendField(new Blockly.FieldDropdown([
          ['EM1', 'EM1'],
          ['EM2', 'EM2'],
        ]), 'MOTORPORT')
        .appendField(t('BLOCK_STOP'));
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_STOP_A_MOTOR'));
      this.setHelpUrl('');
    },
  };

  // ── Display ─────────────────────────────────────────────────────────────

  Blockly.Blocks['robActions_display_text'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_SHOW_TEXT'));
      this.appendValueInput('OUT');
      this.appendDummyInput().appendField(t('BLOCK_AT_COLUMN'));
      this.appendValueInput('COL').setCheck('Number');
      this.appendDummyInput().appendField(t('BLOCK_AT_ROW'));
      this.appendValueInput('ROW').setCheck('Number');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_SHOW_TEXT_ON_THE_SCREEN_AT_A_SPECIFIC_POSITION'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robActions_println'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_PRINT_LINE'));
      this.appendValueInput('OUT');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_PRINT_A_LINE_OF_TEXT_ON_THE_SCREEN'));
      this.setHelpUrl('');
    },
  };

  // Input named COLOR (American spelling) — matches toolbox shadow definition.
  Blockly.Blocks['robActions_display_set_colour'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_SET_SCREEN_COLOUR'));
      this.appendValueInput('COLOR').setCheck('Colour');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_SET_THE_SCREEN_BACKGROUND_COLOUR'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robActions_display_clear'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_CLEAR_SCREEN'));
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_CLEAR_THE_SCREEN'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robActions_serial_print'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_SEND_TO_CONSOLE'));
      this.appendValueInput('OUT');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_SEND_TEXT_TO_THE_CONSOLE'));
      this.setHelpUrl('');
    },
  };

  // ── Sound ────────────────────────────────────────────────────────────────

  // Input name is FREQUENCE (not FREQUENCY) — matches toolbox shadow definition.
  Blockly.Blocks['mbedActions_play_tone'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_PLAY_TONE_AT_FREQUENCY'));
      this.appendValueInput('FREQUENCE').setCheck('Number');
      this.appendDummyInput().appendField(t('BLOCK_HZ_DURATION'));
      this.appendValueInput('DURATION').setCheck('Number');
      this.appendDummyInput().appendField('ms');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_PLAY_A_TONE_AT_A_FREQUENCY_FOR_A_DURATION'));
      this.setHelpUrl('');
    },
  };

  // ⚠ NOTE and DURATION internal values may need verification against Open Roberta source.
  Blockly.Blocks['mbedActions_play_note'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_PLAY_NOTE'))
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_C4'),   'C4'],
          [t('BLOCK_D4'),   'D4'],
          [t('BLOCK_E4'),   'E4'],
          [t('BLOCK_F4'),   'F4'],
          [t('BLOCK_G4'),  'G4'],
          [t('BLOCK_A4'),   'A4'],
          [t('BLOCK_B4'),   'B4'],
          [t('BLOCK_C5'),   'C5'],
          [t('BLOCK_D5'),   'D5'],
          [t('BLOCK_E5'),   'E5'],
          [t('BLOCK_F5'),   'F5'],
          [t('BLOCK_G5'),  'G5'],
          [t('BLOCK_A5'),   'A5'],
          [t('BLOCK_B5'),   'B5'],
          [t('BLOCK_C6'),   'C6'],
          [t('BLOCK_REST'), 'PAUSE'],
        ]), 'NOTE')
        .appendField(t('BLOCK_FOR_DURANTE'))
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_EIGHTH_NOTE_1_8'),  '8'],
          [t('BLOCK_QUARTER_NOTE_1_4'), '4'],
          [t('BLOCK_HALF_NOTE_1_2'),   '2'],
          [t('BLOCK_WHOLE_NOTE_1_1'),'1'],
        ]), 'DURATION');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_PLAY_A_MUSICAL_NOTE_FOR_A_DURATION'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robActions_play_setVolume'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_SET_VOLUME'));
      this.appendValueInput('VOLUME').setCheck('Number');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_SET_THE_SPEAKER_VOLUME_0_100'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robActions_play_getVolume'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_VOLUME'));
      this.setOutput(true, 'Number');
      this.setColour('20');
      this.setTooltip(t('BLOCK_GET_THE_CURRENT_SPEAKER_VOLUME'));
      this.setHelpUrl('');
    },
  };

  // ⚠ Recording names are placeholder stubs — extend in Phase 6.
  Blockly.Blocks['robActions_play_recording'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_PLAY_RECORDING'))
        .appendField(new Blockly.FieldDropdown([
          ['hi',  'hi'],
          ['bye', 'bye'],
          ['yes', 'yes'],
          ['no',  'no'],
        ]), 'FILENAME');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_PLAY_AN_AUDIO_RECORDING'));
      this.setHelpUrl('');
    },
  };

  // ── Light ────────────────────────────────────────────────────────────────

  // ⚠ LED dropdown options for mbot2 body LEDs — verify count against hardware spec.
  // Input named COLOUR (British spelling) — matches toolbox shadow definition.
  Blockly.Blocks['actions_rgbLed_hidden_on_mbot2'] = {
    init() {
      this.appendDummyInput()
        .appendField('LED')
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_ALL'), 'ALL'],
          ['1',     '1'],
          ['2',     '2'],
          ['3',     '3'],
          ['4',     '4'],
          ['5',     '5'],
        ]), 'LED')
        .appendField(t('BLOCK_TURN_ON_WITH_COLOUR'));
      this.appendValueInput('COLOUR').setCheck('Colour');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_TURN_ON_A_ROBOT_RGB_LED_WITH_A_COLOUR'));
      this.setHelpUrl('');
    },
  };

  // ⚠ LED dropdown options — same as actions_rgbLed_hidden_on_mbot2.
  Blockly.Blocks['actions_rgbLed_hidden_off_mbot2'] = {
    init() {
      this.appendDummyInput()
        .appendField('LED')
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_ALL'), 'ALL'],
          ['1',     '1'],
          ['2',     '2'],
          ['3',     '3'],
          ['4',     '4'],
          ['5',     '5'],
        ]), 'LED')
        .appendField(t('BLOCK_TURN_OFF'));
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_TURN_OFF_A_ROBOT_RGB_LED'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robActions_led_setBrightness'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_SET_LED_BRIGHTNESS'));
      this.appendValueInput('BRIGHTNESS').setCheck('Number');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_SET_THE_RGB_LED_BRIGHTNESS_0_100'));
      this.setHelpUrl('');
    },
  };

  // Toolbox shadow has single BRIGHTNESS input — simpler than 8-slot spec.
  // ⚠ LED dropdown options for ultrasonic sensor ring — verify count against hardware.
  Blockly.Blocks['robActions_ultrasonic2_led'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_ULTRASONIC_LED'))
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_ALL'), 'ALL'],
          ['1',     '1'],
          ['2',     '2'],
        ]), 'LED')
        .appendField(t('BLOCK_BRIGHTNESS'));
      this.appendValueInput('BRIGHTNESS').setCheck('Number');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_SET_THE_ULTRASONIC_SENSOR_LED_BRIGHTNESS'));
      this.setHelpUrl('');
    },
  };

  // Input named COLOR (American spelling) — matches toolbox shadow definition.
  Blockly.Blocks['robActions_quadRGB_led_on'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_RGB_SENSOR_LED_ON_WITH_COLOUR'));
      this.appendValueInput('COLOR').setCheck('Colour');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_TURN_ON_THE_QUAD_RGB_SENSOR_LED_WITH_A_COLOUR'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robActions_quadRGB_led_off'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_RGB_SENSOR_LED_OFF'));
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('20');
      this.setTooltip(t('BLOCK_TURN_OFF_THE_QUAD_RGB_SENSOR_LED'));
      this.setHelpUrl('');
    },
  };
}
