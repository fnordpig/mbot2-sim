import { t } from '../../i18n/index.js';
import * as Blockly from 'blockly';

// Cast blocks and list blocks share this file.
// Cast colours: math casts use '230' (math blue), text casts use '160' (teal).
// List colour: '260' (purple).

export function registerListBlocks() {

  // ── Cast: Number → String ───────────────────────────────────────────────────

  Blockly.Blocks['math_cast_toString'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_CONVERT'));
      this.appendValueInput('NUM').setCheck('Number');
      this.appendDummyInput().appendField(t('BLOCK_TO_TEXT'));
      this.setInputsInline(true);
      this.setOutput(true, 'String');
      this.setColour('230');
      this.setTooltip(t('BLOCK_CONVERT_A_NUMBER_TO_TEXT'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['math_cast_toChar'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_CONVERT'));
      this.appendValueInput('NUM').setCheck('Number');
      this.appendDummyInput().appendField(t('BLOCK_TO_CHARACTER'));
      this.setInputsInline(true);
      this.setOutput(true, 'String');
      this.setColour('230');
      this.setTooltip(t('BLOCK_CONVERT_A_NUMBER_TO_THE_CORRESPONDING_UNICODE_CHARACTER'));
      this.setHelpUrl('');
    },
  };

  // ── Cast: String → Number ───────────────────────────────────────────────────

  Blockly.Blocks['text_cast_string_toNumber'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_CONVERT'));
      this.appendValueInput('TEXT').setCheck('String');
      this.appendDummyInput().appendField(t('BLOCK_TO_NUMBER'));
      this.setInputsInline(true);
      this.setOutput(true, 'Number');
      this.setColour('160');
      this.setTooltip(t('BLOCK_CONVERT_TEXT_TO_A_NUMBER'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['text_cast_char_toNumber'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_CONVERT_CHARACTER'));
      this.appendValueInput('CHAR').setCheck('String');
      this.appendDummyInput().appendField(t('BLOCK_TO_NUMBER'));
      this.setInputsInline(true);
      this.setOutput(true, 'Number');
      this.setColour('160');
      this.setTooltip(t('BLOCK_CONVERT_A_CHARACTER_TO_ITS_NUMERIC_UNICODE_CODE'));
      this.setHelpUrl('');
    },
  };

  // ── Lists ───────────────────────────────────────────────────────────────────

  // Fixed 3-slot form; also serves the empty (0-item) toolbox entry because
  // the inputs are simply unconnected in that case.
  Blockly.Blocks['robLists_create_with'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_CREATE_LIST_WITH'));
      this.appendValueInput('ADD0');
      this.appendValueInput('ADD1');
      this.appendValueInput('ADD2');
      this.setInputsInline(true);
      this.setOutput(true, 'Array');
      this.setColour('260');
      this.setTooltip(t('BLOCK_CREATE_A_LIST_WITH_THE_SUPPLIED_ITEMS'));
      this.setHelpUrl('');
      // TODO Phase 4 / future: mutator support for variable number of items
    },
  };

  Blockly.Blocks['robLists_repeat'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_CREATE_LIST_WITH_ITEM'));
      this.appendValueInput('ITEM');
      this.appendDummyInput().appendField(t('BLOCK_REPEATED'));
      this.appendValueInput('NUM').setCheck('Number');
      this.appendDummyInput().appendField(t('BLOCK_TIMES'));
      this.setInputsInline(true);
      this.setOutput(true, 'Array');
      this.setColour('260');
      this.setTooltip(t('BLOCK_CREATE_A_LIST_WITH_AN_ITEM_REPEATED_A_NUMBER_OF_TIMES'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robLists_length'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_LENGTH_OF'));
      this.appendValueInput('VALUE').setCheck('Array');
      this.setInputsInline(true);
      this.setOutput(true, 'Number');
      this.setColour('260');
      this.setTooltip(t('BLOCK_GET_THE_NUMBER_OF_ITEMS_IN_A_LIST'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robLists_isEmpty'] = {
    init() {
      this.appendValueInput('VALUE').setCheck('Array');
      this.appendDummyInput().appendField(t('BLOCK_IS_EMPTY'));
      this.setInputsInline(true);
      this.setOutput(true, 'Boolean');
      this.setColour('260');
      this.setTooltip(t('BLOCK_CHECK_WHETHER_A_LIST_IS_EMPTY'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robLists_indexOf'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_IN_LIST'));
      this.appendValueInput('VALUE').setCheck('Array');
      this.appendDummyInput().appendField(t('BLOCK_FIND_FIRST_OCCURRENCE_OF'));
      this.appendValueInput('FIND');
      this.setInputsInline(true);
      this.setOutput(true, 'Number');
      this.setColour('260');
      this.setTooltip(t('BLOCK_FIND_THE_POSITION_OF_AN_ITEM_IN_A_LIST_1_IF_NOT_FOUND'));
      this.setHelpUrl('');
    },
  };

  const WHERE_OPTIONS = [
    [t('BLOCK_FIRST'),   'FIRST'],
    [t('BLOCK_LAST'),     'LAST'],
    ['#',          'FROM_START'],
    [t('BLOCK_FROM_END'),   'FROM_END'],
    [t('BLOCK_RANDOM'),  'RANDOM'],
  ];

  Blockly.Blocks['robLists_getIndex'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_GET'));
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(WHERE_OPTIONS), 'WHERE');
      this.appendDummyInput().appendField(t('BLOCK_FROM_LIST'));
      this.appendValueInput('VALUE').setCheck('Array');
      this.appendDummyInput().appendField(t('BLOCK_AT'));
      this.appendValueInput('AT').setCheck('Number');
      this.setInputsInline(true);
      this.setOutput(true, null);
      this.setColour('260');
      this.setTooltip(t('BLOCK_GET_AN_ITEM_FROM_A_LIST_BY_POSITION'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robLists_setIndex'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_IN_LIST'));
      this.appendValueInput('VALUE').setCheck('Array');
      this.appendDummyInput()
        .appendField(t('BLOCK_SET'))
        .appendField(new Blockly.FieldDropdown(WHERE_OPTIONS), 'WHERE')
        .appendField(t('BLOCK_AT'));
      this.appendValueInput('AT').setCheck('Number');
      this.appendDummyInput().appendField(t('BLOCK_TO'));
      this.appendValueInput('TO');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('260');
      this.setTooltip(t('BLOCK_SET_THE_VALUE_OF_A_LIST_ITEM_BY_POSITION'));
      this.setHelpUrl('');
    },
  };

  const SUBLIST_WHERE_OPTIONS = [
    [t('BLOCK_FIRST'),   'FIRST_FROM_START'],
    ['#',          'FROM_START'],
    [t('BLOCK_FROM_END'),   'FROM_END'],
    [t('BLOCK_LAST'),     'LAST'],
  ];

  Blockly.Blocks['robLists_getSublist'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_GET_SUBLIST_OF'));
      this.appendValueInput('VALUE').setCheck('Array');
      this.appendDummyInput()
        .appendField(t('BLOCK_FROM'))
        .appendField(new Blockly.FieldDropdown(SUBLIST_WHERE_OPTIONS), 'WHERE1');
      this.appendValueInput('AT1').setCheck('Number');
      this.appendDummyInput()
        .appendField(t('BLOCK_TO_A'))
        .appendField(new Blockly.FieldDropdown(SUBLIST_WHERE_OPTIONS), 'WHERE2');
      this.appendValueInput('AT2').setCheck('Number');
      this.setInputsInline(true);
      this.setOutput(true, 'Array');
      this.setColour('260');
      this.setTooltip(t('BLOCK_GET_A_SUBLIST_BETWEEN_TWO_POSITIONS_IN_A_LIST'));
      this.setHelpUrl('');
    },
  };
}
