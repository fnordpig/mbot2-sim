import { t } from '../../i18n/index.js';
import * as Blockly from 'blockly';
import { loops } from 'blockly/blocks';
import { makePlusMinusMutator } from './_plusMinusMutator.js';

// Register robControls_loopForever as a loop type so that controls_flow_statements
// (break/continue) does not show a "must be inside a loop" warning when nested here.
loops.loopTypes.add('robControls_loopForever');

// ── +/− mutators (Open Roberta-style on-block buttons) ──────────────────────
// Each block keeps its own `extraCount_` (dynamic arms beyond the base inputs).
// Shared serialisation, plus_/minus_ handlers, and save-and-restore rebuild
// live in `_plusMinusMutator.js`; here we just describe each block's arm shape.

// robControls_if / robControls_ifElse share IFn/DOn dynamic arms. Names match
// Blockly's stock `controls_if` JS generator so codegen needs no changes.
const ROB_IF_MUTATOR = makePlusMinusMutator({
  mutationAttr: 'elseif',
  addExtraArm(block, n) {
    block.appendValueInput('IF' + n)
      .setCheck('Boolean')
      .appendField(Blockly.Msg.CONTROLS_IF_MSG_ELSEIF);
    block.appendStatementInput('DO' + n)
      .appendField(Blockly.Msg.CONTROLS_IF_MSG_THEN);
  },
  extraArmInputs(n) { return ['IF' + n, 'DO' + n]; },
});

const ROB_IFELSE_MUTATOR = makePlusMinusMutator({
  mutationAttr: 'elseif',
  addExtraArm(block, n) {
    block.appendValueInput('IF' + n)
      .setCheck('Boolean')
      .appendField(Blockly.Msg.CONTROLS_IF_MSG_ELSEIF);
    block.appendStatementInput('DO' + n)
      .appendField(Blockly.Msg.CONTROLS_IF_MSG_THEN);
  },
  extraArmInputs(n) { return ['IF' + n, 'DO' + n]; },
  hasTrailing: true,
  addTrailing(block) {
    block.appendStatementInput('ELSE')
      .appendField(Blockly.Msg.CONTROLS_IF_MSG_ELSE);
  },
  trailingInputs: ['ELSE'],
});

// robControls_wait_for — Boolean conditions OR'd together; +/− adds/removes
// extra WAITn inputs. Each extra arm is labelled "ou" (PT-PT "or") to match
// Open Roberta's "wait until A or B or …" rendering.
const ROB_WAIT_FOR_MUTATOR = makePlusMinusMutator({
  mutationAttr: 'wait',
  addExtraArm(block, n) {
    block.appendValueInput('WAIT' + n)
      .setCheck('Boolean')
      .appendField(t('BLOCK_OR'));
  },
  extraArmInputs(n) { return ['WAIT' + n]; },
});

// robText_join — variable-arity text concatenation. The block has two base
// inputs (ADD0, ADD1) added in init(); +/− adds/removes ADD2, ADD3, … which is
// why firstExtraIndex is 2. Codegen iterates ADDn dynamically so it picks up
// every input automatically.
const ROB_TEXT_JOIN_MUTATOR = makePlusMinusMutator({
  mutationAttr: 'items',
  firstExtraIndex: 2,
  addExtraArm(block, n) {
    block.appendValueInput('ADD' + n);
  },
  extraArmInputs(n) { return ['ADD' + n]; },
});

