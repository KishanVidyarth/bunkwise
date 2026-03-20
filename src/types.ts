export interface AttendanceStatus {
  id: string;
  label: string;
  color: string;
  type: 'present' | 'absent' | 'neutral';
  userId?: string;
}

export interface Subject {
  id: string;
  name: string;
  professor?: string;
  schedule?: string[]; // Days of week
  present: number;
  total: number;
  goal: number;
  color: string;
  userId?: string;
}

export interface AttendanceRecord {
  id: string;
  subjectId: string;
  date: string;
  statusId: string; // Reference to AttendanceStatus
  userId?: string;
}

export interface Reminder {
  id: string;
  subjectId?: string; // Optional: specific to a subject or general
  time: string; // HH:mm
  days: number[]; // 0-6 (Sun-Sat)
  enabled: boolean;
  label: string;
  lastNotified?: string; // ISO date string for when it was last triggered
  userId?: string;
}

export interface UserProfile {
  name: string;
  avatar?: string;
  institution?: string;
  darkMode?: boolean;
}

export type TabType = 'dashboard' | 'subjects' | 'history' | 'profile';
