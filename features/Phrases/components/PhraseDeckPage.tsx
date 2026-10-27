'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/core/i18n/routing';
import AudioButton from '@/shared/ui-composite/audio/AudioButton';
import { ActionButton } from '@/shared/ui/components/ActionButton';
import {
  RecallGradeButtons,
  useDueCardIds,
  useSrsStore,
  type RecallGrade,
} from '@/features/Progress';
import {
  friendsAndFamilyPhrases,
  type Phrase,
} from '@/features/Phrases/data/friendsAndFamily';

const phraseIdFromCard = (cardId: string): string =>
  cardId.startsWith('phrase:') ? cardId.slice('phrase:'.length) : cardId;

const practiceQueueFromDue = (dueIds: string[]): string[] => {
  const duePhrases = dueIds
    .filter(id => id.startsWith('phrase:'))
    .map(phraseIdFromCard);
  if (duePhrases.length > 0) return duePhrases;
  return friendsAndFamilyPhrases.map(phrase => phrase.id);
};

const PhraseDeckPage = () => {
  const t = useTranslations('beginner');
  const [mode, setMode] = useState<'browse' | 'practice'>('browse');
  const [practiceQueue, setPracticeQueue] = useState<string[] | null>(null);
  const dueIds = useDueCardIds();
  const review = useSrsStore(state => state.review);
  const dueCount = dueIds.filter(id => id.startsWith('phrase:')).length;

  const startPractice = () => {
    setPracticeQueue(practiceQueueFromDue(dueIds));
    setMode('practice');
  };

  return (
    <main className='mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col gap-4 px-4 pt-4 pb-16'>
      <header className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-sm text-(--secondary-color)'>
            <Link href='/' className='underline'>
              {t('phrases.back')}
            </Link>
          </p>
          <h1 className='text-3xl font-semibold text-(--main-color)'>
            {t('phrases.title')}
          </h1>
          <p className='mt-1 text-base text-(--secondary-color)'>
            {t('phrases.subtitle')}
          </p>
        </div>
      </header>

      <p className='rounded-2xl bg-(--card-color) px-4 py-3 text-center text-base font-medium text-(--main-color)'>
        {t('phrases.due', { count: dueCount })}
      </p>

      <div className='grid grid-cols-2 gap-2'>
        <ActionButton
          type='button'
          onClick={() => setMode('browse')}
          colorScheme={mode === 'browse' ? 'main' : 'secondary'}
          borderColorScheme={mode === 'browse' ? 'main' : 'secondary'}
          borderBottomThickness={8}
          borderRadius='2xl'
          className='min-h-12'
        >
          {t('phrases.browse')}
        </ActionButton>
        <ActionButton
          type='button'
          onClick={startPractice}
          colorScheme={mode === 'practice' ? 'main' : 'secondary'}
          borderColorScheme={mode === 'practice' ? 'main' : 'secondary'}
          borderBottomThickness={8}
          borderRadius='2xl'
          className='min-h-12'
        >
          {t('phrases.practice')}
        </ActionButton>
      </div>

      {mode === 'browse' || !practiceQueue ? (
        <ul className='flex flex-col gap-3'>
          {friendsAndFamilyPhrases.map(phrase => (
            <li key={phrase.id}>
              <PhraseCard phrase={phrase} politeLabel={t('phrases.polite')} />
            </li>
          ))}
        </ul>
      ) : (
        <PhraseFlashcards
          queue={practiceQueue}
          onGrade={review}
          labels={{
            again: t('phrases.again'),
            hard: t('phrases.hard'),
            good: t('phrases.good'),
            easy: t('phrases.easy'),
          }}
          showAnswerLabel={t('phrases.showAnswer')}
          caughtUpLabel={t('phrases.done')}
          politeLabel={t('phrases.polite')}
          practicingDue={dueCount > 0}
        />
      )}
    </main>
  );
};

const PhraseCard = ({
  phrase,
  politeLabel,
}: {
  phrase: Phrase;
  politeLabel: string;
}) => {
  const japanese = phrase.kanji ?? phrase.kana;
  return (
    <article className='flex flex-col gap-2 rounded-3xl bg-(--card-color) p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-4xl text-(--main-color)' lang='ja'>
            {japanese}
          </p>
          {phrase.kanji && (
            <p className='text-lg text-(--secondary-color)' lang='ja'>
              {phrase.kana}
            </p>
          )}
        </div>
        <AudioButton text={phrase.speech} size='sm' variant='icon-only' />
      </div>
      <p className='text-base text-(--secondary-color)'>{phrase.romaji}</p>
      <p className='text-lg text-(--main-color)'>{phrase.english}</p>
      {phrase.politeNote && (
        <p className='text-sm text-(--secondary-color)'>
          <span className='font-medium'>{politeLabel}: </span>
          {phrase.politeNote}
        </p>
      )}
    </article>
  );
};

const PhraseFlashcards = ({
  queue,
  onGrade,
  labels,
  showAnswerLabel,
  caughtUpLabel,
  politeLabel,
  practicingDue,
}: {
  queue: string[];
  onGrade: (id: string, grade: RecallGrade) => void;
  labels: Record<RecallGrade, string>;
  showAnswerLabel: string;
  caughtUpLabel: string;
  politeLabel: string;
  practicingDue: boolean;
}) => {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const phrase = friendsAndFamilyPhrases.find(
    item => item.id === queue[index % Math.max(queue.length, 1)],
  );

  if (!phrase || queue.length === 0) {
    return (
      <p className='rounded-3xl bg-(--card-color) p-5 text-center text-(--secondary-color)'>
        {caughtUpLabel}
      </p>
    );
  }

  const finishedPass = !practicingDue && index >= queue.length;

  const handleGrade = (grade: RecallGrade) => {
    onGrade(`phrase:${phrase.id}`, grade);
    setRevealed(false);
    setIndex(current => current + 1);
  };

  return (
    <section className='flex flex-col gap-4 rounded-3xl bg-(--card-color) p-4'>
      <p className='text-center text-5xl text-(--main-color)' lang='ja'>
        {phrase.kanji ?? phrase.kana}
      </p>
      <div className='flex justify-center'>
        <AudioButton text={phrase.speech} size='md' variant='icon-only' />
      </div>
      {revealed ? (
        <>
          {phrase.kanji && (
            <p
              className='text-center text-xl text-(--secondary-color)'
              lang='ja'
            >
              {phrase.kana}
            </p>
          )}
          <p className='text-center text-lg text-(--secondary-color)'>
            {phrase.romaji}
          </p>
          <p className='text-center text-xl text-(--main-color)'>
            {phrase.english}
          </p>
          {phrase.politeNote && (
            <p className='text-center text-sm text-(--secondary-color)'>
              {politeLabel}: {phrase.politeNote}
            </p>
          )}
          <RecallGradeButtons labels={labels} onGrade={handleGrade} />
        </>
      ) : (
        <ActionButton
          type='button'
          onClick={() => setRevealed(true)}
          borderBottomThickness={10}
          borderRadius='3xl'
          className='min-h-12'
        >
          {showAnswerLabel}
        </ActionButton>
      )}
      {finishedPass && (
        <p className='text-center text-sm text-(--secondary-color)'>
          {caughtUpLabel}
        </p>
      )}
    </section>
  );
};

export default PhraseDeckPage;
