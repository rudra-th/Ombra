export interface Quote {
  text: string;
  author: string;
}

/**
 * ~56 lines, bundled forever — zero network. Classical and pre-1929 voices,
 * unattributable proverbs, and a few lines of Ombra's own.
 */
export const QUOTES: Quote[] = [
  { text: 'Confine yourself to the present.', author: 'Marcus Aurelius' },
  {
    text: 'You have power over your mind — not outside events. Realize this, and you will find strength.',
    author: 'Marcus Aurelius',
  },
  {
    text: 'The impediment to action advances action. What stands in the way becomes the way.',
    author: 'Marcus Aurelius',
  },
  {
    text: 'Waste no more time arguing about what a good man should be. Be one.',
    author: 'Marcus Aurelius',
  },
  {
    text: 'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.',
    author: 'Marcus Aurelius',
  },
  {
    text: 'The soul becomes dyed with the color of its thoughts.',
    author: 'Marcus Aurelius',
  },
  {
    text: 'It is not that we have a short time to live, but that we waste a lot of it.',
    author: 'Seneca',
  },
  {
    text: 'We suffer more often in imagination than in reality.',
    author: 'Seneca',
  },
  {
    text: 'Begin at once to live, and count each separate day as a separate life.',
    author: 'Seneca',
  },
  {
    text: 'Difficulties strengthen the mind, as labor does the body.',
    author: 'Seneca',
  },
  {
    text: 'First say to yourself what you would be; and then do what you have to do.',
    author: 'Epictetus',
  },
  {
    text: 'Wealth consists not in having great possessions, but in having few wants.',
    author: 'Epictetus',
  },
  { text: 'No man is free who is not master of himself.', author: 'Epictetus' },
  {
    text: "It's not what happens to you, but how you react to it that matters.",
    author: 'Epictetus',
  },
  {
    text: 'Nature does not hurry, yet everything is accomplished.',
    author: 'Laozi',
  },
  {
    text: 'Manifest plainness, embrace simplicity, reduce selfishness, have few desires.',
    author: 'Laozi',
  },
  {
    text: 'When I let go of what I am, I become what I might be.',
    author: 'Laozi',
  },
  {
    text: 'Doing nothing is better than being busy doing nothing.',
    author: 'Laozi',
  },
  {
    text: 'Flow with whatever may happen, and let your mind be free.',
    author: 'Chuang Tzu',
  },
  {
    text: 'Sitting quietly, doing nothing, spring comes, and the grass grows by itself.',
    author: 'Zen proverb',
  },
  { text: 'The obstacle is the path.', author: 'Zen proverb' },
  { text: 'Let go or be dragged.', author: 'Zen proverb' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese proverb' },
  {
    text: 'Before enlightenment: chop wood, carry water. After enlightenment: chop wood, carry water.',
    author: 'Zen proverb',
  },
  {
    text: 'You should sit in stillness for twenty minutes a day. If you are too busy, sit for an hour.',
    author: 'Zen proverb',
  },
  {
    text: 'It is not enough to be busy. The question is: what are we busy about?',
    author: 'Henry David Thoreau',
  },
  {
    text: 'The price of anything is the amount of life you exchange for it.',
    author: 'Henry David Thoreau',
  },
  {
    text: 'I never found a companion that was so companionable as solitude.',
    author: 'Henry David Thoreau',
  },
  { text: 'Simplicity, simplicity, simplicity!', author: 'Henry David Thoreau' },
  {
    text: 'Adopt the pace of nature: her secret is patience.',
    author: 'Ralph Waldo Emerson',
  },
  {
    text: 'Write it on your heart that every day is the best day in the year.',
    author: 'Ralph Waldo Emerson',
  },
  {
    text: 'Nothing great was ever achieved without enthusiasm.',
    author: 'Ralph Waldo Emerson',
  },
  { text: 'Hope is the thing with feathers that perches in the soul.', author: 'Emily Dickinson' },
  {
    text: 'To live is the rarest thing in the world. Most people exist, that is all.',
    author: 'Oscar Wilde',
  },
  {
    text: 'All that we see or seem is but a dream within a dream.',
    author: 'Edgar Allan Poe',
  },
  {
    text: 'In three words I can sum up everything I have learned about life: it goes on.',
    author: 'Robert Frost',
  },
  {
    text: 'The woods are lovely, dark and deep, but I have promises to keep.',
    author: 'Robert Frost',
  },
  {
    text: 'Two roads diverged in a wood, and I took the one less traveled by.',
    author: 'Robert Frost',
  },
  {
    text: 'Everyone thinks of changing the world, but no one thinks of changing himself.',
    author: 'Leo Tolstoy',
  },
  { text: 'If you want to be happy, be.', author: 'Leo Tolstoy' },
  {
    text: 'In the depth of winter, I finally learned that within me there lay an invincible summer.',
    author: 'Albert Camus',
  },
  {
    text: 'Simplicity is the keynote of all true elegance.',
    author: 'Coco Chanel',
  },
  {
    text: 'Simplicity is the ultimate sophistication.',
    author: 'attributed to Leonardo da Vinci',
  },
  {
    text: 'Less, but better.',
    author: 'Dieter Rams',
  },
  {
    text: 'The details are not the details. They make the design.',
    author: 'Charles Eames',
  },
  {
    text: 'The quieter you become, the more you can hear.',
    author: 'Ram Dass',
  },
  { text: 'Pain is inevitable. Suffering is optional.', author: 'proverb' },
  { text: 'Turn your face to the sun and the shadows fall behind you.', author: 'Maori proverb' },
  {
    text: 'Night has a thousand eyes, and the day but one.',
    author: 'Francis William Bourdillon',
  },
  {
    text: 'The night is the hardest time to be alive — and the hour of the deeper knowing.',
    author: 'Ombra',
  },
  {
    text: 'A shadow tells you two things: something stands here, and there is light nearby.',
    author: 'Ombra',
  },
  {
    text: 'Do not fear stillness. It is where the next move is composed.',
    author: 'Ombra',
  },
  {
    text: 'Begin again, quietly, as the dark begins again at dusk.',
    author: 'Ombra',
  },
  {
    text: 'The day asks many questions. The evening asks only one: was it enough?',
    author: 'Ombra',
  },
  {
    text: 'What is kept simple survives the storm.',
    author: 'Ombra',
  },
  {
    text: 'Rest is not the reward for finishing. It is part of the work.',
    author: 'Ombra',
  },
];

/** One quote per day, rotating forever — deterministic, zero network. */
export function pickQuote(dayKey: string): Quote {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  const day = m
    ? Math.floor(
        Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000,
      )
    : [...dayKey].reduce((h, c) => h * 31 + c.charCodeAt(0), 0);
  return QUOTES[((day % QUOTES.length) + QUOTES.length) % QUOTES.length];
}
