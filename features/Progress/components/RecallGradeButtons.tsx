'use client';

import { ActionButton } from '@/shared/ui/components/ActionButton';
import type { RecallGrade } from '@/features/Progress/lib/sm2';

interface RecallGradeButtonsProps {
  labels: Record<RecallGrade, string>;
  onGrade: (grade: RecallGrade) => void;
}

const GRADES: RecallGrade[] = ['again', 'hard', 'good', 'easy'];

const RecallGradeButtons = ({ labels, onGrade }: RecallGradeButtonsProps) => (
  <div className='grid w-full grid-cols-2 gap-2'>
    {GRADES.map(grade => (
      <ActionButton
        key={grade}
        type='button'
        onClick={() => onGrade(grade)}
        colorScheme={
          grade === 'good' || grade === 'easy' ? 'main' : 'secondary'
        }
        borderColorScheme={
          grade === 'good' || grade === 'easy' ? 'main' : 'secondary'
        }
        borderBottomThickness={8}
        borderRadius='2xl'
        className='min-h-12 px-2 py-3 text-base'
      >
        {labels[grade]}
      </ActionButton>
    ))}
  </div>
);

export default RecallGradeButtons;
