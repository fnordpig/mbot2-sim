import { initBlockly }     from './blockly/index.js';
import { initSim }         from './sim/canvas.js';
import { initControls }    from './ui/controls.js';
import { initConsole }     from './ui/console.js';
import { initDisplay }     from './ui/display.js';
import { initButtons }     from './ui/buttons.js';
import { initMapSelector } from './ui/mapSelector.js';
import { initProgramIO }   from './ui/programIO.js';
import { initLanguageControls } from './ui/language.js';
import { initSettingsMenu } from './ui/settings.js';
import { initSimulationSettings } from './sim/settings.js';

document.addEventListener('DOMContentLoaded', async () => {
  initSimulationSettings();
  initConsole();
  initDisplay();
  initSim();
  await initBlockly();
  initControls();
  initLanguageControls();
  initSettingsMenu();
  initProgramIO();   // auto-restore + auto-save must come after Blockly is mounted
  initButtons();
  await initMapSelector();
  console.log('[mbot2-sim] Ready.');
});
