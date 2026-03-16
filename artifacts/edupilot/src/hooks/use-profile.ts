import { useState, useCallback } from 'react';

export interface ExtendedStudentProfile {
  cgpa: number;
  englishTest: 'IELTS' | 'TOEFL' | 'Duolingo' | 'Not Taken' | 'Not yet';
  englishScore: number | null;
  budgetInr: '10-20L' | '20-35L' | '35-50L' | '50L+';
  country: 'Canada' | 'USA' | 'UK' | 'Germany' | 'Australia';
  field: string;
  intake: 'Fall' | 'Spring';
}

const STORAGE_KEY = 'edupilot_student_profile';

function loadFromStorage(): ExtendedStudentProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ExtendedStudentProfile;
  } catch {
    return null;
  }
}

function saveToStorage(profile: ExtendedStudentProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<ExtendedStudentProfile | null>(loadFromStorage);

  const saveProfile = useCallback((p: ExtendedStudentProfile) => {
    saveToStorage(p);
    setProfile(p);
  }, []);

  const clearProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }, []);

  const hasProfile = profile !== null;

  return { profile, saveProfile, clearProfile, hasProfile };
}
