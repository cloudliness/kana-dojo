'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { Random } from 'random-js';
import { useTranslations } from 'next-intl';
import { Link } from '@/core/i18n/routing';
import useKanaStore from '@/features/Kana/store/useKanaStore';
import { flattenKanaGroups } from '@/features/Kana/lib/flattenKanaGroup';
import {
  buildListeningQuestion,
  type ListeningQuestion,
} from '@/features/Kana/lib/buildListeningQuestion';
import { useAudioPreferences } from '@/features/Preferences';
import { useJapaneseTTS } from '@/features/Preferences/hooks/useJapaneseTTS';
import { useGameStats } from '@/shared/hooks/game/useGameStats';
import { useCorrect, useError } from '@/shared/hooks/generic/useAudio';
import AudioButton from '@/shared/ui-composite/audio/AudioButton';
import { ActionButton } from '@/shared/ui/components/ActionButton';

interface ListeningProps {
  isHidden: boolean;
}

const isHiragana = (char: string): boolean => {
  const code = char.codePointAt(0) ?? 0;
  return code >= 0x3040 && code <= 0x309f;
};

const Listening = ({ isHidden }: ListeningProps) => {
  const t = useTranslations('beginner');
  const kanaGroupIndices = useKanaStore(state => state.kanaGroupIndices);
  const pool = useMemo(
    () => flattenKanaGroups(kanaGroupIndices),
    [kanaGroupIndices],
  );
  const {
    pronunciationEnabled,
    setPronunciationEnabled,
    pronunciationSpeed,
    pronunciationPitch,
  } = useAudioPreferences();
  const { speak, stop, hasJapaneseVoices, voicesReady } = useJapaneseTTS();
  const { playCorrect } = useCorrect();
  const { playError } = useError();
  const stats = useGameStats('kana');
  const randomRef = useRef(new Random());
  const [question, setQuestion] = useState<ListeningQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const drawQuestion = useCallback(() => {
    const next = buildListeningQuestion(pool, (min, max) =>
      randomRef.current.integer(min, max),
    );
    setQuestion(next);
    setPicked(null);
  }, [pool]);

  useEffect(() => {
    drawQuestion();
  }, [drawQuestion]);

  useEffect(() => {
    if (
      isHidden ||
      !question ||
      !pronunciationEnabled ||
      !voicesReady ||
      !hasJapaneseVoices
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void speak(question.prompt.kana, {
        rate: pronunciationSpeed,
        pitch: pronunciationPitch,
        volume: 0.8,
      });
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
      stop();
    };
  }, [
    hasJapaneseVoices,
    isHidden,
    pronunciationEnabled,
    pronunciationPitch,
    pronunciationSpeed,
    question,
    speak,
    stop,
    voicesReady,
  ]);

  const handlePick = (option: string) => {
    if (!question || picked) return;
    setPicked(option);
    const correct = option === question.prompt.kana;
    if (correct) {
      playCorrect();
      stats.incrementCorrectAnswers();
      stats.incrementCharacterScore(question.prompt.kana, 'correct');
      if (isHiragana(question.prompt.kana)) stats.incrementHiraganaCorrect();
      else stats.incrementKatakanaCorrect();
      return;
    }
    playError();
    stats.incrementWrongAnswers();
    stats.incrementCharacterScore(question.prompt.kana, 'wrong');
  };

  if (isHidden) return null;

  const shell = (body: ReactNode) => (
    <div className='flex w-full max-w-lg flex-col items-center gap-4 px-2 pb-28'>
      {body}
    </div>
  );

  if (pool.length < 2) {
    return shell(
      <Notice
        title={t('listening.needSelection')}
        body={t('listening.emptyGroups')}
        action={
          <Link
            href='/kana'
            className='text-base font-medium text-(--main-color) underline'
          >
            {t('listening.backToKana')}
          </Link>
        }
      />,
    );
  }

  if (!pronunciationEnabled) {
    return shell(
      <Notice
        title={t('listening.ttsOff')}
        body={t('audio.pronunciationOff')}
        action={
          <ActionButton
            type='button'
            onClick={() => setPronunciationEnabled(true)}
            borderBottomThickness={10}
            borderRadius='3xl'
            className='min-h-12'
          >
            {t('listening.enableTts')}
          </ActionButton>
        }
      />,
    );
  }

  if (!voicesReady) {
    return shell(
      <Notice
        title={t('listening.checkingVoice')}
        body={t('listening.prompt')}
      />,
    );
  }

  if (!hasJapaneseVoices) {
    return shell(
      <Notice
        title={t('listening.noVoice')}
        body={t('listening.noVoiceHint')}
      />,
    );
  }

  if (!question) {
    return shell(
      <Notice
        title={t('listening.needSelection')}
        body={t('listening.emptyGroups')}
      />,
    );
  }

  const answered = picked !== null;
  const wasCorrect = picked === question.prompt.kana;

  return shell(
    <>
      <p className='text-center text-lg text-(--secondary-color)'>
        {t('listening.prompt')}
      </p>
      <AudioButton
        text={question.prompt.kana}
        size='lg'
        autoPlay={false}
        className='max-w-xs'
      />
      <div className='grid w-full grid-cols-2 gap-3'>
        {question.options.map(option => {
          const isCorrectOption = option === question.prompt.kana;
          const isPicked = option === picked;
          return (
            <button
              key={option}
              type='button'
              disabled={answered}
              onClick={() => handlePick(option)}
              className={clsx(
                'min-h-20 rounded-3xl border-b-8 text-5xl',
                'transition-colors',
                answered && isCorrectOption
                  ? 'border-green-700 bg-green-500 text-white'
                  : answered && isPicked
                    ? 'border-red-700 bg-red-500 text-white'
                    : 'border-(--border-color) bg-(--card-color) text-(--main-color)',
              )}
              lang='ja'
            >
              {option}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className='flex w-full flex-col items-center gap-3 text-center'>
          <p className='text-base text-(--main-color)'>
            {wasCorrect
              ? t('listening.correct')
              : t('listening.incorrect', {
                  kana: question.prompt.kana,
                  romaji: question.prompt.romaji,
                })}
          </p>
          <ActionButton
            type='button'
            onClick={drawQuestion}
            borderBottomThickness={10}
            borderRadius='3xl'
            className='min-h-12'
          >
            {t('listening.next')}
          </ActionButton>
        </div>
      )}
    </>,
  );
};

const Notice = ({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) => (
  <div className='flex w-full flex-col gap-3 rounded-3xl bg-(--card-color) p-5 text-center'>
    <h2 className='text-xl font-semibold text-(--main-color)'>{title}</h2>
    <p className='text-base text-(--secondary-color)'>{body}</p>
    {action}
  </div>
);

export default Listening;
