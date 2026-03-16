import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, Sparkles, Save } from 'lucide-react';
import type { ExtendedStudentProfile } from '@/hooks/use-profile';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: ExtendedStudentProfile) => void;
  initialProfile?: Partial<ExtendedStudentProfile>;
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all';

const labelClass = 'block text-sm font-semibold text-slate-700 mb-1.5';

export function ProfileModal({ isOpen, onClose, onSave, initialProfile }: ProfileModalProps) {
  const [cgpa, setCgpa] = useState('');
  const [englishTest, setEnglishTest] = useState('');
  const [englishScore, setEnglishScore] = useState('');
  const [budget, setBudget] = useState('');
  const [country, setCountry] = useState('');
  const [field, setField] = useState('');
  const [intake, setIntake] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialProfile) {
      if (initialProfile.cgpa !== undefined) setCgpa(String(initialProfile.cgpa));
      if (initialProfile.englishTest) setEnglishTest(initialProfile.englishTest);
      if (initialProfile.englishScore !== undefined && initialProfile.englishScore !== null)
        setEnglishScore(String(initialProfile.englishScore));
      if (initialProfile.budgetInr) setBudget(initialProfile.budgetInr);
      if (initialProfile.country) setCountry(initialProfile.country);
      if (initialProfile.field) setField(initialProfile.field);
      if (initialProfile.intake) setIntake(initialProfile.intake);
    }
  }, [initialProfile, isOpen]);

  const validate = () => {
    const e: Record<string, string> = {};
    const cgpaNum = parseFloat(cgpa);
    if (!cgpa || isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10)
      e.cgpa = 'CGPA must be between 0 and 10';
    if (!englishTest) e.englishTest = 'Please select your English test';
    if (englishTest !== 'Not Taken') {
      const scoreNum = parseFloat(englishScore);
      if (!englishScore || isNaN(scoreNum) || scoreNum <= 0)
        e.englishScore = 'Please enter a valid score';
    }
    if (!budget) e.budget = 'Please select your budget range';
    if (!country) e.country = 'Please select a preferred country';
    if (!field.trim()) e.field = 'Please enter your field of study';
    if (!intake) e.intake = 'Please select your preferred intake';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});

    const profile: ExtendedStudentProfile = {
      cgpa: parseFloat(cgpa),
      englishTest: englishTest as ExtendedStudentProfile['englishTest'],
      englishScore: englishTest !== 'Not Taken' ? parseFloat(englishScore) : null,
      budgetInr: budget as ExtendedStudentProfile['budgetInr'],
      country: country as ExtendedStudentProfile['country'],
      field,
      intake: intake as 'Fall' | 'Spring',
    };
    onSave(profile);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal Card */}
          <motion.div
            key="modal-card"
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Gradient header strip */}
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-primary to-indigo-500" />

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Student Profile</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Help us personalize your study abroad journey</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="px-6 pb-2 max-h-[60vh] overflow-y-auto space-y-4">
              {/* CGPA */}
              <div>
                <label className={labelClass}>CGPA (out of 10)</label>
                <input
                  type="number"
                  min={0} max={10} step={0.1}
                  placeholder="e.g. 7.5"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  className={inputClass}
                />
                {errors.cgpa && <p className="text-xs text-rose-500 mt-1">{errors.cgpa}</p>}
              </div>

              {/* English Test */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>English Test</label>
                  <select
                    value={englishTest}
                    onChange={(e) => setEnglishTest(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select test</option>
                    <option>IELTS</option>
                    <option>TOEFL</option>
                    <option>Duolingo</option>
                    <option>Not Taken</option>
                  </select>
                  {errors.englishTest && <p className="text-xs text-rose-500 mt-1">{errors.englishTest}</p>}
                </div>
                <div>
                  <label className={labelClass}>Test Score</label>
                  <input
                    type="number"
                    placeholder={englishTest === 'IELTS' ? 'e.g. 6.5' : englishTest === 'TOEFL' ? 'e.g. 95' : 'Score'}
                    value={englishScore}
                    onChange={(e) => setEnglishScore(e.target.value)}
                    disabled={englishTest === 'Not Taken'}
                    className={inputClass + (englishTest === 'Not Taken' ? ' opacity-40 cursor-not-allowed' : '')}
                  />
                  {errors.englishScore && <p className="text-xs text-rose-500 mt-1">{errors.englishScore}</p>}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className={labelClass}>Budget (INR)</label>
                <div className="grid grid-cols-2 gap-2">
                  {['10-20L', '20-35L', '35-50L', '50L+'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setBudget(opt)}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                        budget === opt
                          ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      ₹{opt}
                    </button>
                  ))}
                </div>
                {errors.budget && <p className="text-xs text-rose-500 mt-1">{errors.budget}</p>}
              </div>

              {/* Country */}
              <div>
                <label className={labelClass}>Preferred Country</label>
                <div className="flex flex-wrap gap-2">
                  {['Canada', 'USA', 'UK', 'Germany', 'Australia'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCountry(c)}
                      className={`py-2 px-4 rounded-xl border text-sm font-medium transition-all ${
                        country === c
                          ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                {errors.country && <p className="text-xs text-rose-500 mt-1">{errors.country}</p>}
              </div>

              {/* Field of Study */}
              <div>
                <label className={labelClass}>Field of Study</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science, MBA, Data Science"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  className={inputClass}
                />
                {errors.field && <p className="text-xs text-rose-500 mt-1">{errors.field}</p>}
              </div>

              {/* Preferred Intake */}
              <div>
                <label className={labelClass}>Preferred Intake</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Fall', 'Spring'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setIntake(opt)}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                        intake === opt
                          ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {errors.intake && <p className="text-xs text-rose-500 mt-1">{errors.intake}</p>}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 px-6 py-5 border-t border-slate-100 mt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Profile
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
