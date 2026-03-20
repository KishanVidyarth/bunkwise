import React from 'react';
import { motion } from 'motion/react';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max, 
  color = 'bg-zinc-900',
  height = 8 
}) => {
  const percentage = max === 0 ? 0 : Math.min((value / max) * 100, 100);

  return (
    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden" style={{ height }}>
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
      />
    </div>
  );
};
