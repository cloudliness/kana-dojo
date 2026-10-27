import { describe, expect, it } from 'vitest';
import { buildListeningQuestion } from './buildListeningQuestion';
import type { KanaCharacter } from './flattenKanaGroup';

const character = (kana: string, romaji: string): KanaCharacter => ({
  kana,
  romaji,
  altRomanji: [],
  group: 'test',
});

const pool = ['あ', 'い', 'う', 'え', 'お'].map((kana, index) =>
  character(kana, ['a', 'i', 'u', 'e', 'o'][index]),
);

describe('buildListeningQuestion', () => {
  it('returns null until there are two different characters', () => {
    expect(buildListeningQuestion([pool[0]], () => 0)).toBeNull();
    expect(buildListeningQuestion([], () => 0)).toBeNull();
  });

  it('keeps the spoken character inside options drawn from the pool', () => {
    const question = buildListeningQuestion(pool, min => min, 4);

    expect(question).not.toBeNull();
    expect(question?.prompt.kana).toBe('あ');
    expect(question?.options).toHaveLength(4);
    expect(question?.options).toContain('あ');
    expect(new Set(question?.options).size).toBe(4);
    for (const option of question?.options ?? []) {
      expect(pool.map(item => item.kana)).toContain(option);
    }
  });

  it('does not repeat a kana that appears twice in the selected groups', () => {
    const duplicated = [pool[0], { ...pool[0] }, pool[1], pool[2]];
    const question = buildListeningQuestion(duplicated, min => min, 4);

    expect(question?.options).toEqual(
      expect.arrayContaining(['あ', 'い', 'う']),
    );
    expect(question?.options.filter(option => option === 'あ')).toHaveLength(1);
  });
});
