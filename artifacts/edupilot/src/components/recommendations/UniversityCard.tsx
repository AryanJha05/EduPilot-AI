import { motion } from 'framer-motion';
import { MapPin, Trophy, IndianRupee, Clock, Target } from 'lucide-react';
import type { UniversityRecommendation } from '@workspace/api-client-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UniversityCardProps {
  rec: UniversityRecommendation;
  index: number;
}

export function UniversityCard({ rec, index }: UniversityCardProps) {
  const { university, category, matchScore, admissionProbability } = rec;

  const categoryConfig = {
    Safe: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    Moderate: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    Ambitious: { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  };

  const catStyle = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.Moderate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="bg-white rounded-2xl p-5 border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold font-display text-foreground leading-tight">
            {university.name}
          </h3>
          <div className="flex items-center text-muted-foreground text-sm mt-1">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            {university.country}
          </div>
        </div>
        <span className={cn("px-3 py-1 text-xs font-semibold rounded-full border", catStyle.bg, catStyle.color, catStyle.border)}>
          {category}
        </span>
      </div>

      <div className="text-sm font-medium text-slate-700 mb-4 pb-4 border-b border-border/50">
        {university.programName}
      </div>

      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
        <div className="flex items-center text-slate-600">
          <Trophy className="w-4 h-4 mr-2 text-primary/70" />
          Rank: #{university.ranking}
        </div>
        <div className="flex items-center text-slate-600">
          <IndianRupee className="w-4 h-4 mr-2 text-primary/70" />
          {(university.tuitionEstimateInr / 100000).toFixed(1)}L INR/yr
        </div>
        <div className="flex items-center text-slate-600">
          <Target className="w-4 h-4 mr-2 text-primary/70" />
          Min CGPA: {university.minCgpa}
        </div>
        <div className="flex items-center text-slate-600">
          <Clock className="w-4 h-4 mr-2 text-primary/70" />
          {new Date(university.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Match Score</span>
          <div className="flex items-end">
            <span className="text-xl font-bold text-foreground">{matchScore}%</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground">Admission Odds</span>
          <div className="flex items-end">
            <span className="text-xl font-bold text-foreground">{admissionProbability}%</span>
          </div>
        </div>
      </div>
      
      {/* Visual Progress Bar for Probability */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
        <div 
          className={cn("h-full rounded-full", 
            admissionProbability > 75 ? "bg-emerald-500" : 
            admissionProbability > 40 ? "bg-amber-500" : "bg-rose-500"
          )}
          style={{ width: `${admissionProbability}%` }}
        />
      </div>
    </motion.div>
  );
}
