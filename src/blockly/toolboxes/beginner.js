// Mirrors program.toolbox.beginner.xml exactly.
// Custom blocks render as ⚠ stubs (Phase 3B will replace them).
export const beginnerToolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '%{BKY_BLOCK_ACTION}',
      colour: '20',
      contents: [
        {
          kind: 'block',
          type: 'robActions_motorDiff_on_for',
          inputs: {
            POWER:    { shadow: { type: 'math_number', fields: { NUM: 30 } } },
            DISTANCE: { shadow: { type: 'math_number', fields: { NUM: 10 } } },
          },
        },
        {
          kind: 'block',
          type: 'robActions_motorDiff_on',
          inputs: {
            POWER: { shadow: { type: 'math_number', fields: { NUM: 30 } } },
          },
        },
        { kind: 'block', type: 'robActions_motorDiff_stop' },
        {
          kind: 'block',
          type: 'robActions_motorDiff_turn_for',
          inputs: {
            POWER:  { shadow: { type: 'math_number', fields: { NUM: 30 } } },
            DEGREE: { shadow: { type: 'math_number', fields: { NUM: 20 } } },
          },
        },
        {
          kind: 'block',
          type: 'robActions_motorDiff_turn',
          inputs: {
            POWER: { shadow: { type: 'math_number', fields: { NUM: 30 } } },
          },
        },
        {
          kind: 'block',
          type: 'robActions_motorDiff_curve_for',
          inputs: {
            POWER_LEFT:  { shadow: { type: 'math_number', fields: { NUM: 10 } } },
            POWER_RIGHT: { shadow: { type: 'math_number', fields: { NUM: 30 } } },
            DISTANCE:    { shadow: { type: 'math_number', fields: { NUM: 20 } } },
          },
        },
        {
          kind: 'block',
          type: 'robActions_motorDiff_curve',
          inputs: {
            POWER_LEFT:  { shadow: { type: 'math_number', fields: { NUM: 10 } } },
            POWER_RIGHT: { shadow: { type: 'math_number', fields: { NUM: 30 } } },
          },
        },
        {
          kind: 'block',
          type: 'robActions_println',
          inputs: {
            OUT: { shadow: { type: 'text', fields: { TEXT: 'Hallo' } } },
          },
        },
        { kind: 'block', type: 'robActions_display_clear' },
        {
          kind: 'block',
          type: 'mbedActions_play_tone',
          inputs: {
            FREQUENCE: { shadow: { type: 'math_number', fields: { NUM: 300 } } },
            DURATION:  { shadow: { type: 'math_number', fields: { NUM: 100 } } },
          },
        },
        { kind: 'block', type: 'mbedActions_play_note' },
        {
          kind: 'block',
          type: 'robActions_play_setVolume',
          inputs: {
            VOLUME: { shadow: { type: 'math_number', fields: { NUM: 50 } } },
          },
        },
        {
          kind: 'block',
          type: 'actions_rgbLed_hidden_on_mbot2',
          inputs: {
            COLOUR: { shadow: { type: 'robColour_picker', fields: { COLOUR: '#cc0000' } } },
          },
        },
        { kind: 'block', type: 'actions_rgbLed_hidden_off_mbot2' },
        {
          kind: 'block',
          type: 'robActions_led_setBrightness',
          inputs: {
            BRIGHTNESS: { shadow: { type: 'math_number', fields: { NUM: 50 } } },
          },
        },
      ],
    },
    {
      kind: 'category',
      name: '%{BKY_BLOCK_SENSORS}',
      colour: '200',
      contents: [
        { kind: 'block', type: 'robSensors_ultrasonic_getSample' },
        { kind: 'block', type: 'robSensors_quadrgb_getSample' },
        { kind: 'block', type: 'robSensors_sound_getSample' },
        { kind: 'block', type: 'robSensors_joystickKeys_getSample' },
        { kind: 'block', type: 'robSensors_key_getSample' },
        { kind: 'block', type: 'robSensors_gyro_getSample' },
        { kind: 'block', type: 'robSensors_gyro_reset_axis' },
        { kind: 'block', type: 'robSensors_timer_getSample' },
        { kind: 'block', type: 'robSensors_timer_reset' },
        { kind: 'block', type: 'robSensors_encoder_getSample' },
        { kind: 'block', type: 'robSensors_encoder_reset' },
      ],
    },
    {
      kind: 'category',
      name: '%{BKY_BLOCK_CONTROL}',
      colour: '120',
      contents: [
        { kind: 'block', type: 'robControls_if' },
        { kind: 'block', type: 'robControls_ifElse' },
        { kind: 'block', type: 'robControls_loopForever' },
        { kind: 'block', type: 'controls_flow_statements' },
        {
          kind: 'block',
          type: 'controls_repeat_ext',
          inputs: {
            TIMES: { shadow: { type: 'math_number', fields: { NUM: 10 } } },
          },
        },
        {
          kind: 'block',
          type: 'robControls_wait_time',
          inputs: {
            WAIT: { shadow: { type: 'math_number', fields: { NUM: 500 } } },
          },
        },
        {
          kind: 'block',
          type: 'robControls_wait_for',
          inputs: {
            WAIT0: {
              shadow: {
                type: 'logic_compare',
                inputs: {
                  A: { shadow: { type: 'robSensors_getSample' } },
                  B: { shadow: { type: 'logic_boolean' } },
                },
              },
            },
          },
        },
      ],
    },
    {
      kind: 'category',
      name: '%{BKY_BLOCK_LOGIC}',
      colour: '210',
      contents: [
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_boolean' },
      ],
    },
    {
      kind: 'category',
      name: '%{BKY_BLOCK_MATHS}',
      colour: '230',
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
      ],
    },
    // TOOLBOX_NN excluded per CLAUDE.md rule 6
    {
      kind: 'category',
      name: '%{BKY_BLOCK_TEXT}',
      colour: '160',
      contents: [
        { kind: 'block', type: 'text' },
        { kind: 'block', type: 'text_comment' },
      ],
    },
    {
      kind: 'category',
      name: '%{BKY_BLOCK_COLOUR_COR}',
      colour: '20',
      contents: [
        { kind: 'block', type: 'robColour_picker', fields: { COLOUR: '#cc0000' } },
        { kind: 'block', type: 'robColour_picker', fields: { COLOUR: '#ff6600' } },
        { kind: 'block', type: 'robColour_picker', fields: { COLOUR: '#ffff00' } },
        { kind: 'block', type: 'robColour_picker', fields: { COLOUR: '#33cc00' } },
        { kind: 'block', type: 'robColour_picker', fields: { COLOUR: '#33ffff' } },
        { kind: 'block', type: 'robColour_picker', fields: { COLOUR: '#3366ff' } },
        { kind: 'block', type: 'robColour_picker', fields: { COLOUR: '#cc33cc' } },
        { kind: 'block', type: 'robColour_picker', fields: { COLOUR: '#FFFFFF' } },
        { kind: 'block', type: 'robColour_picker', fields: { COLOUR: '#000000' } },
      ],
    },
    { kind: 'category', name: '%{BKY_BLOCK_VARIABLES}', custom: 'VARIABLE', colour: '330' },
  ],
};
