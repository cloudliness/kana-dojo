import type { Metadata } from 'next';
import { generatePageMetadata } from '@/core/i18n/metadata-helpers';
import { routing } from '@/core/i18n/routing';
import { TodaysLessonPage } from '@/features/DailyLesson';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata('dailyLesson', {
    locale,
    pathname: '/lesson',
  });
}

export default function LessonPage() {
  return <TodaysLessonPage />;
}
