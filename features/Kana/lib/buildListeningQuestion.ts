import type { KanaCharacter } from './flattenKanaGroup';

export interface ListeningQuestion {
  prompt: KanaCharacter;
  options: string[];
}

const dedupeByKana = (pool: KanaCharacter[]): KanaCharacter[] => {
  const seen = new Set<string>();
  const unique: KanaCharacter[] = [];
  for (const item of pool) {
    if (seen.has(item.kana)) continue;
    seen.add(item.kana);
    unique.push(item);
  }
  return unique;
};

const shuffle = (
  items: string[],
  randomInt: (min: number, max: number) => number,
): string[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

/**
 * Build one listening item from the user's selected kana.
 * Returns null when there are not enough distinct characters to choose from.
 */
export const buildListeningQuestion = (
  pool: KanaCharacter[],
  randomInt: (min: number, max: number) => number,
  optionCount = 4,
): ListeningQuestion | null => {
  const unique = dedupeByKana(pool);
  if (unique.length < 2 || optionCount < 2) return null;

  const prompt = unique[randomInt(0, unique.length - 1)];
  const distractorPool = unique.filter(item => item.kana !== prompt.kana);
  const take = Math.min(optionCount - 1, distractorPool.length);
  const available = [...distractorPool];
  const distractors: string[] = [];

  for (let i = 0; i < take; i += 1) {
    const index = randomInt(0, available.length - 1);
    distractors.push(available[index].kana);
    available.splice(index, 1);
  }

  return {
    prompt,
    options: shuffle([prompt.kana, ...distractors], randomInt),
  };
};
