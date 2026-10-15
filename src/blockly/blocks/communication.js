import { t } from '../../i18n/index.js';
import * as Blockly from 'blockly';

export function registerCommunicationBlocks() {

  // ── Send message on local pub/sub bus ──────────────────────────────────
  // CLAUDE.md rule 6: multi-robot comm is out of scope; stub as local event bus.
  // Input names CHANNEL/MESSAGE confirmed in XML (program.toolbox.expert.xml).
  Blockly.Blocks['communication_send_message'] = {
    init() {
      this.appendDummyInput().appendField(t('BLOCK_SEND_MESSAGE_ON_CHANNEL'));
      this.appendValueInput('CHANNEL').setCheck('String');
      this.appendDummyInput().appendField(t('BLOCK_WITH_VALUE'));
      this.appendValueInput('MESSAGE');
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour('0');
      this.setTooltip(t('BLOCK_SEND_A_MESSAGE_ON_THE_SPECIFIED_CHANNEL_SIMULATED_LOCALLY_WITH_A_SINGLE_ROBOT'));
      this.setHelpUrl('');
    },
  };

  // ── Receive (read latest) message from channel ─────────────────────────
  // Output null (any type) — channel may carry numbers, strings, or booleans.
  Blockly.Blocks['communication_receive_message'] = {
    init() {
      this.appendValueInput('CHANNEL').appendField(t('BLOCK_RECEIVE_MESSAGE_FROM_CHANNEL')).setCheck('String');
      this.setInputsInline(true);
      this.setOutput(true, null);
      this.setColour('0');
      this.setTooltip(t('BLOCK_RECEIVE_THE_LAST_MESSAGE_ON_THE_SPECIFIED_CHANNEL_OR_NOTHING_IF_THERE_IS_NONE_RETURNS_ANY_TYPE'));
      this.setHelpUrl('');
    },
  };
}
