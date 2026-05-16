'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Leaf, Target, Heart, Calendar, Utensils, TrendingUp, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Goal {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface Habit {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const goals: Goal[] = [
  { id: 'weight-loss',   label: 'ירידה במשקל',        icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'muscle-gain',   label: 'עלייה במסת שריר',    icon: <Target className="w-5 h-5" /> },
  { id: 'healthy-eating',label: 'תזונה בריאה',         icon: <Leaf className="w-5 h-5" /> },
  { id: 'meal-prep',     label: 'הכנת ארוחות מראש',   icon: <Utensils className="w-5 h-5" /> },
  { id: 'save-time',     label: 'חיסכון בזמן',         icon: <Calendar className="w-5 h-5" /> },
  { id: 'family-meals',  label: 'ארוחות משפחתיות',    icon: <Heart className="w-5 h-5" /> },
];

const habits: Habit[] = [
  {
    id: 'beginner',
    title: 'מתחיל/ה',
    description: 'אני חדש/ה בהכנת ארוחות מראש',
    icon: <Leaf className="w-6 h-6" />,
  },
  {
    id: 'intermediate',
    title: 'בינוני/ת',
    description: 'אני מכין/ה ארוחות מדי פעם',
    icon: <Utensils className="w-6 h-6" />,
  },
  {
    id: 'advanced',
    title: 'מתקדם/ת',
    description: 'אני מכין/ה ארוחות באופן קבוע',
    icon: <Target className="w-6 h-6" />,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const totalSteps = 6;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    if (currentStep === 1) return selectedGoals.length > 0;
    if (currentStep === 3) return selectedHabit !== '';
    if (currentStep === 5) return email !== '' && password !== '';
    return true;
  };

  const handleSubmit = () => {
    document.cookie = 'onboarding_done=1; path=/; max-age=31536000';
    router.push('/dashboard');
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 1000 : -1000, opacity: 0 }),
  };

  const springTransition = { type: 'spring' as const, stiffness: 300, damping: 30 };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F7F3EE', direction: 'rtl' }}>
      {/* Progress bar */}
      <div className="w-full px-4 py-6">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="h-2 rounded-full"
          style={{ backgroundColor: '#2A4F3A' }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={currentStep}>
            <motion.div
              key={currentStep}
              custom={currentStep}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={springTransition}
              className="w-full"
            >
              {/* ══ Step 0: Welcome ══ */}
              {currentStep === 0 && (
                <div className="text-center space-y-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' as const, stiffness: 200 }}
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full mx-auto"
                    style={{ backgroundColor: '#2A4F3A' }}
                  >
                    <Leaf className="w-12 h-12 text-white" />
                  </motion.div>
                  <div className="space-y-4">
                    <h1 className="text-4xl font-bold" style={{ color: '#2A4F3A' }}>
                      ברוכים הבאים
                    </h1>
                    <p className="text-xl text-gray-600">הכינו ארוחות בריאות ומזינות בקלות</p>
                  </div>
                </div>
              )}

              {/* ══ Step 1: Goals ══ */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold" style={{ color: '#2A4F3A' }}>מה המטרות שלך?</h2>
                    <p className="text-gray-600">בחרו אחת או יותר</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {goals.map((goal) => (
                      <motion.button
                        key={goal.id}
                        onClick={() => handleGoalToggle(goal.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={{ scale: selectedGoals.includes(goal.id) ? 1.02 : 1 }}
                        transition={springTransition}
                        className="p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all"
                        style={{
                          backgroundColor: selectedGoals.includes(goal.id) ? '#2A4F3A' : 'white',
                          borderColor: selectedGoals.includes(goal.id) ? '#2A4F3A' : '#e5e7eb',
                          color: selectedGoals.includes(goal.id) ? 'white' : '#2A4F3A',
                        }}
                      >
                        {goal.icon}
                        <span className="font-medium text-center">{goal.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ Step 2: Motivation 1 ══ */}
              {currentStep === 2 && (
                <div className="text-center space-y-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' as const, stiffness: 200 }}
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full mx-auto"
                    style={{ backgroundColor: '#C9572A' }}
                  >
                    <Heart className="w-12 h-12 text-white" />
                  </motion.div>
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold" style={{ color: '#2A4F3A' }}>מצוין!</h2>
                    <p className="text-xl text-gray-600">
                      נעזור לכם להשיג את המטרות שלכם עם תוכניות ארוחות מותאמות אישית
                    </p>
                  </div>
                </div>
              )}

              {/* ══ Step 3: Habits ══ */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold" style={{ color: '#2A4F3A' }}>מה רמת הניסיון שלך?</h2>
                    <p className="text-gray-600">בחרו אפשרות אחת</p>
                  </div>
                  <div className="space-y-4">
                    {habits.map((habit) => (
                      <motion.button
                        key={habit.id}
                        onClick={() => setSelectedHabit(habit.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={springTransition}
                        className="w-full p-6 rounded-2xl border-2 flex items-center gap-4 text-right transition-all"
                        style={{
                          backgroundColor: selectedHabit === habit.id ? '#2A4F3A' : 'white',
                          borderColor: selectedHabit === habit.id ? '#2A4F3A' : '#e5e7eb',
                          color: selectedHabit === habit.id ? 'white' : '#2A4F3A',
                        }}
                      >
                        <div
                          className="p-3 rounded-xl"
                          style={{
                            backgroundColor: selectedHabit === habit.id ? 'rgba(255,255,255,0.2)' : '#F7F3EE',
                          }}
                        >
                          {habit.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-1">{habit.title}</h3>
                          <p
                            className="text-sm"
                            style={{ color: selectedHabit === habit.id ? 'rgba(255,255,255,0.8)' : '#6b7280' }}
                          >
                            {habit.description}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ Step 4: Motivation 2 ══ */}
              {currentStep === 4 && (
                <div className="text-center space-y-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' as const, stiffness: 200 }}
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full mx-auto"
                    style={{ backgroundColor: '#C9572A' }}
                  >
                    <Target className="w-12 h-12 text-white" />
                  </motion.div>
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold" style={{ color: '#2A4F3A' }}>כמעט סיימנו!</h2>
                    <p className="text-xl text-gray-600">
                      צעד אחרון ותוכלו להתחיל ליהנות מארוחות בריאות ומזינות
                    </p>
                  </div>
                </div>
              )}

              {/* ══ Step 5: Signup ══ */}
              {currentStep === 5 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold" style={{ color: '#2A4F3A' }}>צרו חשבון</h2>
                    <p className="text-gray-600">הצטרפו אלינו והתחילו את המסע</p>
                  </div>
                  <div className="space-y-4">
                    <Button
                      onClick={() => {}}
                      className="w-full h-14 text-lg font-medium bg-white hover:bg-gray-50 border-2"
                      style={{ color: '#2A4F3A', borderColor: '#e5e7eb' }}
                    >
                      <svg className="w-6 h-6 ml-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      המשיכו עם Google
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 text-gray-500" style={{ backgroundColor: '#F7F3EE' }}>או</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="אימייל"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-14 pr-12 text-lg border-2"
                          style={{ borderColor: '#e5e7eb' }}
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="password"
                          placeholder="סיסמה"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-14 pr-12 text-lg border-2"
                          style={{ borderColor: '#e5e7eb' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="px-4 pb-8">
        <div className="max-w-2xl mx-auto flex gap-4">
          {currentStep > 0 && (
            <Button
              onClick={handleBack}
              variant="outline"
              className="h-14 px-8 text-lg font-medium border-2"
              style={{ borderColor: '#2A4F3A', color: '#2A4F3A' }}
            >
              <ChevronRight className="w-5 h-5 ml-2" />
              חזרה
            </Button>
          )}
          <Button
            onClick={currentStep === totalSteps - 1 ? handleSubmit : handleNext}
            disabled={!canProceed()}
            className="flex-1 h-14 text-lg font-medium"
            style={{
              backgroundColor: canProceed() ? '#2A4F3A' : '#d1d5db',
              color: 'white',
            }}
          >
            {currentStep === totalSteps - 1 ? 'התחילו' : 'המשיכו'}
            <ChevronLeft className="w-5 h-5 mr-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
