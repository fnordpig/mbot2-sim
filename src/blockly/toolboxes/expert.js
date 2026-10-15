// Mirrors program.toolbox.expert.xml exactly.
// Custom blocks render as ⚠ stubs (Phase 3B will replace them).
export const expertToolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '%{BKY_BLOCK_ACTION}',
      colour: '20',
      contents: [
        {
          kind: 'category',
          name: '%{BKY_BLOCK_MOVEMENT}',
          colour: '20',
          contents: [
            {
              kind: 'block',
              type: 'robActions_motor_on',
              inputs: {
                POWER: { shadow: { type: 'math_number', fields: { NUM: 30 } } },
              },
            },
            {
              kind: 'block',
              type: 'robActions_motor_on_for',
              inputs: {
                POWER: { shadow: { type: 'math_number', fields: { NUM: 30 } } },
                VALUE: { shadow: { type: 'math_number', fields: { NUM: 5 } } },
              },
            },
            { kind: 'block', type: 'robActions_motor_stop' },
          ],
        },
        {
          kind: 'category',
          name: '%{BKY_BLOCK_DRIVE_CONDUZIR}',
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
          ],
        },
        {
          kind: 'category',
          name: '%{BKY_BLOCK_SCREEN}',
          colour: '20',
          contents: [
            {
              kind: 'block',
              type: 'robActions_display_text',
              inputs: {
                OUT: { shadow: { type: 'text', fields: { TEXT: 'Hallo' } } },
                COL: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                ROW: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
              },
            },
            {
              kind: 'block',
              type: 'robActions_println',
              inputs: {
                OUT: { shadow: { type: 'text', fields: { TEXT: 'Hallo' } } },
              },
            },
            {
              kind: 'block',
              type: 'robActions_display_set_colour',
              inputs: {
                COLOR: { shadow: { type: 'robColour_picker', fields: { COLOUR: '#cc0000' } } },
              },
            },
            { kind: 'block', type: 'robActions_display_clear' },
            {
              kind: 'block',
              type: 'robActions_serial_print',
              inputs: {
                OUT: { shadow: { type: 'text', fields: { TEXT: 'Hallo' } } },
              },
            },
          ],
        },
        {
          kind: 'category',
          name: '%{BKY_BLOCK_SOUND_SOM}',
          colour: '20',
          contents: [
            {
              kind: 'block',
              type: 'mbedActions_play_tone',
              inputs: {
                FREQUENCE: { shadow: { type: 'math_number', fields: { NUM: 300 } } },
                DURATION:  { shadow: { type: 'math_number', fields: { NUM: 100 } } },
              },
            },
            {
              kind: 'block',
              type: 'robActions_play_setVolume',
              inputs: {
                VOLUME: { shadow: { type: 'math_number', fields: { NUM: 50 } } },
              },
            },
            { kind: 'block', type: 'robActions_play_getVolume' },
            { kind: 'block', type: 'mbedActions_play_note' },
            { kind: 'block', type: 'robActions_play_recording' },
          ],
        },
        {
          kind: 'category',
          name: '%{BKY_BLOCK_LIGHT_LUZ}',
          colour: '20',
          contents: [
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
            {
              kind: 'block',
              type: 'robActions_ultrasonic2_led',
              inputs: {
                BRIGHTNESS: { shadow: { type: 'math_number', fields: { NUM: 50 } } },
              },
            },
            {
              kind: 'block',
              type: 'robActions_quadRGB_led_on',
              inputs: {
                COLOR: { shadow: { type: 'robColour_picker', fields: { COLOUR: '#cc0000' } } },
              },
            },
            { kind: 'block', type: 'robActions_quadRGB_led_off' },
          ],
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
        { kind: 'block', type: 'robSensors_sound_record' },
        { kind: 'block', type: 'robSensors_joystickKeys_getSample' },
        { kind: 'block', type: 'robSensors_key_getSample' },
        { kind: 'block', type: 'robSensors_light_getSample' },
        { kind: 'block', type: 'robSensors_gyro_getSample' },
        { kind: 'block', type: 'robSensors_gyro_reset_axis' },
        { kind: 'block', type: 'robSensors_accelerometer_getSample' },
        { kind: 'block', type: 'robSensors_timer_getSample' },
        { kind: 'block', type: 'robSensors_timer_reset' },
        { kind: 'block', type: 'robSensors_encoder_getSample' },
        { kind: 'block', type: 'robSensors_encoder_reset' },
        { kind: 'block', type: 'robSensors_line_getSample' },
      ],
    },
    {
      kind: 'category',
      name: '%{BKY_BLOCK_CONTROL}',
      colour: '120',
      contents: [
        {
          kind: 'category',
          name: '%{BKY_BLOCK_DECISION}',
          colour: '120',
          contents: [
            { kind: 'block', type: 'robControls_if' },
            { kind: 'block', type: 'robControls_ifElse' },
          ],
        },
        {
          kind: 'category',
          name: '%{BKY_BLOCK_LOOPS}',
          colour: '120',
          contents: [
            { kind: 'block', type: 'robControls_loopForever' },
            {
              kind: 'block',
              type: 'controls_repeat_ext',
              inputs: {
                TIMES: { shadow: { type: 'math_number', fields: { NUM: 10 } } },
              },
            },
            { kind: 'block', type: 'controls_whileUntil' },
            {
              kind: 'block',
              type: 'robControls_for',
              inputs: {
                FROM: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
                TO:   { shadow: { type: 'math_number', fields: { NUM: 10 } } },
                BY:   { shadow: { type: 'math_number', fields: { NUM: 1 } } },
              },
            },
            { kind: 'block', type: 'robControls_forEach' },
            { kind: 'block', type: 'controls_flow_statements' },
          ],
        },
        {
          kind: 'category',
          name: '%{BKY_BLOCK_WAIT_ESPERAR}',
          colour: '120',
          contents: [
            { kind: 'block', type: 'robControls_wait' },
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
      ],
    },
    {
      kind: 'category',
      name: '%{BKY_BLOCK_LOGIC}',
      colour: '210',
      contents: [
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_negate' },
        { kind: 'block', type: 'logic_boolean' },
        { kind: 'block', type: 'logic_null' },
        { kind: 'block', type: 'logic_ternary' },
      ],
    },
    {
      kind: 'category',
      name: '%{BKY_BLOCK_MATHS}',
      colour: '230',
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
        { kind: 'block', type: 'math_single' },
        { kind: 'block', type: 'math_trig' },
        { kind: 'block', type: 'math_constant' },
        { kind: 'block', type: 'math_number_property' },
        {
          kind: 'block',
          type: 'robMath_change',
          inputs: {
            DELTA: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
          },
        },
        { kind: 'block', type: 'math_round' },
        { kind: 'block', type: 'math_on_list' },
        { kind: 'block', type: 'math_modulo' },
        {
          kind: 'block',
          type: 'math_constrain',
          inputs: {
            LOW:  { shadow: { type: 'math_number', fields: { NUM: 1 } } },
            HIGH: { shadow: { type: 'math_number', fields: { NUM: 100 } } },
          },
        },
        {
          kind: 'block',
          type: 'math_random_int',
          inputs: {
            FROM: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
            TO:   { shadow: { type: 'math_number', fields: { NUM: 100 } } },
          },
        },
        { kind: 'block', type: 'math_random_float' },
        { kind: 'block', type: 'math_cast_toString' },
        { kind: 'block', type: 'math_cast_toChar' },
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
        { kind: 'block', type: 'robText_join' },
        { kind: 'block', type: 'robText_append' },
        { kind: 'block', type: 'text_cast_string_toNumber' },
        { kind: 'block', type: 'text_cast_char_toNumber' },
      ],
    },
    {
      kind: 'category',
      name: '%{BKY_BLOCK_LISTS}',
      colour: '260',
      contents: [
        { kind: 'block', type: 'robLists_create_with' },
        {
          kind: 'block',
          type: 'robLists_create_with',
          inputs: {
            ADD0: { shadow: { type: 'math_number' } },
            ADD1: { shadow: { type: 'math_number' } },
            ADD2: { shadow: { type: 'math_number' } },
          },
        },
        {
          kind: 'block',
          type: 'robLists_repeat',
          inputs: {
            NUM: { shadow: { type: 'math_number', fields: { NUM: 5 } } },
          },
        },
        { kind: 'block', type: 'robLists_length' },
        { kind: 'block', type: 'robLists_isEmpty' },
        { kind: 'block', type: 'robLists_indexOf' },
        { kind: 'block', type: 'robLists_getIndex' },
        { kind: 'block', type: 'robLists_setIndex' },
        { kind: 'block', type: 'robLists_getSublist' },
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
        {
          kind: 'block',
          type: 'naoColour_rgb',
          inputs: {
            RED:   { shadow: { type: 'math_number', fields: { NUM: 255 } } },
            GREEN: { shadow: { type: 'math_number', fields: { NUM: 20 } } },
            BLUE:  { shadow: { type: 'math_number', fields: { NUM: 150 } } },
          },
        },
      ],
    },
    { kind: 'category', name: '%{BKY_BLOCK_VARIABLES}', custom: 'VARIABLE', colour: '330' },
    { kind: 'category', name: '%{BKY_BLOCK_FUNCTIONS}',   custom: 'PROCEDURE', colour: '290' },
    {
      kind: 'category',
      name: '%{BKY_BLOCK_COMMUNICATION}',
      colour: '0',
      contents: [
        {
          kind: 'block',
          type: 'communication_send_message',
          inputs: {
            CHANNEL: { shadow: { type: 'text', fields: { TEXT: 'Channel1' } } },
            MESSAGE: { shadow: { type: 'text', fields: { TEXT: '1' } } },
          },
        },
        {
          kind: 'block',
          type: 'communication_receive_message',
          inputs: {
            CHANNEL: { shadow: { type: 'text', fields: { TEXT: 'Channel1' } } },
          },
        },
      ],
    },
  ],
};
