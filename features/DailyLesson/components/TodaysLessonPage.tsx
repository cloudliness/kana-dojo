'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/core/i18n/routing';
import { kana } from '@/entities/kana';
import { getPhraseById } from '@/features/Phrases/data/friendsAndFamily';
import AudioButton from '@/shared/ui-composite/audio/AudioButton';
import SpeakableKana from '@/shared/ui-composite/audio/SpeakableKana';
import { ActionButton } from '@/shared/ui/components/ActionButton';
import {
  RecallGradeButtons,
  listDueIds,
  useDueCardIds,
  useSrsStore,
  type RecallGrade,
} from '@/features/Progress';
import {
  buildLessonDays,
  lessonPracticeIds,
  type LessonDay,
} from '@/features/DailyLesson/lib/buildLessonDays';
import useDailyLessonStore from '@/features/DailyLesson/store/useDailyLessonStore';
import { useLessonSnapshot } from '@/features/DailyLesson/lib/useLessonSnapshot';

interface RecallFace {
  speech: string;
  front: string;
  reading: string | null;
  back: string;
  note: string | null;
}

const recallFace = (id: string): RecallFace | null => {
  if (id.startsWith('kana:')) {
    const char = id.slice('kana:'.length);
    for (const group of kana) {
      const index = group.kana.indexOf(char);
      if (index >= 0) {
        return {
          speech: char,
          front: char,
          reading: null,
          back: group.romanji[index] ?? '',
          note: null,
        };
      }
    }
    return null;
  }

  if (id.startsWith('phrase:')) {
    const phrase = getPhraseById(id.slice('phrase:'.length));
    if (!phrase) return null;
    return {
      speech: phrase.speech,
      front: phrase.kanji ?? phrase.kana,
      reading: phrase.kanji ? phrase.kana : null,
      back: `${phrase.romaji} — ${phrase.english}`,
      note: phrase.politeNote,
    };
  }

  return null;
};

const TodaysLessonPage = () => {
  const t = useTranslations('beginner');
  const days = useMemo(() => buildLessonDays(), []);
  const { dayIndex, phase, queue, queueIndex, chainedReview } =
    useLessonSnapshot();
  const beginPractice = useDailyLessonStore(state => state.beginPractice);
  const beginReview = useDailyLessonStore(state => state.beginReview);
  const advanceQueue = useDailyLessonStore(state => state.advanceQueue);
  const completeDay = useDailyLessonStore(state => state.completeDay);
  const returnToOverview = useDailyLessonStore(state => state.returnToOverview);
  const review = useSrsStore(state => state.review);
  const dueIds = useDueCardIds();
  const currentId = queue[queueIndex];
  const revealKey = `${phase}:${queueIndex}:${currentId ?? ''}`;
  const [revealedFor, setRevealedFor] = useState<string | null>(null);
  const revealed = revealedFor === revealKey;

  const day = days[dayIndex] as LessonDay | undefined;
  const dueCount = dueIds.length;
  const labels = {
    again: t('phrases.again'),
    hard: t('phrases.hard'),
    good: t('phrases.good'),
    easy: t('phrases.easy'),
  };

  const finishQueue = (gradedId: string, grade: RecallGrade) => {
    const requeues = queue.filter(id => id === gradedId).length;
    const requeue = grade === 'again' && requeues < 3;
    const atEnd = queueIndex + 1 >= queue.length && !requeue;
    if (!atEnd) {
      advanceQueue(requeue ? gradedId : undefined);
      return;
    }

    const due = listDueIds(useSrsStore.getState().cards, Date.now());
    // Date.now is intentionally inside the grade handler, not render.
    if (phase === 'practice' && due.length > 0) {
      beginReview(due, true);
      return;
    }
    if (phase === 'review' && chainedReview) {
      completeDay();
      return;
    }
    returnToOverview();
  };

  const onGrade = (grade: RecallGrade) => {
    const id = queue[queueIndex];
    if (!id) return;
    review(id, grade);
    finishQueue(id, grade);
  };

  const face = currentId ? recallFace(currentId) : null;
  const inSession =
    (phase === 'practice' || phase === 'review') &&
    face &&
    queueIndex < queue.length;

  return (
    <main className='mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col gap-4 px-4 pt-4 pb-16'>
      <header>
        <p className='text-sm text-(--secondary-color)'>
          <Link href='/' className='underline'>
            {t('lesson.back')}
          </Link>
        </p>
        <h1 className='text-3xl font-semibold text-(--main-color)'>
          {t('lesson.title')}
        </h1>
        <p className='mt-1 text-base text-(--secondary-color)'>
          {day
            ? t('lesson.of', { day: day.dayNumber, total: days.length })
            : t('lesson.finishedChart')}
        </p>
      </header>

      <p className='rounded-2xl bg-(--main-color) px-4 py-3 text-center text-base font-semibold text-(--background-color)'>
        {t('lesson.reviews', { count: dueCount })}
      </p>

      {inSession && face ? (
        <section className='flex flex-col gap-4 rounded-3xl bg-(--card-color) p-4'>
          <p className='text-center text-sm text-(--secondary-color)'>
            {phase === 'review'
              ? t('lesson.reviewNow')
              : currentId?.startsWith('phrase:')
                ? t('lesson.practicePromptPhrase')
                : t('lesson.practicePromptKana')}
          </p>
          <p className='text-center text-6xl text-(--main-color)' lang='ja'>
            {face.front}
          </p>
          <div className='flex justify-center'>
            <AudioButton text={face.speech} size='md' variant='icon-only' />
          </div>
          {revealed ? (
            <>
              {face.reading && (
                <p
                  className='text-center text-xl text-(--secondary-color)'
                  lang='ja'
                >
                  {face.reading}
                </p>
              )}
              <p className='text-center text-xl text-(--main-color)'>
                {face.back}
              </p>
              {face.note && (
                <p className='text-center text-sm text-(--secondary-color)'>
                  {t('phrases.polite')}: {face.note}
                </p>
              )}
              <RecallGradeButtons labels={labels} onGrade={onGrade} />
            </>
          ) : (
            <ActionButton
              type='button'
              onClick={() => setRevealedFor(revealKey)}
              borderBottomThickness={10}
              borderRadius='3xl'
              className='min-h-12'
            >
              {t('lesson.reveal')}
            </ActionButton>
          )}
        </section>
      ) : (
        <>
          {day ? (
            <DayOverview
              day={day}
              kanaHeading={t('lesson.kanaHeading')}
              phraseHeading={t('lesson.phraseHeading')}
              politeLabel={t('phrases.polite')}
              startLabel={
                phase === 'practice' || phase === 'review'
                  ? t('lesson.resume')
                  : t('lesson.start')
              }
              onStart={() => {
                if (
                  (phase === 'practice' || phase === 'review') &&
                  queue.length > 0 &&
                  queueIndex < queue.length
                ) {
                  return;
                }
                beginPractice(lessonPracticeIds(day));
              }}
            />
          ) : (
            <p className='rounded-3xl bg-(--card-color) p-4 text-(--secondary-color)'>
              {t('lesson.finishedChart')}
            </p>
          )}
          {dueCount > 0 && (
            <ActionButton
              type='button'
              onClick={() => beginReview(dueIds, false)}
              colorScheme='secondary'
              borderColorScheme='secondary'
              borderBottomThickness={10}
              borderRadius='3xl'
              className='min-h-12'
            >
              {t('lesson.reviewNow')}
            </ActionButton>
          )}
        </>
      )}
    </main>
  );
};

