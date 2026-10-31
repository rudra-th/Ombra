import { useEffect, useRef, useState } from 'react';
import { intentionItem, commitIntention, type IntentionRecord } from './item';
import { todayKey } from '../../state/day';
import { useStorageValue, updateItem } from '../../state/useStorageValue';

/** The day's one thing — written in one line, kept by a quiet stone. */
export function Intention() {
  const record = useStorageValue(intentionItem) as IntentionRecord;
  const today = todayKey(new Date());
  const isToday = record.key === today;
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const touched = useRef(false);
  const source = isToday ? record.text : '';

  // Follow the record while idle; never echo over fresh keystrokes mid-edit.
  useEffect(() => {
    if (!editing) setDraft(source);
  }, [source, editing]);

  const commit = () => {
    setEditing(false);
    if (!touched.current) return;
    touched.current = false;
    if (draft !== record.text) {
      void updateItem(intentionItem, (prev) =>
        commitIntention(prev, draft, todayKey(new Date())),
      );
    }
  };

  return (
    <section className="widget" aria-label="Intention">
      <p className="widget-label">One thing today</p>
      <input
        className="widget-input intention-input"
        type="text"
        autoComplete="off"
        spellCheck={false}
        placeholder={isToday && record.text ? '' : 'Set the day'}
        aria-label="Intention for today"
        value={draft}
        onFocus={() => setEditing(true)}
        onChange={(e) => {
          touched.current = true;
          setDraft(e.target.value);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit();
            e.currentTarget.blur();
          }
        }}
      />
      {isToday && record.streak > 0 && (
        <p className="intention-streak tnum" aria-label={`${record.streak} day streak`}>
          <span className="stone" aria-hidden="true">◆</span> {record.streak}
        </p>
      )}
    </section>
  );
}
