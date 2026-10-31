import { useState } from 'react';
import { intentionItem, commitIntention, type IntentionRecord } from './item';
import { todayKey } from './store';
import { useStorageValue } from '../../state/useStorageValue';

/** The day's one thing — written in one line, kept by a quiet stone. */
export function Intention() {
  const record = useStorageValue(intentionItem) as IntentionRecord;
  const today = todayKey(new Date());
  const isToday = record.key === today;
  const [draft, setDraft] = useState(isToday ? record.text : '');

  const commit = () => {
    void intentionItem.setValue(commitIntention(record, draft, today));
  };

  return (
    <section className="widget" aria-label="Intention">
      <p className="widget-label">One thing today</p>
      <input
        className="widget-input intention-input"
        type="text"
        autoComplete="off"
        spellCheck={false}
        placeholder={isToday ? record.text || 'Set the day' : 'Set the day'}
        aria-label="Intention for today"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
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