const DayOverview = ({
  day,
  kanaHeading,
  phraseHeading,
  politeLabel,
  startLabel,
  onStart,
}: {
  day: LessonDay;
  kanaHeading: string;
  phraseHeading: string;
  politeLabel: string;
  startLabel: string;
  onStart: () => void;
}) => (
  <>
    {day.kana.length > 0 && (
      <section className='rounded-3xl bg-(--card-color) p-4'>
        <h2 className='mb-3 text-sm font-medium text-(--secondary-color)'>
          {kanaHeading}
        </h2>
        <div className='flex flex-wrap justify-center gap-2'>
          {day.kana.map(item => (
            <div key={item.char} className='flex flex-col items-center'>
              <SpeakableKana text={item.char}>
                <span className='text-5xl leading-none'>{item.char}</span>
              </SpeakableKana>
              <span className='text-sm text-(--secondary-color)'>
                {item.romaji}
              </span>
            </div>
          ))}
        </div>
      </section>
    )}
    {day.phraseIds.length > 0 && (
      <section className='flex flex-col gap-3'>
        <h2 className='text-sm font-medium text-(--secondary-color)'>
          {phraseHeading}
        </h2>
        {day.phraseIds.map(id => {
          const phrase = getPhraseById(id);
          if (!phrase) return null;
          return (
            <article key={id} className='rounded-3xl bg-(--card-color) p-4'>
              <div className='flex items-start justify-between gap-3'>
                <p className='text-3xl text-(--main-color)' lang='ja'>
                  {phrase.kanji ?? phrase.kana}
                </p>
                <AudioButton
                  text={phrase.speech}
                  size='sm'
                  variant='icon-only'
                />
              </div>
              {phrase.kanji && (
                <p className='text-base text-(--secondary-color)' lang='ja'>
                  {phrase.kana}
                </p>
              )}
              <p className='text-sm text-(--secondary-color)'>
                {phrase.romaji}
              </p>
              <p className='text-base text-(--main-color)'>{phrase.english}</p>
              {phrase.politeNote && (
                <p className='mt-1 text-sm text-(--secondary-color)'>
                  {politeLabel}: {phrase.politeNote}
                </p>
              )}
            </article>
          );
        })}
      </section>
    )}
    <ActionButton
      type='button'
      onClick={onStart}
      borderBottomThickness={10}
      borderRadius='3xl'
      className='min-h-12'
    >
      {startLabel}
    </ActionButton>
  </>
);

export default TodaysLessonPage;
