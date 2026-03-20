import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, BookOpen, Bell, Palette, Plus, Trash2, Edit2, Check, X, Clock, Moon, Sun } from 'lucide-react';
import { UserProfile, Subject, AttendanceStatus, Reminder } from '../types';

interface ProfileViewProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  subjects: Subject[];
  onUpdateSubject: (s: Subject) => void;
  onDeleteSubject: (id: string) => void;
  statuses: AttendanceStatus[];
  setStatuses: (s: AttendanceStatus[]) => void;
  reminders: Reminder[];
  setReminders: (r: Reminder[]) => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  user: any;
  onSignIn: () => void;
  onSignOut: () => void;
  onMigrate: () => void;
  onAddSubject: (s: Omit<Subject, 'id' | 'present' | 'total'>) => Promise<void>;
  onTestNotification: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  setProfile,
  subjects,
  onUpdateSubject,
  onDeleteSubject,
  statuses,
  setStatuses,
  reminders,
  setReminders,
  darkMode,
  setDarkMode,
  user,
  onSignIn,
  onSignOut,
  onMigrate,
  onAddSubject,
  onTestNotification,
}) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'courses' | 'statuses' | 'reminders'>('profile');
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [isAddingReminder, setIsAddingReminder] = useState(false);

  // Course creation state
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseProfessor, setNewCourseProfessor] = useState('');
  const [newCourseSchedule, setNewCourseSchedule] = useState<number[]>([]);
  const [newCourseGoal, setNewCourseGoal] = useState(75);

  // Status creation state
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newStatusType, setNewStatusType] = useState<'present' | 'absent' | 'neutral'>('absent');
  const [newStatusColor, setNewStatusColor] = useState('bg-rose-500');

  // Reminder creation state
  const [newReminderLabel, setNewReminderLabel] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('09:00');
  const [newReminderDays, setNewReminderDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const addStatus = () => {
    if (!newStatusLabel) return;
    const status: AttendanceStatus = {
      id: crypto.randomUUID(),
      label: newStatusLabel,
      type: newStatusType,
      color: newStatusColor,
    };
    setStatuses([...statuses, status]);
    setNewStatusLabel('');
    setIsAddingStatus(false);
  };

  const addReminder = () => {
    if (!newReminderLabel) return;
    const reminder: Reminder = {
      id: crypto.randomUUID(),
      label: newReminderLabel,
      time: newReminderTime,
      days: newReminderDays,
      enabled: true,
    };
    setReminders([...reminders, reminder]);
    setNewReminderLabel('');
    setIsAddingReminder(false);
  };

  const addCourse = () => {
    if (!newCourseName) return;
    onAddSubject({
      name: newCourseName,
      professor: newCourseProfessor,
      schedule: newCourseSchedule.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]),
      goal: newCourseGoal,
      color: 'bg-zinc-900', // Default color, App.tsx will handle it if needed
    });
    setNewCourseName('');
    setNewCourseProfessor('');
    setNewCourseSchedule([]);
    setIsAddingSubject(false);
  };

  const toggleScheduleDay = (day: number, isEditing: boolean = false) => {
    if (isEditing && editingSubject) {
      const currentSchedule = editingSubject.schedule || [];
      const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day];
      const newSchedule = currentSchedule.includes(dayName)
        ? currentSchedule.filter(d => d !== dayName)
        : [...currentSchedule, dayName];
      setEditingSubject({ ...editingSubject, schedule: newSchedule });
    } else {
      if (newCourseSchedule.includes(day)) {
        setNewCourseSchedule(newCourseSchedule.filter(d => d !== day));
      } else {
        setNewCourseSchedule([...newCourseSchedule, day].sort());
      }
    }
  };

  const toggleReminderDay = (day: number) => {
    if (newReminderDays.includes(day)) {
      setNewReminderDays(newReminderDays.filter(d => d !== day));
    } else {
      setNewReminderDays([...newReminderDays, day].sort());
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'statuses', label: 'Statuses', icon: Palette },
    { id: 'reminders', label: 'Reminders', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      {/* Section Selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {sections.map(s => {
          const Icon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md' 
                  : 'glass text-zinc-500'
              }`}
            >
              <Icon size={16} />
              <span className="text-sm font-bold">{s.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeSection === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="glass p-6 rounded-[2.5rem] flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 border-4 border-white dark:border-zinc-900 shadow-inner overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={48} className="text-zinc-300" />
                )}
              </div>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="text-2xl font-bold bg-transparent border-none text-center focus:ring-0 w-full"
                placeholder="Your Name"
              />
              <input
                type="text"
                value={profile.institution || ''}
                onChange={(e) => setProfile({ ...profile, institution: e.target.value })}
                className="text-sm text-zinc-500 bg-transparent border-none text-center focus:ring-0 w-full"
                placeholder="Institution Name"
              />
              
              <div className="mt-6 w-full space-y-3">
                {user ? (
                  <>
                    <button 
                      onClick={onSignOut}
                      className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-rose-500 rounded-2xl font-bold text-sm transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    >
                      Sign Out
                    </button>
                    <button 
                      onClick={onMigrate}
                      className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl font-bold text-xs transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                      Migrate Local Data to Cloud
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={onSignIn}
                    className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2"
                  >
                    <User size={16} />
                    Sign in with Google
                  </button>
                )}
                {!user && (
                  <p className="text-[10px] text-zinc-400 mt-3 px-4">
                    Sign in to sync your data across devices and keep your attendance history safe.
                  </p>
                )}
              </div>
            </div>

            <div className="glass p-6 rounded-[2.5rem] space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-1">Preferences</h3>
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                    {darkMode ? <Moon size={20} className="text-zinc-400" /> : <Sun size={20} className="text-amber-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold">Dark Mode</p>
                    <p className="text-[10px] text-zinc-500 font-medium">Easier on the eyes</p>
                  </div>
                </div>
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${darkMode ? 'bg-zinc-100' : 'bg-zinc-900'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${darkMode ? 'right-1 bg-zinc-900' : 'left-1 bg-white'}`} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'courses' && (
          <motion.div
            key="courses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center px-1">
              <h3 className="font-bold">My Courses</h3>
              <button 
                onClick={() => setIsAddingSubject(true)}
                className="p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full"
              >
                <Plus size={16} />
              </button>
            </div>
            {subjects.map(s => (
              <div key={s.id} className="glass p-5 rounded-3xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold">{s.name}</h4>
                  <p className="text-xs text-zinc-500">Prof. {s.professor || 'Not set'}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingSubject(s)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <Edit2 size={16} className="text-zinc-400" />
                  </button>
                  <button 
                    onClick={() => onDeleteSubject(s.id)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <Trash2 size={16} className="text-rose-400" />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeSection === 'statuses' && (
          <motion.div
            key="statuses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center px-1">
              <h3 className="font-bold">Custom Statuses</h3>
              <button 
                onClick={() => setIsAddingStatus(true)}
                className="p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {statuses.map(s => (
                <div key={s.id} className="glass p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${s.color}`} />
                    <div>
                      <p className="text-sm font-bold">{s.label}</p>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">{s.type}</p>
                    </div>
                  </div>
                  {s.type !== 'present' && s.label !== 'Absent' && (
                    <button onClick={() => setStatuses(statuses.filter(st => st.id !== s.id))}>
                      <Trash2 size={14} className="text-zinc-300" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeSection === 'reminders' && (
          <motion.div
            key="reminders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center px-1">
              <h3 className="font-bold">Reminders</h3>
              <div className="flex gap-2">
                <button 
                  onClick={onTestNotification}
                  className="px-3 py-1.5 glass text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Test
                </button>
                <button 
                  onClick={() => setIsAddingReminder(true)}
                  className="p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {reminders.map(r => (
                <div key={r.id} className="glass p-5 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-900 dark:text-white">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="font-bold">{r.label}</p>
                      <p className="text-sm text-zinc-500">{r.time} • {['S','M','T','W','T','F','S'].filter((_, i) => r.days.includes(i)).join(', ')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setReminders(reminders.map(rem => rem.id === r.id ? { ...rem, enabled: !rem.enabled } : rem))}
                    className={`w-12 h-6 rounded-full relative transition-colors ${r.enabled ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${r.enabled ? 'right-1 bg-white dark:bg-zinc-900' : 'left-1 bg-zinc-400'}`} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {editingSubject && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingSubject(null)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-10 left-6 right-6 glass p-8 rounded-[2.5rem] z-[110] shadow-2xl">
              <h3 className="text-xl font-bold mb-6">Edit Course</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  placeholder="Course Name"
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl px-5 py-4 text-sm font-medium outline-none"
                />
                <input
                  type="text"
                  value={editingSubject.professor || ''}
                  onChange={(e) => setEditingSubject({ ...editingSubject, professor: e.target.value })}
                  placeholder="Professor Name"
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl px-5 py-4 text-sm font-medium outline-none"
                />
                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Schedule</p>
                  <div className="flex justify-between">
                    {['S','M','T','W','T','F','S'].map((d, i) => {
                      const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i];
                      const isActive = editingSubject.schedule?.includes(dayName);
                      return (
                        <button
                          key={i}
                          onClick={() => toggleScheduleDay(i, true)}
                          className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${isActive ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setEditingSubject(null)} className="flex-1 py-4 font-bold text-zinc-500">Cancel</button>
                  <button onClick={() => { onUpdateSubject(editingSubject); setEditingSubject(null); }} className="flex-1 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold">Save</button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {isAddingSubject && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingSubject(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-10 left-6 right-6 glass p-8 rounded-[2.5rem] z-[110] shadow-2xl">
              <h3 className="text-xl font-bold mb-6">New Course</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="Course Name"
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl px-5 py-4 text-sm font-medium outline-none"
                />
                <input
                  type="text"
                  value={newCourseProfessor}
                  onChange={(e) => setNewCourseProfessor(e.target.value)}
                  placeholder="Professor Name"
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl px-5 py-4 text-sm font-medium outline-none"
                />
                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Schedule</p>
                  <div className="flex justify-between">
                    {['S','M','T','W','T','F','S'].map((d, i) => (
                      <button
                        key={i}
                        onClick={() => toggleScheduleDay(i)}
                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${newCourseSchedule.includes(i) ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setIsAddingSubject(false)} className="flex-1 py-4 font-bold text-zinc-500">Cancel</button>
                  <button onClick={addCourse} className="flex-1 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold">Add</button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {isAddingStatus && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingStatus(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-10 left-6 right-6 glass p-8 rounded-[2.5rem] z-[110] shadow-2xl">
              <h3 className="text-xl font-bold mb-6">New Status</h3>
              <div className="space-y-6">
                <input
                  type="text"
                  value={newStatusLabel}
                  onChange={(e) => setNewStatusLabel(e.target.value)}
                  placeholder="Status Label (e.g. Late)"
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl px-5 py-4 text-sm font-medium outline-none"
                />
                <div className="flex gap-2">
                  {(['present', 'absent', 'neutral'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setNewStatusType(t)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${newStatusType === t ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setIsAddingStatus(false)} className="flex-1 py-4 font-bold text-zinc-500">Cancel</button>
                  <button onClick={addStatus} className="flex-1 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold">Add</button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {isAddingReminder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingReminder(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-10 left-6 right-6 glass p-8 rounded-[2.5rem] z-[110] shadow-2xl">
              <h3 className="text-xl font-bold mb-6">New Reminder</h3>
              <div className="space-y-6">
                <input
                  type="text"
                  value={newReminderLabel}
                  onChange={(e) => setNewReminderLabel(e.target.value)}
                  placeholder="Reminder Label"
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl px-5 py-4 text-sm font-medium outline-none"
                />
                <input
                  type="time"
                  value={newReminderTime}
                  onChange={(e) => setNewReminderTime(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl px-5 py-4 text-sm font-medium outline-none"
                />
                <div className="flex justify-between">
                  {['S','M','T','W','T','F','S'].map((d, i) => (
                    <button
                      key={i}
                      onClick={() => toggleReminderDay(i)}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${newReminderDays.includes(i) ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setIsAddingReminder(false)} className="flex-1 py-4 font-bold text-zinc-500">Cancel</button>
                  <button onClick={addReminder} className="flex-1 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold">Add</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
