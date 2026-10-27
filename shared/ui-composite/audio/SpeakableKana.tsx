'use client';

import { useCallback, type MouseEvent, type ReactNode } from 'react';
import { Loader2, Volume2 } from 'lucide-react';
import clsx from 'clsx';
import { useAudioPreferences } from '@/features/Preferences';
import { useJapaneseTTS } from '@/features/Preferences/hooks/useJapaneseTTS';

interface SpeakableKanaProps {
  text: string;
  children?: ReactNode;
  className?: string;
  iconOnly?: boolean;
  label?: string;
}

/**
 * Tap target for a kana character. Uses the shared Japanese speech hook
 * and stays quiet when pronunciation is turned off.
 */
const SpeakableKana = ({
  text,
  children,
  className,
  iconOnly = false,
  label,
}: SpeakableKanaProps) => {
  const { speak, stop, isPlaying, refreshVoices } = useJapaneseTTS();
  const { pronunciationEnabled, pronunciationSpeed, pronunciationPitch } =
    useAudioPreferences();

  const handleClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.preventDefault();
      if (!pronunciationEnabled || !text) return;

      if (isPlaying) {
        stop();
        return;
      }

      refreshVoices();
      const isFirefox = /Firefox/i.test(navigator.userAgent);
      await new Promise(resolve =>
        window.setTimeout(resolve, isFirefox ? 300 : 100),
      );
      await speak(text, {
        rate: pronunciationSpeed,
        pitch: pronunciationPitch,
        volume: 0.8,
      });
    },
    [
      isPlaying,
      pronunciationEnabled,
      pronunciationPitch,
      pronunciationSpeed,
      refreshVoices,
      speak,
      stop,
      text,
    ],
  );

  if (!pronunciationEnabled) {
    if (iconOnly) return null;
    return <span className={className}>{children}</span>;
  }

  return (
    <button
      type='button'
      onClick={handleClick}
      className={clsx(
        'inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl text-(--main-color)',
        'hover:bg-(--border-color)/70 active:scale-95',
        iconOnly ? 'px-2' : 'flex-col gap-1 px-1.5 py-1',
        className,
      )}
      aria-label={label ?? `Play ${text}`}
      lang='ja'
    >
      {!iconOnly && children}
      {isPlaying ? (
        <Loader2 className='size-4 shrink-0 animate-spin' aria-hidden />
      ) : (
        <Volume2 className='size-4 shrink-0' aria-hidden />
      )}
    </button>
  );
};

export default SpeakableKana;
