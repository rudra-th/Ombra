import { useEffect, useState, type FormEvent } from 'react';
import { browser } from 'wxt/browser';
import {
  exportItem,
  importItem,
  setLinkIcons,
  setSettingsAccent,
  setSettingsName,
  setSoundPower,
  setSoundVolume,
  setStatsVisible,
  settingsItem,
  useSettings,
} from '../../state/settings';
import { ensureIconsPermission, type PermissionsSeam } from '../links/icons';
import { type PresetId } from '../../state/presets';
import { applyPresetRoom } from './presetApply';
import { filmItem, setFilmMotion, useFilm } from '../../story/item';
import { updateItem } from '../../state/useStorageValue';

const ACCENTS = [
  { key: 'ember', label: 'ember' },
  { key: 'sage', label: 'sage' },
  { key: 'fog', label: 'fog' },
] as const;

type AccentKey = (typeof ACCENTS)[number]['key'];

const PRESET_ROWS = [
  { id: 'morning', label: 'morning' },
  { id: 'deep', label: 'deep work' },
  { id: 'evening', label: 'evening' },
] as const;

const MOTIONS = [
  { key: 'cinema', label: 'cinema' },
  { key: 'static', label: 'stills' },
] as const;

/**
 * The settings drawer: every control it owns writes through the settings
 * seam, so the surface behind it previews the change as it is typed.
 */
export function Drawer({
  open,
  onToggle,
  onClose,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const settings = useSettings();
  const film = useFilm();
  const [name, setName] = useState<string>('');
  const [importText, setImportText] = useState('');
  const [importErr, setImportErr] = useState(false);
  const [copied, setCopied] = useState(false);

  // the drawer owns its Esc; the field's Esc closes it too
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // freshly opened drawer always shows the current name
  useEffect(() => {
    if (open) setName(settings.name);
  }, [open, settings.name]);

  const applyName = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim() !== settings.name) void setSettingsName(settingsItem, name);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(await exportItem(settingsItem));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  // a preset is two honest writes: the room's settings and its bed
  const applyPreset = (id: PresetId) => applyPresetRoom(id);

  // icons: off is a plain write; on must pass the optional permission door
  // first, and a declined ask leaves the switch off — no half states
  const toggleIcons = async () => {
    const on = !settings.linkIcons;
    if (on) {
      const granted = await ensureIconsPermission(
        browser.permissions as unknown as PermissionsSeam,
      );
      if (!granted) return;
    }
    void setLinkIcons(settingsItem, on);
  };

  const applyImport = async () => {
    try {
      await importItem(settingsItem, importText);
      setImportErr(false);
      setImportText('');
    } catch {
      setImportErr(true);
    }
  };

  return (
    <>
      <button
        type="button"
        className="settings-gear"
        aria-expanded={open}
        onClick={onToggle}
      >
        settings
      </button>
      {open ? (
        <div className="drawer" role="dialog" aria-label="Settings">
          <div className="drawer-head">
            <p className="widget-label">Settings</p>
            <button
              type="button"
              className="drawer-close"
              onClick={onClose}
            >
              close
            </button>
          </div>

          <form className="drawer-row" onSubmit={applyName}>
            <label className="drawer-label" htmlFor="drawer-name">
              Name
            </label>
            <input
              id="drawer-name"
              className="widget-input"
              type="text"
              autoComplete="off"
              placeholder="who greets you"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </form>

          <div className="drawer-row" role="radiogroup" aria-label="Accent">
            <span className="drawer-label">Accent</span>
            <div className="drawer-chips">
              {ACCENTS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  role="radio"
                  aria-checked={settings.accent === a.key}
                  className={`drawer-chip${settings.accent === a.key ? ' drawer-chip-on' : ''}`}
                  onClick={() => void setSettingsAccent(settingsItem, a.key as AccentKey)}
                >
                  <span className={`drawer-swatch drawer-swatch-${a.key}`} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="drawer-row">
            <label className="drawer-label" htmlFor="drawer-vol">
              Master volume
            </label>
            <div className="drawer-inline">
              <button
                type="button"
                className="sound-switch"
                role="switch"
                aria-checked={settings.sound.enabled}
                aria-label="Sound"
                onClick={() => void setSoundPower(settingsItem, !settings.sound.enabled)}
              >
                <span className="sound-knob" aria-hidden="true" />
              </button>
              <input
                id="drawer-vol"
                className="drawer-range"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sound.volume}
                onChange={(e) => void setSoundVolume(settingsItem, Number(e.target.value))}
                aria-label="Master volume"
              />
            </div>
          </div>

          <div className="drawer-row" role="radiogroup" aria-label="Film motion">
            <span className="drawer-label">Film</span>
            <div className="drawer-chips">
              {MOTIONS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  role="radio"
                  aria-checked={film.motion === m.key}
                  className={`drawer-chip${film.motion === m.key ? ' drawer-chip-on' : ''}`}
                  onClick={() => void setFilmMotion(filmItem, m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="drawer-row" role="group" aria-labelledby="drawer-surface">
            <span className="drawer-label" id="drawer-surface">
              Surface
            </span>
            <div className="drawer-switches">
              <div className="drawer-switch-row">
                <button
                  type="button"
                  className="sound-switch"
                  role="switch"
                  aria-checked={settings.statsVisible}
                  aria-label="Tab stats"
                  onClick={() => void setStatsVisible(settingsItem, !settings.statsVisible)}
                >
                  <span className="sound-knob" aria-hidden="true" />
                </button>
                <span className="drawer-tiny">tab stats — the strip under the quote</span>
              </div>
              <div className="drawer-switch-row">
                <button
                  type="button"
                  className="sound-switch"
                  role="switch"
                  aria-checked={settings.linkIcons}
                  aria-label="Shortcut icons"
                  onClick={() => void toggleIcons()}
                >
                  <span className="sound-knob" aria-hidden="true" />
                </button>
                <span className="drawer-tiny">shortcut icons — inked black &amp; white</span>
              </div>
            </div>
          </div>

          <div className="drawer-row" role="group" aria-label="Presets">
            <span className="drawer-label">Presets</span>
            <div className="drawer-chips">
              {PRESET_ROWS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="drawer-chip"
                  onClick={() => applyPreset(p.id as PresetId)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="drawer-row">
            <span className="drawer-label">Your data</span>
            <div className="drawer-io">
              <button type="button" className="widget-trigger" onClick={() => void copy()}>
                {copied ? 'copied to clipboard' : 'copy settings JSON'}
              </button>
              <textarea
                className="drawer-import"
                placeholder="paste settings JSON, then apply"
                aria-label="Import settings JSON"
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportErr(false);
                }}
                rows={4}
              />
              <button
                type="button"
                className="widget-trigger"
                onClick={() => void applyImport()}
                disabled={!importText.trim()}
              >
                apply import
              </button>
              {importErr ? <p className="drawer-err">that did not read as JSON</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
