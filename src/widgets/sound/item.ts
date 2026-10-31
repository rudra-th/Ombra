import { storage } from 'wxt/utils/storage';
import { useStorageValue } from '../../state/useStorageValue';
import { FALLBACK_AMBIENCE, readAmbience, type AmbienceState } from '../../audio/beds';

/** Where the mixer's sleeping self lives: chosen bed + remembered gains. */
export const ambienceItem = storage.defineItem<AmbienceState>('local:ambience', {
  fallback: FALLBACK_AMBIENCE,
});

/** Stored bytes pass through the bed guards before React ever sees them. */
export const useAmbience = (): AmbienceState => readAmbience(useStorageValue(ambienceItem));
