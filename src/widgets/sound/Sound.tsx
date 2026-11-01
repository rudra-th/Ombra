import { useSettings, setSoundPower, setSoundVolume, settingsItem } from '../../state/settings';
import { updateItem } from '../../state/useStorageValue';
import { ambienceItem, useAmbience } from './item';
import { BEDS, levelFor, setBed, setLevel, type BedId } from '../../audio/beds';
import { deckArm, getSoundPlayer } from '../../audio/bridge';
import { playDeck } from '../../audio/deckSounds';
import { hoverTick, softClick } from '../../audio/recipes';
import { useEffect } from 'react';

const BEDS_GUI: BedId[] = ['rain', 'brown', 'pink', 'fire', 'cafe', 'ocean', 'forest', 'wind', 'birds'];

const BED_LABELS: Record<BedId, string> = BEDS_GUI.reduce(
  (map, bed) => ({ ...map, [bed]: bed }),
  {} as Record<BedId, string>,
);

/** The mixer deck. Power lives in settings; bed and gains live locally. */
export function Sound() {
  const settings = useSettings();
  const ambience = useAmbience();

  // One voice follows one bed: storage is the score, the player obeys.
  useEffect(() => {
    const player = getSoundPlayer();
    if (!settings.sound.enabled || !ambience.bed) {
      player.stop();
      return;
    }
    player.play(ambience.bed, levelFor(ambience, ambience.bed));
  }, [settings.sound.enabled, ambience]);

  // the deck's touch sounds: hover tick on the chips, soft click on
  // presses — armed only while the room is on, silent unless the page's
  // engine is awake (hover is not a gesture)
  const deckVoice = (recipe: () => ReturnType<typeof hoverTick>) =>
    playDeck(settings.sound.enabled ? deckArm() : null, recipe);

  const togglePower = () => {
    deckVoice(softClick);
    void setSoundPower(settingsItem, !settings.sound.enabled);
  };

  const pickBed = (bed: BedId) => {
    deckVoice(softClick);
    void updateItem(ambienceItem, (prev) =>
      setBed(prev, prev.bed === bed ? null : bed),
    );
  };

  const onLevel = (bed: BedId, value: number) => {
    void updateItem(ambienceItem, (prev) => setLevel(prev, bed, value));
    const player = getSoundPlayer();
    if (bed === ambience.bed) player.setLevel(value);
  };

  const volume = (value: number) => {
    void setSoundVolume(settingsItem, value);
  };

  const activeBed =
    settings.sound.enabled && ambience.bed ? ambience.bed : null;

  return (
    <section className="widget" aria-label="Ambience">
      <p className="widget-label">
        Ambience
        <button
          type="button"
          className="sound-switch"
          role="switch"
          aria-checked={settings.sound.enabled}
          aria-label={settings.sound.enabled ? 'Sound on' : 'Sound off'}
          onClick={togglePower}
        >
          <span className="sound-knob" aria-hidden="true" />
        </button>
      </p>
      {settings.sound.enabled ? (
        <>
          <div className="sound-beds" role="radiogroup" aria-label="Bed">
            {BEDS.map((bed) => (
              <button
                type="button"
                key={bed}
                role="radio"
                aria-checked={ambience.bed === bed}
                className={`sound-bed${ambience.bed === bed ? ' sound-bed-active' : ''}`}
                onPointerEnter={() => deckVoice(hoverTick)}
                onClick={() => pickBed(bed)}
              >
                {BED_LABELS[bed]}
              </button>
            ))}
          </div>
          {activeBed && (
            <label className="sound-level">
              <span className="sr-only">Level for {BED_LABELS[activeBed]}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={levelFor(ambience, activeBed)}
                onChange={(e) => onLevel(activeBed, Number(e.target.value))}
              />
            </label>
          )}
          {activeBed && (
            <label className="sound-level">
              <span className="sr-only">Master volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.sound.volume}
                onChange={(e) => volume(Number(e.target.value))}
              />
            </label>
          )}
        </>
      ) : (
        <p className="sound-silent">Silent by design — the switch wakes it.</p>
      )}
    </section>
  );
}