export function registerControlBlocks() {

  // ── Decision ────────────────────────────────────────────────────────────────

  // robControls_if — "if … do …" with +/− buttons to add/remove else-if arms.
  // No trailing 'else' branch (matches Open Roberta's `robControls_if` docs).
  Blockly.Blocks['robControls_if'] = {
    ...ROB_IF_MUTATOR,
    init() {
      this.appendValueInput('IF0')
        .setCheck('Boolean')
        .appendField(Blockly.Msg.CONTROLS_IF_MSG_IF);
      this.appendStatementInput('DO0')
        .appendField(Blockly.Msg.CONTROLS_IF_MSG_THEN);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('120');
      this.setTooltip(t('BLOCK_EXECUTE_ACTIONS_IF_A_CONDITION_IS_TRUE'));
      this.setHelpUrl('');
      // BUTTONS row + any persisted elseif arms are added here.
      this.updateShape_();
    },
  };

  // robControls_ifElse — "if … do … (else-if …)* … else …". The trailing else
  // input is permanent for this variant; +/− insert/remove else-if arms only.
  Blockly.Blocks['robControls_ifElse'] = {
    ...ROB_IFELSE_MUTATOR,
    init() {
      this.appendValueInput('IF0')
        .setCheck('Boolean')
        .appendField(Blockly.Msg.CONTROLS_IF_MSG_IF);
      this.appendStatementInput('DO0')
        .appendField(Blockly.Msg.CONTROLS_IF_MSG_THEN);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('120');
      this.setTooltip(t('BLOCK_EXECUTE_ACTIONS_IF_A_CONDITION_IS_TRUE_OTHERWISE_EXECUTE_OTHER_ACTIONS'));
      this.setHelpUrl('');
      // ELSE input + BUTTONS row + any persisted elseif arms are added here.
      this.updateShape_();
    },
  };

  // ── Loop ────────────────────────────────────────────────────────────────────

  Blockly.Blocks['robControls_loopForever'] = {
    init() {
      this.appendStatementInput('DO').appendField(t('BLOCK_REPEAT_FOREVER_DO'));
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('120');
      this.setTooltip(t('BLOCK_REPEAT_THE_ACTIONS_INDEFINITELY'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robControls_for'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_COUNT_WITH'))
        .appendField(new Blockly.FieldVariable('i'), 'VAR')
        .appendField(t('BLOCK_FROM'));
      this.appendValueInput('FROM').setCheck('Number');
      this.appendDummyInput().appendField(t('BLOCK_THROUGH'));
      this.appendValueInput('TO').setCheck('Number');
      this.appendDummyInput().appendField(t('BLOCK_BY_INCREMENTS_OF'));
      this.appendValueInput('BY').setCheck('Number');
      this.appendStatementInput('DO').appendField(t('BLOCK_DO'));
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('120');
      this.setTooltip(t('BLOCK_COUNT_WITH_A_VARIABLE_FROM_ONE_VALUE_TO_ANOTHER_IN_INCREMENTS'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robControls_forEach'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_FOR_EACH_ITEM'))
        .appendField(new Blockly.FieldVariable('i'), 'VAR')
        .appendField(t('BLOCK_IN_LIST'));
      this.appendValueInput('LIST').setCheck('Array');
      this.appendStatementInput('DO').appendField(t('BLOCK_DO'));
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('120');
      this.setTooltip(t('BLOCK_ITERATE_OVER_EACH_ITEM_IN_A_LIST'));
      this.setHelpUrl('');
    },
  };

  // ── Wait ────────────────────────────────────────────────────────────────────

  Blockly.Blocks['robControls_wait'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_WAIT'));
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('120');
      this.setTooltip(t('BLOCK_YIELD_CONTROL_TO_THE_SIMULATOR_FOR_ONE_CYCLE'));
      this.setHelpUrl('');
    },
  };

  Blockly.Blocks['robControls_wait_time'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_WAIT'));
      this.appendValueInput('WAIT').setCheck('Number');
      this.appendDummyInput().appendField('ms');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('120');
      this.setTooltip(t('BLOCK_WAIT_A_SPECIFIED_NUMBER_OF_MILLISECONDS'));
      this.setHelpUrl('');
    },
  };

  // robControls_wait_for — "wait until [cond]" with +/− to OR more conditions.
  // Extra arms labelled "ou" (PT-PT "or"). Codegen ORs all WAIT* together.
  Blockly.Blocks['robControls_wait_for'] = {
    ...ROB_WAIT_FOR_MUTATOR,
    init() {
      this.appendValueInput('WAIT0').setCheck('Boolean').appendField(t('BLOCK_WAIT_UNTIL'));
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('120');
      this.setTooltip(t('BLOCK_WAIT_UNTIL_A_CONDITION_IS_TRUE'));
      this.setHelpUrl('');
      // BUTTONS row + any persisted extra WAITn arms are added here.
      this.updateShape_();
    },
  };

  // ── Custom Math ─────────────────────────────────────────────────────────────

  Blockly.Blocks['robMath_change'] = {
    init() {
      this.appendDummyInput()
        .appendField(t('BLOCK_INCREASE'))
        .appendField(new Blockly.FieldVariable('i'), 'VAR')
        .appendField(t('BLOCK_BY'));
      this.appendValueInput('DELTA').setCheck('Number');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('230');
      this.setTooltip(t('BLOCK_INCREMENT_THE_VALUE_OF_A_VARIABLE'));
      this.setHelpUrl('');
    },
  };

  // ── Custom Text ─────────────────────────────────────────────────────────────

  // robText_join — concatenate values; +/− adds/removes input slots beyond
  // the two base inputs (ADD0, ADD1). Codegen iterates ADD* dynamically.
  Blockly.Blocks['robText_join'] = {
    ...ROB_TEXT_JOIN_MUTATOR,
    init() {
      this.appendValueInput('ADD0').appendField(t('BLOCK_JOIN'));
      this.appendValueInput('ADD1');
      this.setOutput(true, 'String');
      this.setColour('160');
      this.setTooltip(t('BLOCK_JOIN_TEXT_INTO_A_SINGLE_STRING'));
      this.setHelpUrl('');
      // BUTTONS row + any persisted extra ADDn arms are added here.
      this.updateShape_();
    },
  };

  Blockly.Blocks['robText_append'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_APPEND_TEXT'));
      this.appendValueInput('TEXT').setCheck('String');
      this.appendDummyInput()
        .appendField(t('BLOCK_TO_VARIABLE'))
        .appendField(new Blockly.FieldVariable(t('VARIABLE_TEXT')), 'VAR');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('160');
      this.setTooltip(t('BLOCK_APPEND_TEXT_TO_A_TEXT_VARIABLE'));
      this.setHelpUrl('');
    },
  };

  // ── Comment ─────────────────────────────────────────────────────────────────

  Blockly.Blocks['text_comment'] = {
    init() {
      // FieldMultilineInput is not available in Blockly 11; using FieldTextInput (single-line)
      this.appendDummyInput()
        .appendField('//')
        .appendField(new Blockly.FieldTextInput(''), 'COMMENT');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('290');
      this.setTooltip(t('BLOCK_COMMENT_NOT_EXECUTED'));
      this.setHelpUrl('');
    },
  };
}
