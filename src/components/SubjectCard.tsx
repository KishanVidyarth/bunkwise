import React from 'react';
import { motion } from 'motion/react';
import { Check, X, MoreHorizontal, ChevronDown } from 'lucide-react';
import { Subject, AttendanceStatus } from '../types';
import { ProgressBar } from './ProgressBar';
import { AnimatePresence } from 'motion/react';

interface SubjectCardProps {
  subject: Subject;
  statuses: AttendanceStatus[];
  onMark: (id: string, statusId: string) => void;
  onEdit: (subject: Subject) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, statuses, onMark, onEdit }) => {
  const [showStatusMenu, setShowStatusMenu] = React.useState(false);
  const percentage = subject.total === 0 ? 0 : Math.round((subject.present / subject.total) * 100);
  const isBelowGoal = percentage < subject.goal && subject.total > 0;
  
  const calculateStatus = () => {
    if (subject.total === 0) return "No classes yet";
    
    if (percentage >= subject.goal) {
      const canBunk = Math.floor((100 * subject.present - subject.goal * subject.total) / subject.goal);
      return canBunk > 0 ? `You can bunk ${canBunk} more` : "On the edge";
    } else {
      const needToAttend = Math.ceil((subject.goal * subject.total - 100 * subject.present) / (100 - subject.goal));
      return `Attend ${needToAttend} more to reach goal`;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass p-5 rounded-3xl shadow-sm mb-4 relative"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{subject.name}</h3>
          {subject.professor && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-0.5">
              Prof. {subject.professor}
            </p>
          )}
          <p className={`text-xs font-medium mt-0.5 ${isBelowGoal ? 'text-rose-500' : 'text-zinc-500'}`}>
            {calculateStatus()}
          </p>
        </div>
        <button 
          onClick={() => onEdit(subject)}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
          <MoreHorizontal size={18} className="text-zinc-400" />
        </button>
      </div>

      <div className="flex items-end justify-between mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tighter">{percentage}%</span>
          <span className="text-xs text-zinc-400 font-medium mb-1">/ {subject.goal}%</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Attendance</p>
          <p className="text-sm font-medium">{subject.present} / {subject.total}</p>
        </div>
      </div>

      <ProgressBar 
        value={subject.present} 
        max={subject.total} 
        color={isBelowGoal ? 'bg-rose-500' : subject.color}
      />

      <div className="grid grid-cols-2 gap-3 mt-5">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const presentStatus = statuses.find(s => s.type === 'present');
            if (presentStatus) onMark(subject.id, presentStatus.id);
          }}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-sm shadow-sm"
        >
          <Check size={16} strokeWidth={3} />
          Present
        </motion.button>
        
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-semibold text-sm text-zinc-600 dark:text-zinc-300 shadow-sm"
          >
            Other
            <ChevronDown size={14} className={`transition-transform duration-300 ${showStatusMenu ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {showStatusMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full mb-2 right-0 w-48 glass rounded-2xl shadow-xl z-20 overflow-hidden border border-zinc-200 dark:border-zinc-800"
              >
                <div className="p-1">
                  {statuses.filter(s => s.type !== 'present').map(status => (
                    <button
                      key={status.id}
                      onClick={() => {
                        onMark(subject.id, status.id);
                        setShowStatusMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                    >
                      <div className={`w-2 h-2 rounded-full ${status.color}`} />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{status.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
