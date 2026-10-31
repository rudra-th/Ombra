import { pickQuote } from './feed';
import { todayKey } from '../../state/day';

/** One line a day. Same all day, in every tab, offline forever. */
export function Quote() {
  const quote = pickQuote(todayKey(new Date()));

  return (
    <figure className="quote">
      <blockquote className="quote-text">{quote.text}</blockquote>
      <figcaption className="quote-author">— {quote.author}</figcaption>
    </figure>
  );
}
