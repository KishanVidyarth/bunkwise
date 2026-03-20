import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Settings, Calendar, TrendingUp, AlertCircle, Trash2, BookOpen, Bell, User, LogIn } from 'lucide-react';
import { Subject, AttendanceRecord, TabType, AttendanceStatus, Reminder, UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { SubjectCard } from './components/SubjectCard';
import { ProgressBar } from './components/ProgressBar';
import { ProfileView } from './components/ProfileView';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  updateDoc,
  User as FirebaseUser
} from './firebase';

const COLORS = [
  'bg-zinc-900',
  'bg-emerald-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-amber-500',
];

const DEFAULT_STATUSES: AttendanceStatus[] = [
  { id: 'present', label: 'Present', color: 'bg-emerald-500', type: 'present' },
  { id: 'absent', label: 'Absent', color: 'bg-rose-500', type: 'absent' },
  { id: 'late', label: 'Late', color: 'bg-amber-500', type: 'present' },
  { id: 'excused', label: 'Excused', color: 'bg-blue-500', type: 'neutral' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [statuses, setStatuses] = useState<AttendanceStatus[]>(DEFAULT_STATUSES);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ name: 'Student', institution: 'University' });
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectGoal, setNewSubjectGoal] = useState(75);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync with Firestore
  useEffect(() => {
    if (!user) return;

    // Sync Profile
    const profileRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(prev => ({ ...prev, ...data }));
        if (data.darkMode !== undefined) setDarkMode(data.darkMode);
      } else {
        // Create initial profile in Firestore if it doesn't exist
        setDoc(profileRef, { 
          name: user.displayName || 'Student', 
          darkMode: darkMode,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    });

    // Sync Subjects
    const subjectsRef = collection(db, 'users', user.uid, 'subjects');
    const unsubSubjects = onSnapshot(subjectsRef, (snap) => {
      const subs: Subject[] = [];
      snap.forEach(d => subs.push({ id: d.id, ...d.data() } as Subject));
      setSubjects(subs);
    });

    // Sync Records
    const recordsRef = collection(db, 'users', user.uid, 'records');
    const unsubRecords = onSnapshot(recordsRef, (snap) => {
      const recs: AttendanceRecord[] = [];
      snap.forEach(d => recs.push({ id: d.id, ...d.data() } as AttendanceRecord));
      setRecords(recs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    // Sync Statuses
    const statusesRef = collection(db, 'users', user.uid, 'statuses');
    const unsubStatuses = onSnapshot(statusesRef, (snap) => {
      if (!snap.empty) {
        const stats: AttendanceStatus[] = [];
        snap.forEach(d => stats.push({ id: d.id, ...d.data() } as AttendanceStatus));
        setStatuses(stats);
      } else {
        // Seed default statuses
        DEFAULT_STATUSES.forEach(s => {
          setDoc(doc(db, 'users', user.uid, 'statuses', s.id), { ...s, userId: user.uid });
        });
      }
    });

    // Sync Reminders
    const remindersRef = collection(db, 'users', user.uid, 'reminders');
    const unsubReminders = onSnapshot(remindersRef, (snap) => {
      const rems: Reminder[] = [];
      snap.forEach(d => rems.push({ id: d.id, ...d.data() } as Reminder));
      setReminders(rems);
    });

    return () => {
      unsubProfile();
      unsubSubjects();
      unsubRecords();
      unsubStatuses();
      unsubReminders();
    };
  }, [user]);

  const handleMigrate = async () => {
    if (!user) return;
    const localSubjects = localStorage.getItem('bunkwise_subjects');
    const localRecords = localStorage.getItem('bunkwise_records');
    const localStatuses = localStorage.getItem('bunkwise_statuses');
    const localReminders = localStorage.getItem('bunkwise_reminders');

    if (localSubjects) {
      const subs = JSON.parse(localSubjects) as Subject[];
      for (const s of subs) {
        await setDoc(doc(db, 'users', user.uid, 'subjects', s.id), { ...s, userId: user.uid });
      }
    }
    if (localRecords) {
      const recs = JSON.parse(localRecords) as AttendanceRecord[];
      for (const r of recs) {
        await setDoc(doc(db, 'users', user.uid, 'records', r.id), { ...r, userId: user.uid });
      }
    }
    if (localStatuses) {
      const stats = JSON.parse(localStatuses) as AttendanceStatus[];
      for (const s of stats) {
        await setDoc(doc(db, 'users', user.uid, 'statuses', s.id), { ...s, userId: user.uid });
      }
    }
    if (localReminders) {
      const rems = JSON.parse(localReminders) as Reminder[];
      for (const r of rems) {
        await setDoc(doc(db, 'users', user.uid, 'reminders', r.id), { ...r, userId: user.uid });
      }
    }
    alert('Data migration complete! Your data is now synced to the cloud.');
  };

  // Load local data (only if not logged in)
  useEffect(() => {
    if (user) return;
    const savedSubjects = localStorage.getItem('bunkwise_subjects');
    const savedRecords = localStorage.getItem('bunkwise_records');
    const savedStatuses = localStorage.getItem('bunkwise_statuses');
    const savedReminders = localStorage.getItem('bunkwise_reminders');
    const savedProfile = localStorage.getItem('bunkwise_profile');
    const savedDarkMode = localStorage.getItem('bunkwise_darkmode');

    if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
    if (savedRecords) setRecords(JSON.parse(savedRecords));
    if (savedStatuses) setStatuses(JSON.parse(savedStatuses));
    if (savedReminders) setReminders(JSON.parse(savedReminders));
    if (savedProfile) setProfile(JSON.parse(savedProfile));
    if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));
  }, [user]);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Save data locally (only if not logged in)
  useEffect(() => {
    if (user) return;
    localStorage.setItem('bunkwise_subjects', JSON.stringify(subjects));
    localStorage.setItem('bunkwise_records', JSON.stringify(records));
    localStorage.setItem('bunkwise_statuses', JSON.stringify(statuses));
    localStorage.setItem('bunkwise_reminders', JSON.stringify(reminders));
    localStorage.setItem('bunkwise_profile', JSON.stringify(profile));
    localStorage.setItem('bunkwise_darkmode', JSON.stringify(darkMode));
  }, [subjects, records, statuses, reminders, profile, darkMode, user]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setSubjects([]);
      setRecords([]);
      setStatuses(DEFAULT_STATUSES);
      setReminders([]);
      setProfile({ name: 'Student', institution: 'University' });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const addSubject = async () => {
    if (!newSubjectName.trim()) return;
    const newSubject: Subject = {
      id: crypto.randomUUID(),
      name: newSubjectName,
      present: 0,
      total: 0,
      goal: newSubjectGoal,
      color: COLORS[subjects.length % COLORS.length],
      userId: user?.uid
    };

    if (user) {
      await setDoc(doc(db, 'users', user.uid, 'subjects', newSubject.id), newSubject);
    } else {
      setSubjects([...subjects, newSubject]);
    }
    setNewSubjectName('');
    setIsAddingSubject(false);
  };

  const markAttendance = async (subjectId: string, statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    if (!status) return;

    const newRecord: AttendanceRecord = {
      id: crypto.randomUUID(),
      subjectId,
      date: new Date().toISOString(),
      statusId,
      userId: user?.uid
    };

    if (user) {
      await setDoc(doc(db, 'users', user.uid, 'records', newRecord.id), newRecord);
      const subject = subjects.find(s => s.id === subjectId);
      if (subject) {
        const isPresent = status.type === 'present';
        const isAbsent = status.type === 'absent';
        await updateDoc(doc(db, 'users', user.uid, 'subjects', subjectId), {
          present: isPresent ? subject.present + 1 : subject.present,
          total: (isPresent || isAbsent) ? subject.total + 1 : subject.total,
        });
      }
    } else {
      setRecords([newRecord, ...records]);
      setSubjects(subjects.map(s => {
        if (s.id === subjectId) {
          const isPresent = status.type === 'present';
          const isAbsent = status.type === 'absent';
          return {
            ...s,
            present: isPresent ? s.present + 1 : s.present,
            total: (isPresent || isAbsent) ? s.total + 1 : s.total,
          };
        }
        return s;
      }));
    }
  };

  const deleteSubject = async (id: string) => {
    if (user) {
      await deleteDoc(doc(db, 'users', user.uid, 'subjects', id));
      // Optionally delete related records
      const relatedRecords = records.filter(r => r.subjectId === id);
      for (const r of relatedRecords) {
        await deleteDoc(doc(db, 'users', user.uid, 'records', r.id));
      }
    } else {
      setSubjects(subjects.filter(s => s.id !== id));
      setRecords(records.filter(r => r.subjectId !== id));
    }
  };

  const updateSubject = async (updated: Subject) => {
    if (user) {
      await updateDoc(doc(db, 'users', user.uid, 'subjects', updated.id), { ...updated });
    } else {
      setSubjects(subjects.map(s => s.id === updated.id ? updated : s));
    }
  };

  const updateProfile = async (newProfile: UserProfile) => {
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { ...newProfile, updatedAt: new Date().toISOString() });
    } else {
      setProfile(newProfile);
    }
  };

  const updateDarkMode = async (val: boolean) => {
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { darkMode: val, updatedAt: new Date().toISOString() });
    } else {
      setDarkMode(val);
    }
  };

  const updateStatuses = async (newStatuses: AttendanceStatus[]) => {
    if (user) {
      // This is a bit complex for a simple update, but for now we'll just handle additions/deletions via specific methods if needed
      // For simplicity, we'll just set the whole list if it's small
      for (const s of newStatuses) {
        await setDoc(doc(db, 'users', user.uid, 'statuses', s.id), { ...s, userId: user.uid });
      }
    } else {
      setStatuses(newStatuses);
    }
  };

  const updateReminders = async (newReminders: Reminder[]) => {
    if (user) {
      for (const r of newReminders) {
        await setDoc(doc(db, 'users', user.uid, 'reminders', r.id), { ...r, userId: user.uid });
      }
    } else {
      setReminders(newReminders);
    }
  };

  // Notification logic
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkReminders = () => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const todayStr = now.toISOString().split('T')[0];

      setReminders(prev => {
        let changed = false;
        const nextReminders = prev.map(reminder => {
          if (
            reminder.enabled &&
            reminder.days.includes(currentDay) &&
            reminder.time === currentTime &&
            (!reminder.lastNotified || !reminder.lastNotified.startsWith(todayStr))
          ) {
            // Trigger notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('BunkWise Reminder', {
                body: reminder.label,
                icon: '/favicon.ico'
              });
            }
            changed = true;
            return { ...reminder, lastNotified: now.toISOString() };
          }
          return reminder;
        });
        return changed ? nextReminders : prev;
      });
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [reminders]);

  const overallAttendance = subjects.length === 0 
    ? 0 
    : Math.round((subjects.reduce((acc, s) => acc + s.present, 0) / 
                 Math.max(subjects.reduce((acc, s) => acc + s.total, 0), 1)) * 100);

  const totalClasses = subjects.reduce((acc, s) => acc + s.total, 0);
  const totalPresent = subjects.reduce((acc, s) => acc + s.present, 0);

  return (
    <div className="min-h-screen pb-32 pt-8 px-6 max-w-md mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">BunkWise</h1>
          <p className="text-sm font-medium text-zinc-500">Hello, {profile.name.split(' ')[0]}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('profile')}
          className="p-3 glass rounded-full flex items-center gap-2"
        >
          {user ? (
            <img src={user.photoURL || ''} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <User size={20} className="text-zinc-600 dark:text-zinc-400" />
          )}
        </motion.button>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Overall Stat Card */}
            <div className="glass p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Overall Attendance</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold tracking-tighter">{overallAttendance}%</span>
                  <span className={`text-sm font-bold ${overallAttendance >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {overallAttendance >= 75 ? 'Safe' : 'Critical'}
                  </span>
                </div>
                <ProgressBar value={totalPresent} max={totalClasses} color="bg-zinc-900 dark:bg-zinc-100" height={10} />
                <div className="flex justify-between mt-4 text-xs font-medium text-zinc-500">
                  <span>{totalPresent} Present</span>
                  <span>{totalClasses} Total</span>
                </div>
              </div>
              <div className="absolute -right-4 -top-4 opacity-5">
                <TrendingUp size={120} />
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-5 rounded-3xl">
                <Calendar size={20} className="text-blue-500 mb-3" />
                <p className="text-2xl font-bold tracking-tight">{totalClasses}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Classes</p>
              </div>
              <div className="glass p-5 rounded-3xl">
                <AlertCircle size={20} className="text-amber-500 mb-3" />
                <p className="text-2xl font-bold tracking-tight">
                  {subjects.filter(s => (s.total > 0 && (s.present / s.total) * 100 < s.goal)).length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Low Attendance</p>
              </div>
            </div>

            {/* Recent Activity Mini List */}
            <div>
              <h2 className="text-lg font-semibold mb-4 px-1">Recent Activity</h2>
              <div className="space-y-3">
                {records.slice(0, 3).map(record => {
                  const subject = subjects.find(s => s.id === record.subjectId);
                  const status = statuses.find(s => s.id === record.statusId);
                  return (
                    <div key={record.id} className="glass p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${status?.color || 'bg-zinc-400'}`} />
                        <div>
                          <p className="text-sm font-semibold">{subject?.name || 'Deleted Subject'}</p>
                          <p className="text-[10px] text-zinc-500 font-medium">
                            {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${status?.color.replace('bg-', 'text-') || 'text-zinc-500'}`}>
                        {status?.label || 'Unknown'}
                      </span>
                    </div>
                  );
                })}
                {records.length === 0 && (
                  <p className="text-center py-8 text-zinc-400 text-sm italic">No activity yet.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'subjects' && (
          <motion.div
            key="subjects"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="flex justify-between items-center mb-6 px-1">
              <h2 className="text-xl font-bold tracking-tight">Your Subjects</h2>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsAddingSubject(true)}
                className="p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full shadow-md"
              >
                <Plus size={20} />
              </motion.button>
            </div>

            <div className="space-y-4">
              {subjects.map(subject => (
                <SubjectCard 
                  key={subject.id} 
                  subject={subject} 
                  statuses={statuses}
                  onMark={markAttendance}
                  onEdit={(s) => setSubjectToDelete(s.id)}
                />
              ))}
              {subjects.length === 0 && (
                <div className="text-center py-20">
                  <BookOpen size={48} className="mx-auto text-zinc-200 mb-4" />
                  <p className="text-zinc-400 font-medium">Add your first subject to start tracking.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <h2 className="text-xl font-bold tracking-tight mb-6 px-1">Attendance History</h2>
            <div className="space-y-3">
              {records.map(record => {
                const subject = subjects.find(s => s.id === record.subjectId);
                const status = statuses.find(s => s.id === record.statusId);
                return (
                  <div key={record.id} className="glass p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status?.color.replace('bg-', 'bg-opacity-10 bg-') || 'bg-zinc-100'}`}>
                        <div className={`w-2 h-2 rounded-full ${status?.color || 'bg-zinc-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{subject?.name || 'Deleted Subject'}</p>
                        <p className="text-[10px] text-zinc-500 font-medium">
                          {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${status?.color.replace('bg-', 'text-') || 'text-zinc-500'}`}>
                      {status?.label}
                    </span>
                  </div>
                );
              })}
              {records.length === 0 && (
                <p className="text-center py-20 text-zinc-400 font-medium italic">History is empty.</p>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <ProfileView
              profile={profile}
              setProfile={updateProfile}
              subjects={subjects}
              onUpdateSubject={updateSubject}
              onDeleteSubject={setSubjectToDelete}
              statuses={statuses}
              setStatuses={updateStatuses}
              reminders={reminders}
              setReminders={updateReminders}
              darkMode={darkMode}
              setDarkMode={updateDarkMode}
              user={user}
              onSignIn={signInWithGoogle}
              onSignOut={handleSignOut}
              onMigrate={handleMigrate}
              onAddSubject={async (s) => {
                const newSubject: Subject = {
                  ...s,
                  id: crypto.randomUUID(),
                  present: 0,
                  total: 0,
                  color: COLORS[subjects.length % COLORS.length],
                  userId: user?.uid
                };
                if (user) {
                  await setDoc(doc(db, 'users', user.uid, 'subjects', newSubject.id), newSubject);
                } else {
                  setSubjects([...subjects, newSubject]);
                }
              }}
              onTestNotification={() => {
                if ('Notification' in window) {
                  if (Notification.permission === 'granted') {
                    new Notification('BunkWise Test', { body: 'This is a test notification!' });
                  } else {
                    Notification.requestPermission().then(permission => {
                      if (permission === 'granted') {
                        new Notification('BunkWise Test', { body: 'This is a test notification!' });
                      }
                    });
                  }
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Subject Modal */}
      <AnimatePresence>
        {isAddingSubject && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingSubject(false)}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="fixed bottom-10 left-6 right-6 glass p-8 rounded-[2.5rem] z-[70] shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">New Subject</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Subject Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="e.g. Mathematics"
                    className="w-full mt-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 ring-zinc-900 dark:ring-white transition-all outline-none"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Attendance Goal</label>
                    <span className="text-sm font-bold">{newSubjectGoal}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={newSubjectGoal}
                    onChange={(e) => setNewSubjectGoal(parseInt(e.target.value))}
                    className="w-full mt-4 accent-zinc-900 dark:accent-white"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsAddingSubject(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addSubject}
                    className="flex-1 py-4 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm shadow-lg"
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {subjectToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSubjectToDelete(null)}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-6 right-6 -translate-y-1/2 glass p-8 rounded-[2.5rem] z-[90] shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Delete Subject?</h3>
              <p className="text-sm text-zinc-500 mb-8">This will permanently remove all attendance records for this subject.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSubjectToDelete(null)}
                  className="flex-1 py-4 rounded-2xl font-bold text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteSubject(subjectToDelete);
                    setSubjectToDelete(null);
                  }}
                  className="flex-1 py-4 rounded-2xl bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
