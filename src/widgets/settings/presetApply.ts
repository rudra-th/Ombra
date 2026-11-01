import { settingsItem, updateSettings } from '../../state/settings';
import { presetAmbience, presetSettings, type PresetId } from '../../state/presets';
import { setBed, setLevel } from '../../audio/beds';
import { ambienceItem } from '../sound/item';
import { updateItem } from '../../state/useStorageValue';

/**
 * A preset room, applied: the settings bytes and its one bed at its own
 * level — two honest writes. Both the same seams the drawer and deck use.
 */
export function applyPresetRoom(id: PresetId): void {
  void updateSettings(settingsItem, (prev) => ({ ...prev, ...presetSettings(id) }));
  const { bed, level } = presetAmbience(id);
  void updateItem(ambienceItem, (prev) => setLevel(setBed(prev, bed), bed, level));
}
