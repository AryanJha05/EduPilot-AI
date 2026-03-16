import { motion } from 'framer-motion';
import {
  GraduationCap,
  Languages,
  Wallet,
  Globe2,
  CheckCircle2,
  CircleDashed,
  BookOpen,
  CalendarDays,
  Pencil,
} from 'lucide-react';
import type { ExtendedStudentProfile } from '@/hooks/use-profile';

interface ProfilePanelProps {
  profile: ExtendedStudentProfile | null;
  onEditProfile?: () => void;
}

export function ProfilePanel({ profile, onEditProfile }: ProfilePanelProps) {
  const items = [
    {
      id: 'cgpa',
      label: 'CGPA',
      value: profile?.cgpa != null ? `${profile.cgpa} / 10  (${(profile.cgpa * 9.5).toFixed(1)}%)` : null,
      icon: GraduationCap,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      id: 'englishTest',
      label: 'English Test',
      value: profile?.englishTest
        ? profile.englishScore
          ? `${profile.englishTest} – ${profile.englishScore}`
          : profile.englishTest
        : null,
      icon: Languages,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50',
    },
    {
      id: 'budgetInr',
      label: 'Budget (INR)',
      value: profile?.budgetInr ? `₹${profile.budgetInr}` : null,
      icon: Wallet,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      id: 'country',
      label: 'Target Country',
      value: profile?.country ?? null,
      icon: Globe2,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      id: 'field',
      label: 'Field of Study',
      value: profile?.field ?? null,
      icon: BookOpen,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
    {
      id: 'intake',
      label: 'Preferred Intake',
      value: profile?.intake ?? null,
      icon: CalendarDays,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
    },
  ];

  const completedCount = items.filter(i => i.value !== null).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <div className="w-full h-full p-6 flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Student Profile</h2>
            <p className="text-muted-foreground mt-0.5 text-sm">Your application criteria</p>
          </div>
          {onEditProfile && (
            <button
              onClick={onEditProfile}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              {profile ? 'Edit' : 'Setup'}
            </button>
          )}
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-muted-foreground">Profile Completion</span>
            <span className="text-primary font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-blue-500 to-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {items.map((item, i) => {
          const isComplete = item.value !== null;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`
                p-3.5 rounded-2xl border transition-all duration-300
                ${isComplete
                  ? 'bg-white border-primary/20 shadow-md shadow-primary/5'
                  : 'bg-slate-50/50 border-border/50 border-dashed'}
              `}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isComplete ? item.bg : 'bg-slate-100'}`}>
                  <Icon className={`w-4.5 h-4.5 ${isComplete ? item.color : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <p className={`font-semibold text-sm truncate ${isComplete ? 'text-foreground' : 'text-slate-400'}`}>
                    {isComplete ? item.value : 'Not provided yet'}
                  </p>
                </div>
                {isComplete ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                  </motion.div>
                ) : (
                  <CircleDashed className="w-4.5 h-4.5 text-slate-300 flex-shrink-0" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
