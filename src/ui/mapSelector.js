import { t } from '../i18n/index.js';
import { getMapCatalogue } from '../sim/mapCatalogue.js';
import { loadMapFromUrl }  from '../sim/mapLoader.js';
import { setMapData }      from '../sim/map.js';
import { respawnRobot }    from '../sim/robot.js';
import { resizeCanvas, resetCamera, resetSim, resumeSim } from '../sim/canvas.js';
import { stop as stopProgram } from '../runtime/runLoop.js';
import { RunState, getRunState } from '../runtime/runState.js';
import { appendConsoleMessage } from './console.js';

let _catalogue   = [];
let _activeMapName = '';  // name of the currently loaded map

export async function initMapSelector() {
  const select = document.getElementById('map-select');
  if (!select) return;

  _catalogue = await getMapCatalogue();

  if (_catalogue.length === 0) {
    console.warn('[mapSelector] No maps found in catalogue; using blank canvas');
    appendConsoleMessage(t('MAP_NONE_FOUND'), 'warn');
    return;
  }

  // Populate dropdown
  select.innerHTML = '';
  for (const { name } of _catalogue) {
    const opt       = document.createElement('option');
    opt.value       = name;
    opt.textContent = name;
    select.appendChild(opt);
  }

  const defaultEntry = _catalogue[0];
  select.value = defaultEntry.name;

  await _loadMap(defaultEntry);

  select.addEventListener('change', () => {
    const entry = _catalogue.find(m => m.name === select.value);
    if (!entry) return;

    const state = getRunState();
    if (state === RunState.RUNNING || state === RunState.PAUSED_ASYNC) {
      const ok = window.confirm(t('MAP_CHANGE_CONFIRM'));
      if (!ok) {
        select.value = _activeMapName;  // revert dropdown to currently loaded map
        return;
      }
      stopProgram();
      resetSim();
      resumeSim();
    }
    _loadMap(entry);
  });
}

async function _loadMap(entry) {
  try {
    const mapInfo = await loadMapFromUrl(entry.url);
    setMapData(mapInfo);
    resizeCanvas(mapInfo);
    respawnRobot(mapInfo);
    resetCamera();
    _activeMapName = entry.name;
    console.log(`[mapSelector] Loaded "${entry.name}" — ${mapInfo.width}×${mapInfo.height} cm, spawn (${mapInfo.spawnX.toFixed(1)}, ${mapInfo.spawnY.toFixed(1)}), heading ${(mapInfo.spawnHeading * 180 / Math.PI).toFixed(1)}°`);
  } catch (err) {
    console.error('[mapSelector] Failed to load map:', err);
    appendConsoleMessage(t('MAP_LOAD_ERROR', { name: entry.name, error: err.message }), 'error');
  }
}
