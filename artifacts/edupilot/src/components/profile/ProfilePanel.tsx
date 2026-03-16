import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  Languages, 
  Wallet, 
  Globe2, 
  CheckCircle2, 
  CircleDashed 
} from 'lucide-react';
import type { StudentProfile } from '@workspace/api-client-react';

interface ProfilePanelProps {
  profile: Partial<StudentProfile>;
}

export function ProfilePanel({ profile }: ProfilePanelProps) {
  const items = [
    { 
      id: 'cgpa', 
      label: 'CGPA', 
      value: profile.cgpa ? `${profile.cgpa} / 10` : null,
      icon: GraduationCap,
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    { 
      id: 'englishTest', 
      label: 'English Test', 
      value: profile.englishTest,
      icon: Languages,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50'
    },
    { 
      id: 'budgetInr', 
      label: 'Budget (INR)', 
      value: profile.budgetInr,
      icon: Wallet,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50'
    },
    { 
      id: 'country', 
      label: 'Target Country', 
      value: profile.country,
      icon: Globe2,
      color: 'text-purple-500',
      bg: 'bg-purple-50'
    },
  ];

  const completedCount = items.filter(i => i.value !== null).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <div className="w-full h-full p-6 flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-foreground">Student Profile</h2>
        <p className="text-muted-foreground mt-1 text-sm">Your application criteria</p>
        
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-muted-foreground">Profile Completion</span>
            <span className="text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        {items.map((item, i) => {
          const isComplete = item.value !== null;
          const Icon = item.icon;
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`
                p-4 rounded-2xl border transition-all duration-300
                ${isComplete 
                  ? 'bg-white border-primary/20 shadow-md shadow-primary/5' 
                  : 'bg-slate-50/50 border-border/50 border-dashed'}
              `}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isComplete ? item.bg : 'bg-slate-100'}`}>
                  <Icon className={`w-5 h-5 ${isComplete ? item.color : 'text-slate-400'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                  <p className={`font-semibold ${isComplete ? 'text-foreground text-lg' : 'text-slate-400'}`}>
                    {isComplete ? item.value : 'Not provided yet'}
                  </p>
                </div>
                <div>
                  {isComplete ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </motion.div>
                  ) : (
                    <CircleDashed className="w-5 h-5 text-slate-300" />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
