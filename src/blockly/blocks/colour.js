import { t } from '../../i18n/index.js';
import * as Blockly from 'blockly';

export function registerColourBlocks() {

  // ── Named-colour picker (9-swatch palette) ─────────────────────────────
  // Field COLOUR stores hex strings matching the toolbox presets exactly.
  // XML source: reference_openroberta/program.toolbox.expert.xml (TOOLBOX_COLOUR).
  // Sensor palette order: red, orange, yellow, green, cyan, blue, purple, white, black.
  Blockly.Blocks['robColour_picker'] = {
    init() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          [t('BLOCK_RED'), '#cc0000'],
          [t('BLOCK_ORANGE'),  '#ff6600'],
          [t('BLOCK_YELLOW'),  '#ffff00'],
          [t('BLOCK_GREEN'),    '#33cc00'],
          [t('BLOCK_CYAN'),    '#33ffff'],
          [t('BLOCK_BLUE'),     '#3366ff'],
          [t('BLOCK_MAGENTA'),  '#cc33cc'],
          [t('BLOCK_WHITE'),   '#FFFFFF'],
          [t('BLOCK_BLACK'),    '#000000'],
        ]), 'COLOUR');
      this.setOutput(true, 'Colour');
      this.setColour('20');
      this.setTooltip(t('BLOCK_PRESET_COLOUR'));
      this.setHelpUrl('');
    },
  };

  // ── RGB colour constructor (expert toolbox only) ────────────────────────
  // Input names RED/GREEN/BLUE from XML: <value name="RED">, etc.
  Blockly.Blocks['naoColour_rgb'] = {
    init() {
      this.appendValueInput('RED').appendField(t('BLOCK_COLOUR_WITH_R')).setCheck('Number');
      this.appendValueInput('GREEN').appendField('G').setCheck('Number');
      this.appendValueInput('BLUE').appendField('B').setCheck('Number');
      this.setInputsInline(true);
      this.setOutput(true, 'Colour');
      this.setColour('20');
      this.setTooltip(t('BLOCK_CREATE_A_COLOUR_FROM_RGB_COMPONENTS_0_255'));
      this.setHelpUrl('');
    },
  };
}
