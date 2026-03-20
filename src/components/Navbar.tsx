import React from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, BookOpen, History, User } from 'lucide-react';
import { TabType } from '../types';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutGrid },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-md z-50">
      <div className="glass rounded-full p-2 flex items-center justify-between shadow-lg border-white/40 dark:border-zinc-800/60">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className="relative flex-1 flex flex-col items-center py-2 transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-zinc-900/5 dark:bg-white/5 rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon 
                size={20} 
                className={`relative z-10 mb-0.5 transition-colors duration-300 ${
                  isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'
                }`} 
              />
              <span className={`relative z-10 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
