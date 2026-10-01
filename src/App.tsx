/**
 * FitBuddy - Complete AI-Powered Fitness, Workout & Nutrition Companion
 * Powered by Google Gemini 3.8 Flash, Express API, and SQLite/JSON storage
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Dumbbell,
  Flame,
  Sparkles,
  RefreshCw,
  User as UserIcon,
  Activity,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Send,
  Download,
  Code2,
  Play,
  Trash2,
  Apple,
  AlertCircle,
  Database,
  ArrowRight,
  TrendingUp,
  Award,
  MessageSquare,
  Timer,
  CheckCircle2,
  Shuffle,
  ShieldAlert,
  Heart,
  Calendar,
  Scale,
  Plus,
  Clock,
  Volume2,
} from 'lucide-react';

interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  difficulty: string;
  targetMuscles: string;
  notes?: string;
  alternatives?: string[];
}

interface StructuredWorkoutDay {
  dayNumber: number;
  title: string;
  focus: string;
  isRestDay: boolean;
  durationMinutes: number;
  warmup: {
    duration: string;
    exercises: string[];
  };
  exercises: ExerciseItem[];
  cooldown: {
    duration: string;
    tips: string;
  };
}

interface MealItem {
  name: string;
  timing: string;
  suggestion: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

interface NutritionPlan {
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  waterLiters: number;
  generalAdvice: string;
  meals: MealItem[];
  supplements?: string[];
}

interface AthleteUser {
  id: number;
  name: string;
  age: number;
  weight: number;
  height?: number;
  gender?: string;
  goal: string;
  intensity: string;
  fitnessLevel?: string;
  equipment?: string[];
  workoutPreferences?: string[];
  injuries?: string;
  schedule?: number;
  original_plan?: string;
  updated_plan?: string;
  nutrition_tip?: string;
  feedback?: string | null;
  structuredDays?: StructuredWorkoutDay[];
  nutritionPlan?: NutritionPlan;
  createdAt?: string;
}

interface WorkoutHistoryEntry {
  id: string;
  userId: number;
  dayNumber: number;
  dayTitle: string;
  completedAt: string;
  durationMinutes: number;
  rpe: number;
  difficultyRating: string;
  notes?: string;
  completedExercises: string[];
}

interface ProgressEntry {
  id: string;
  userId: number;
  date: string;
  weight: number;
  waistCm?: number;
  chestCm?: number;
  notes?: string;
}

interface ChatMessage {
  id: string;
  userId: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

type TabKey = 'dashboard' | 'generator' | 'nutrition' | 'chat' | 'progress' | 'admin' | 'api-docs';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // Active athlete state
  const [allAthletes, setAllAthletes] = useState<AthleteUser[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<number>(101);
  const currentAthlete = allAthletes.find((a) => a.id === selectedAthleteId) || allAthletes[0] || null;

  // Form states for profile/generator
  const [formUserId, setFormUserId] = useState<number>(103);
  const [formName, setFormName] = useState<string>('Jordan Reed');
  const [formAge, setFormAge] = useState<number>(27);
  const [formWeight, setFormWeight] = useState<number>(76.5);
  const [formHeight, setFormHeight] = useState<number>(178);
  const [formGender, setFormGender] = useState<string>('male');
  const [formGoal, setFormGoal] = useState<string>('muscle gain');
  const [formIntensity, setFormIntensity] = useState<string>('high');
  const [formFitnessLevel, setFormFitnessLevel] = useState<string>('intermediate');
  const [formEquipment, setFormEquipment] = useState<string[]>(['dumbbells', 'barbell', 'bench', 'cables']);
  const [formPreferences, setFormPreferences] = useState<string[]>(['hypertrophy', 'strength']);
  const [formInjuries, setFormInjuries] = useState<string>('');

  // Dashboard day selector & completed exercises checklist
  const [activeDayNumber, setActiveDayNumber] = useState<number>(1);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});

  // Rest Timer State
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [timerTotal, setTimerTotal] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Exercise Alternatives Modal
  const [alternativeModalExercise, setAlternativeModalExercise] = useState<ExerciseItem | null>(null);
  const [alternativesList, setAlternativesList] = useState<{ name: string; equipment: string; reason: string }[]>([]);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState<boolean>(false);

  // Workout Completion Modal
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState<boolean>(false);
  const [completeDuration, setCompleteDuration] = useState<number>(50);
  const [completeRpe, setCompleteRpe] = useState<number>(8);
  const [completeDifficulty, setCompleteDifficulty] = useState<string>('just_right');
  const [completeNotes, setCompleteNotes] = useState<string>('');

  // Plan feedback revision state
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [isUpdatingPlan, setIsUpdatingPlan] = useState<boolean>(false);

  // AI Fitness Chatbot state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isCoachTyping, setIsCoachTyping] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Progress tracking & workout history
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressEntry[]>([]);
  const [newLogWeight, setNewLogWeight] = useState<number>(76.0);
  const [newLogWaist, setNewLogWaist] = useState<number>(84);
  const [newLogChest, setNewLogChest] = useState<number>(105);
  const [newLogNotes, setNewLogNotes] = useState<string>('');
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);

  // Admin and API testing states
  const [adminSearch, setAdminSearch] = useState<string>('');
  const [apiEndpoint, setApiEndpoint] = useState<string>('generate-plan');
  const [apiPayload, setApiPayload] = useState<string>('');
  const [apiResponse, setApiResponse] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<number | null>(null);
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [isExecutingApi, setIsExecutingApi] = useState<boolean>(false);

  // Loading & Global Notifications
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    fetchAthletes();
  }, []);

  // When selected athlete changes, load their history, progress, and chat
  useEffect(() => {
    if (selectedAthleteId) {
      loadAthleteData(selectedAthleteId);
    }
  }, [selectedAthleteId]);

  // Rest Timer Interval
  useEffect(() => {
    if (isTimerRunning && timerSecondsLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimerSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerSecondsLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      showNotification('Rest timer finished! Time for your next set.', 'info');
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isTimerRunning, timerSecondsLeft]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isCoachTyping]);

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusNotification({ type, text });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchAthletes = async () => {
    try {
      const res = await fetch('/api/view-all-users');
      if (res.ok) {
        const data = await res.json();
        setAllAthletes(data);
        if (data.length > 0 && !data.some((a: AthleteUser) => a.id === selectedAthleteId)) {
          setSelectedAthleteId(data[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch athletes:', err);
    }
  };

  const loadAthleteData = async (userId: number) => {
    try {
      const [histRes, progRes, chatRes] = await Promise.all([
        fetch(`/api/workout/history/${userId}`),
        fetch(`/api/progress/${userId}`),
        fetch(`/api/chat/history/${userId}`),
      ]);

      if (histRes.ok) setWorkoutHistory(await histRes.json());
      if (progRes.ok) setProgressLogs(await progRes.json());
      if (chatRes.ok) setChatMessages(await chatRes.json());
    } catch (err) {
      console.warn('Error loading athlete data:', err);
    }
  };

  // Start Rest Timer
  const startRestTimer = (seconds: number) => {
    setTimerTotal(seconds);
    setTimerSecondsLeft(seconds);
    setIsTimerRunning(true);
    showNotification(`Rest timer started: ${seconds} seconds`, 'info');
  };

  // Fetch alternatives for exercise
  const openAlternativesModal = async (exercise: ExerciseItem) => {
    setAlternativeModalExercise(exercise);
    setAlternativesList([]);
    setIsLoadingAlternatives(true);

    try {
      const res = await fetch('/api/exercise/alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseName: exercise.name,
          equipment: currentAthlete?.equipment || [],
          reason: 'Looking for alternative or variation with available equipment',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAlternativesList(data.alternatives || []);
      }
    } catch (err) {
      console.warn('Failed to load alternatives:', err);
    } finally {
      setIsLoadingAlternatives(false);
    }
  };

  // Replace exercise with alternative in active day
  const handleSwapExercise = (altName: string) => {
    if (!alternativeModalExercise || !currentAthlete?.structuredDays) return;
    const days = [...currentAthlete.structuredDays];
    const day = days.find((d) => d.dayNumber === activeDayNumber);
    if (day) {
      const exIndex = day.exercises.findIndex((e) => e.id === alternativeModalExercise.id);
      if (exIndex >= 0) {
        day.exercises[exIndex].name = altName;
        showNotification(`Swapped to ${altName}`);
      }
    }
    setAlternativeModalExercise(null);
  };

  // Log completed workout session
  const handleCompleteWorkout = async () => {
    if (!currentAthlete) return;
    const currentDay = currentAthlete.structuredDays?.find((d) => d.dayNumber === activeDayNumber);

    try {
      const completedList = Object.keys(completedExercises).filter((k) => completedExercises[k]);
      const res = await fetch('/api/workout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentAthlete.id,
          dayNumber: activeDayNumber,
          dayTitle: currentDay?.title || `Day ${activeDayNumber}`,
          durationMinutes: completeDuration,
          rpe: completeRpe,
          difficultyRating: completeDifficulty,
          notes: completeNotes,
          completedExercises: completedList,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showNotification(data.calibrationNote || 'Workout session logged to history!');
        setIsCompleteModalOpen(false);
        setCompleteNotes('');
        setCompletedExercises({});
        loadAthleteData(currentAthlete.id);
        fetchAthletes();
      }
    } catch (err) {
      showNotification('Error logging workout', 'error');
    }
  };

  // Log weight / body measurements
  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAthlete) return;

    try {
      const res = await fetch('/api/progress/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentAthlete.id,
          date: new Date().toISOString().split('T')[0],
          weight: newLogWeight,
          waistCm: newLogWaist || undefined,
          chestCm: newLogChest || undefined,
          notes: newLogNotes,
        }),
      });

      if (res.ok) {
        showNotification('Body progress recorded successfully!');
        setIsLogModalOpen(false);
        setNewLogNotes('');
        loadAthleteData(currentAthlete.id);
        fetchAthletes();
      }
    } catch (err) {
      showNotification('Error recording progress', 'error');
    }
  };

  // Send message to AI Fitness Coach
  const handleSendMessage = async (e?: React.FormEvent, presetPrompt?: string) => {
    if (e) e.preventDefault();
    const query = presetPrompt || chatInput;
    if (!query.trim() || !currentAthlete) return;

    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      userId: currentAthlete.id,
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsCoachTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentAthlete.id,
          message: query.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const coachMsg: ChatMessage = {
          id: data.messageId || `coach-${Date.now()}`,
          userId: currentAthlete.id,
          role: 'assistant',
          content: data.reply,
          timestamp: data.timestamp || new Date().toISOString(),
        };
        setChatMessages((prev) => [...prev, coachMsg]);
      } else {
        throw new Error('Chat response error');
      }
    } catch (err) {
      showNotification('Coach connection error', 'error');
    } finally {
      setIsCoachTyping(false);
    }
  };

  // Generate Plan from Profile Form
  const handleGeneratePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingPlan(true);
    showNotification('Gemini is generating your personalized 7-day plan & nutrition...', 'info');

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: formUserId,
          username: formName,
          age: formAge,
          weight: formWeight,
          height: formHeight,
          gender: formGender,
          goal: formGoal,
          intensity: formIntensity,
          fitnessLevel: formFitnessLevel,
          equipment: formEquipment,
          workoutPreferences: formPreferences,
          injuries: formInjuries,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate plan');

      showNotification('Plan created! Navigating to your Dashboard.');
      await fetchAthletes();
      setSelectedAthleteId(formUserId);
      setActiveTab('dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Generation error: ${msg}`, 'error');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Dynamic feedback update
  const handleUpdateFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackInput.trim() || !currentAthlete) return;

    setIsUpdatingPlan(true);
    showNotification('Recalibrating 7-day schedule with Gemini...', 'info');

    try {
      const res = await fetch(`/api/update-plan/${currentAthlete.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentAthlete.id,
          feedback: feedbackInput.trim(),
        }),
      });

      if (res.ok) {
        showNotification('Plan successfully updated with your feedback!');
        setFeedbackInput('');
        fetchAthletes();
      }
    } catch (err) {
      showNotification('Update error', 'error');
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  // Admin delete
  const handleDeleteAthlete = async (id: number) => {
    if (!confirm(`Delete athlete #${id}?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification(`Athlete #${id} deleted.`);
        fetchAthletes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Active workout day from structured plan
  const activeDay = currentAthlete?.structuredDays?.find((d) => d.dayNumber === activeDayNumber) || currentAthlete?.structuredDays?.[0];

  // Helper macro calculations
  const currentWeight = currentAthlete?.weight || 75;
  const currentHeight = currentAthlete?.height || 175;
  const bmi = (currentWeight / Math.pow(currentHeight / 100, 2)).toFixed(1);
  const bmr = Math.round(10 * currentWeight + 6.25 * currentHeight - 5 * (currentAthlete?.age || 28) + 5);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Graphic Asset */}
      <div
        className="fixed inset-0 pointer-events-none opacity-15 bg-cover bg-center mix-blend-screen"
        style={{ backgroundImage: `url('/static/images/gym-bg.jpg')` }}
      />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-[#070b14]/80 via-[#070b14]/95 to-[#070b14]" />

      {/* Floating Global Status Notification */}
      {statusNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-top duration-200">
          <div
            className={`px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 backdrop-blur-xl ${
              statusNotification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : statusNotification.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-cyan-950/90 border-cyan-500/40 text-cyan-200'
            }`}
          >
            {statusNotification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {statusNotification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {statusNotification.type === 'info' && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />}
            <span className="text-xs font-semibold">{statusNotification.text}</span>
          </div>
        </div>
      )}

      {/* Top Header & Athlete Quick Selector */}
      <header className="relative z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 lg:px-8 py-3 sticky top-0 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
              <Dumbbell className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                  FitBuddy
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Gemini 3.8 AI
                </span>
              </div>
              <p className="text-xs text-slate-400">Intelligent Workout, Nutrition &amp; Fitness Companion</p>
            </div>
          </div>

          {/* Active Athlete Quick Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
              <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs text-slate-400 hidden sm:inline">Active Athlete:</span>
              <select
                value={selectedAthleteId}
                onChange={(e) => setSelectedAthleteId(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                {allAthletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id} className="bg-slate-900 text-white">
                    #{athlete.id} {athlete.name} ({athlete.goal})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Rest Timer Widget */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
              <Timer className={`w-3.5 h-3.5 ${isTimerRunning ? 'text-amber-400 animate-spin' : 'text-slate-400'}`} />
              <span className="text-xs font-mono font-bold text-white">
                {isTimerRunning ? `${timerSecondsLeft}s` : 'Rest Timer'}
              </span>
              <div className="flex items-center gap-1 ml-1">
                {[60, 90].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => startRestTimer(s)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {s}s
                  </button>
                ))}
                {isTimerRunning && (
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(false)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30"
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'dashboard', label: "Today's Plan", icon: Activity },
            { id: 'generator', label: 'Workout Generator', icon: Sparkles },
            { id: 'chat', label: 'Ask FitCoach AI', icon: MessageSquare, badge: 'New' },
            { id: 'nutrition', label: 'Diet & Nutrition', icon: Apple },
            { id: 'progress', label: 'Progress & Logs', icon: TrendingUp },
            { id: 'admin', label: 'All Users & Plans', icon: Database, count: allAthletes.length },
            { id: 'api-docs', label: 'API Tester', icon: Play },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabKey)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent hover:border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-cyan-400 text-slate-950 font-extrabold">
                    {tab.badge}
                  </span>
                )}
                {tab.count !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Safety & Personalization Medical Disclaimer Ribbon */}
      <div className="relative z-20 bg-amber-950/40 border-b border-amber-500/20 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs text-amber-200/90">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Safety &amp; Personalization Notice:</strong> FitBuddy AI provides exercise and nutritional suggestions for informational training purposes. Consult a physician or physical therapist before starting high-intensity programs or if you have pre-existing cardiovascular, musculoskeletal, or metabolic conditions.
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* ========================================================================= */}
        {/* TAB 1: DASHBOARD (TODAY'S WORKOUT & WEEKLY PLANNER) */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && currentAthlete && (
          <div className="space-y-6">
            {/* Athlete Header Profile Bar */}
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xl font-black">
                  #{currentAthlete.id}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-white">{currentAthlete.name}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {currentAthlete.fitnessLevel || 'Intermediate'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>{currentAthlete.age} yrs</span>
                    <span>•</span>
                    <span>{currentAthlete.weight} kg</span>
                    {currentAthlete.height && (
                      <>
                        <span>•</span>
                        <span>{currentAthlete.height} cm (BMI: {bmi})</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="capitalize text-emerald-400 font-semibold">{currentAthlete.goal}</span>
                    <span>•</span>
                    <span className="capitalize font-semibold text-amber-300">{currentAthlete.intensity} Intensity</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCompleteModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Log Workout Complete</span>
                </button>
                <button
                  onClick={() => setActiveTab('generator')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Weekly Day Selector Navigation (Days 1–7) */}
            <div className="grid grid-cols-7 gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto">
              {(currentAthlete.structuredDays || []).map((day) => {
                const isSelected = activeDayNumber === day.dayNumber;
                return (
                  <button
                    key={day.dayNumber}
                    onClick={() => setActiveDayNumber(day.dayNumber)}
                    className={`py-3 px-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-500/20 to-blue-600/30 border-cyan-400 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Day {day.dayNumber}</div>
                    <div className="text-xs font-extrabold truncate mt-0.5">{day.isRestDay ? 'Rest / Walk' : day.title.split(' ')[0]}</div>
                    <div className="text-[9px] text-cyan-400 font-mono mt-0.5">{day.durationMinutes}m</div>
                  </button>
                );
              })}
            </div>

            {/* Active Day Detail Card */}
            {activeDay && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 8 Cols: Warm-up, Exercises & Cooldown */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Day Header Banner */}
                  <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                          Scheduled Session · Day {activeDay.dayNumber}
                        </span>
                        <h3 className="text-xl font-extrabold text-white mt-0.5">{activeDay.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">Focus: {activeDay.focus}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-mono font-bold text-slate-200 border border-slate-700">
                          ⏱️ {activeDay.durationMinutes} Minutes
                        </span>
                        {activeDay.isRestDay ? (
                          <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase">
                            Active Rest
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase">
                            Training Day
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Warm-Up Section */}
                    {activeDay.warmup && activeDay.warmup.exercises.length > 0 && (
                      <div className="mb-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-2">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          <span>Warm-Up Protocol ({activeDay.warmup.duration})</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeDay.warmup.exercises.map((w, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span>{w}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Exercise List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>Main Workout Movements</span>
                        <span className="text-[10px] text-slate-500">Click &ldquo;Swap&rdquo; for AI alternatives</span>
                      </h4>

                      {activeDay.exercises.map((ex, index) => {
                        const isDone = completedExercises[ex.id] || false;
                        return (
                          <div
                            key={ex.id || index}
                            className={`p-4 rounded-xl border transition-all ${
                              isDone
                                ? 'bg-emerald-950/30 border-emerald-500/40 opacity-75'
                                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCompletedExercises((prev) => ({
                                      ...prev,
                                      [ex.id]: !prev[ex.id],
                                    }))
                                  }
                                  className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                                    isDone
                                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                      : 'border-slate-700 bg-slate-900 text-transparent hover:border-cyan-400'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                                      {ex.name}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                      {ex.difficulty}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-400 mt-0.5">Target: {ex.targetMuscles}</p>
                                  {ex.notes && (
                                    <p className="text-[11px] text-cyan-300/80 mt-1 italic">Cue: {ex.notes}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="text-xs font-mono font-bold text-slate-200">
                                    {ex.sets} sets × {ex.reps} reps
                                  </div>
                                  <div className="text-[10px] text-slate-400">Rest: {ex.restSeconds}s</div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => openAlternativesModal(ex)}
                                  className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 text-xs font-semibold border border-cyan-500/30 flex items-center gap-1 transition-colors"
                                  title="View AI Exercise Alternatives"
                                >
                                  <Shuffle className="w-3 h-3" />
                                  <span>Swap</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Cooldown Section */}
                    {activeDay.cooldown && (
                      <div className="mt-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 mb-1.5">
                          <Heart className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Cooldown &amp; Regeneration ({activeDay.cooldown.duration})</span>
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{activeDay.cooldown.tips}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right 4 Cols: Nutrition Tip, Quick AI Chat & Dynamic Adjustment */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Goal-Specific Nutrition Tip (Gemini Flash) */}
                  <div className="bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6 shadow-xl ring-1 ring-emerald-500/20">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <Apple className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          Nutrition &amp; Recovery Tip
                        </h4>
                        <span className="text-[10px] text-slate-400">Powered by Gemini Flash</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">
                      {currentAthlete.nutrition_tip || 'Consume adequate protein within 90 minutes post-training and maintain 3+ liters of water daily.'}
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">View Full Meal Blueprint</span>
                      <button
                        onClick={() => setActiveTab('nutrition')}
                        className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Ask FitCoach Mini Card */}
                  <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Ask FitCoach AI</h4>
                        <span className="text-[10px] text-slate-400">Instant answers to any fitness query</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      {[
                        'What can I do instead of squats?',
                        'How should I train if I feel sore today?',
                        'Can you swap pull-ups for dumbbell rows?',
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => {
                            setActiveTab('chat');
                            handleSendMessage(undefined, prompt);
                          }}
                          className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors"
                        >
                          &ldquo;{prompt}&rdquo;
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setActiveTab('chat')}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Open Full Fitness Chat</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dynamic Plan Adjustment Form */}
                  <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Dynamic Plan Revision</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Need adjustments (e.g. &ldquo;Add yoga on Day 3&rdquo;, &ldquo;Low impact for knees&rdquo;)?
                    </p>

                    <form onSubmit={handleUpdateFeedbackSubmit} className="space-y-3">
                      <textarea
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="e.g. Add 15 mins of yoga on Day 3, substitute bench press with dumbbells"
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                      />
                      <button
                        type="submit"
                        disabled={isUpdatingPlan || !feedbackInput.trim()}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isUpdatingPlan ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Recalibrating...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Revise Plan with Gemini</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: COMPREHENSIVE WORKOUT GENERATOR & PROFILE SETUP */}
        {/* ========================================================================= */}
        {activeTab === 'generator' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="border-b border-slate-800 pb-5 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Personalized Fitness Engine</span>
                <h2 className="text-2xl font-black text-white mt-1">Configure Athlete Profile &amp; Generate Plan</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Gemini models synthesize your fitness level, goals, equipment, and injury limitations to generate a structured 7-day schedule with sets, reps, rest periods, and nutrition.
                </p>
              </div>

              <form onSubmit={handleGeneratePlanSubmit} className="space-y-6">
                {/* User ID, Name, Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      User ID <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={formUserId}
                      onChange={(e) => setFormUserId(Number(e.target.value))}
                      required
                      min="1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Athlete Full Name <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      placeholder="e.g. Jordan Reed"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Gender
                    </label>
                    <select
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Non-binary / Other</option>
                    </select>
                  </div>
                </div>

                {/* Age, Weight, Height, Fitness Level */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Age
                    </label>
                    <input
                      type="number"
                      value={formAge}
                      onChange={(e) => setFormAge(Number(e.target.value))}
                      min="12"
                      max="99"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formWeight}
                      onChange={(e) => setFormWeight(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={formHeight}
                      onChange={(e) => setFormHeight(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Experience Level
                    </label>
                    <select
                      value={formFitnessLevel}
                      onChange={(e) => setFormFitnessLevel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="elite">Elite Athlete</option>
                    </select>
                  </div>
                </div>

                {/* Primary Goals */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Primary Fitness Goal
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { id: 'muscle gain', label: 'Muscle Gain', icon: '🏋️‍♂️' },
                      { id: 'weight loss', label: 'Weight Loss', icon: '🔥' },
                      { id: 'strength', label: 'Max Strength', icon: '⚡' },
                      { id: 'endurance', label: 'Endurance', icon: '🏃' },
                      { id: 'general fitness', label: 'Tone & Health', icon: '✨' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setFormGoal(g.id)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          formGoal === g.id
                            ? 'bg-cyan-500/15 border-cyan-400 text-white font-bold ring-1 ring-cyan-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-xl mb-1">{g.icon}</div>
                        <div className="text-xs font-bold">{g.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Training Intensity */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Intensity Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'low', label: 'Low Intensity', desc: 'Active flow & gentle adaptation' },
                      { id: 'medium', label: 'Medium Intensity', desc: 'Standard progressive overload' },
                      { id: 'high', label: 'High Intensity', desc: 'Max effort, high volume & density' },
                    ].map((i) => (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => setFormIntensity(i.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          formIntensity === i.id
                            ? 'bg-gradient-to-br from-cyan-500/15 to-blue-600/15 border-cyan-400 text-white ring-1 ring-cyan-500/40'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-xs font-extrabold uppercase">{i.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{i.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Available Equipment Multi-Select Chips */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Available Equipment (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'bodyweight', label: 'Bodyweight Only' },
                      { id: 'dumbbells', label: 'Dumbbells' },
                      { id: 'barbell', label: 'Barbell & Plates' },
                      { id: 'bench', label: 'Adjustable Bench' },
                      { id: 'cables', label: 'Cable Machine' },
                      { id: 'kettlebell', label: 'Kettlebells' },
                      { id: 'resistance_bands', label: 'Resistance Bands' },
                      { id: 'pull_up_bar', label: 'Pull-Up Bar' },
                    ].map((eq) => {
                      const selected = formEquipment.includes(eq.id);
                      return (
                        <button
                          key={eq.id}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              setFormEquipment(formEquipment.filter((x) => x !== eq.id));
                            } else {
                              setFormEquipment([...formEquipment, eq.id]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                            selected
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-500/30'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {selected ? '✓ ' : '+ '}
                          {eq.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Physical Limitations / Injuries */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Injuries / Physical Limitations (Optional)
                  </label>
                  <input
                    type="text"
                    value={formInjuries}
                    onChange={(e) => setFormInjuries(e.target.value)}
                    placeholder="e.g. Mild lower-back strain, avoid heavy barbell back squats"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isGeneratingPlan}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-2xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {isGeneratingPlan ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Plan with Gemini 3.8 Flash...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate 7-Day Fitness Plan &amp; Nutrition Blueprint</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: AI FITNESS CHATBOT ("Ask FitCoach") */}
        {/* ========================================================================= */}
        {activeTab === 'chat' && currentAthlete && (
          <div className="max-w-4xl mx-auto h-[720px] flex flex-col bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-cyan-500/20">
                  FC
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>FitCoach AI</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-xs text-slate-400">
                    Coaching athlete #{currentAthlete.id} {currentAthlete.name} ({currentAthlete.goal})
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1">
                Context: {currentAthlete.equipment?.join(', ') || 'Standard gym'}
              </div>
            </div>

            {/* Quick Questions Chips */}
            <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
              <span className="text-slate-500 shrink-0 font-semibold">Suggested:</span>
              {[
                'What can I do instead of squats?',
                'How should I train if I feel sore today?',
                'How much protein do I need after workouts?',
                'What is the best warm-up for deadlifts?',
                'Can I train abs every day?',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSendMessage(undefined, q)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white whitespace-nowrap transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat Messages Feed */}
            <div ref={chatScrollRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-30 text-cyan-400" />
                  <h4 className="text-sm font-bold text-slate-300">Welcome to FitCoach AI!</h4>
                  <p className="text-xs max-w-sm mt-1 text-slate-400">
                    Ask questions about exercise substitutions, soreness, nutrition timing, or how to execute your workout today.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isUser
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950'
                        }`}
                      >
                        {isUser ? 'You' : 'FC'}
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isUser
                            ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30'
                            : 'bg-slate-950/80 text-slate-200 border border-slate-800'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  );
                })
              )}

              {isCoachTyping && (
                <div className="flex gap-3 max-w-[80%] mr-auto items-center text-xs text-slate-400">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-cyan-400">
                    FC
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={(e) => handleSendMessage(e)} className="p-4 border-t border-slate-800 bg-slate-950/80 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask FitCoach anything (e.g. 'Can I replace bench press with dips?')..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isCoachTyping}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: DIET & NUTRITION SUGGESTIONS */}
        {/* ========================================================================= */}
        {activeTab === 'nutrition' && currentAthlete && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Daily Macros Banner */}
            {currentAthlete.nutritionPlan ? (
              <>
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Nutritional Blueprint</span>
                      <h3 className="text-xl font-extrabold text-white mt-0.5">Calculated Targets for {currentAthlete.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Goal: {currentAthlete.goal} · Bodyweight: {currentAthlete.weight}kg</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Daily Calorie Target</span>
                      <div className="text-2xl font-black text-emerald-300">{currentAthlete.nutritionPlan.dailyCalories} kcal</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Protein</span>
                      <div className="text-xl font-black text-cyan-300 mt-0.5">{currentAthlete.nutritionPlan.proteinGrams}g</div>
                      <span className="text-[10px] text-slate-500">{(currentAthlete.nutritionPlan.proteinGrams / currentAthlete.weight).toFixed(1)}g / kg</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Carbohydrates</span>
                      <div className="text-xl font-black text-amber-300 mt-0.5">{currentAthlete.nutritionPlan.carbsGrams}g</div>
                      <span className="text-[10px] text-slate-500">Complex Energy</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Healthy Fats</span>
                      <div className="text-xl font-black text-rose-300 mt-0.5">{currentAthlete.nutritionPlan.fatsGrams}g</div>
                      <span className="text-[10px] text-slate-500">Hormone Health</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Daily Water</span>
                      <div className="text-xl font-black text-blue-300 mt-0.5">{currentAthlete.nutritionPlan.waterLiters}L</div>
                      <span className="text-[10px] text-slate-500">Optimal Hydration</span>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
                    💡 <strong>Strategy:</strong> {currentAthlete.nutritionPlan.generalAdvice}
                  </p>
                </div>

                {/* Day-Wise Meal Plan Suggestions */}
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Apple className="w-4 h-4 text-emerald-400" />
                    <span>Targeted Meal Timing &amp; Whole Food Ideas</span>
                  </h4>

                  <div className="space-y-3">
                    {currentAthlete.nutritionPlan.meals.map((meal, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-bold text-white">{meal.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">({meal.timing})</span>
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            <span className="font-bold text-emerald-300">{meal.calories} kcal</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-cyan-300 font-semibold">{meal.proteinG}g Protein</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-amber-300 font-semibold">{meal.carbsG}g Carbs</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed pl-8">{meal.suggestion}</p>
                      </div>
                    ))}
                  </div>

                  {/* Supplements Card */}
                  {currentAthlete.nutritionPlan.supplements && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Evidence-Based Supplement Recommendations:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {currentAthlete.nutritionPlan.supplements.map((s, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
                <Apple className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-400" />
                <p className="text-sm font-medium">No nutrition plan generated yet for this athlete.</p>
                <button
                  onClick={() => setActiveTab('generator')}
                  className="mt-3 px-4 py-2 rounded-xl bg-cyan-950 text-cyan-300 text-xs font-bold border border-cyan-500/30"
                >
                  Generate Plan Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: PROGRESS & BODY MEASUREMENT TRACKING */}
        {/* ========================================================================= */}
        {activeTab === 'progress' && currentAthlete && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Progress Tracker</span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">Body Metrics &amp; Workout History</h3>
                <p className="text-xs text-slate-400">Monitor changes in body weight, workout RPE, and completed sessions over time.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLogModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Log Weight &amp; Metrics</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500">Current Weight</span>
                <div className="text-2xl font-black text-cyan-300 mt-1">{currentAthlete.weight} kg</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500">Total Workouts Done</span>
                <div className="text-2xl font-black text-emerald-300 mt-1">{workoutHistory.length}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500">Avg Session RPE</span>
                <div className="text-2xl font-black text-amber-300 mt-1">
                  {workoutHistory.length > 0
                    ? (workoutHistory.reduce((a, b) => a + b.rpe, 0) / workoutHistory.length).toFixed(1)
                    : 'N/A'}{' '}
                  <span className="text-xs font-normal text-slate-400">/ 10</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500">Total Training Time</span>
                <div className="text-2xl font-black text-purple-300 mt-1">
                  {workoutHistory.reduce((a, b) => a + b.durationMinutes, 0)} <span className="text-xs font-normal text-slate-400">mins</span>
                </div>
              </div>
            </div>

            {/* Weight Trend Chart Visualizer */}
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center justify-between">
                <span>Weight Progression History (kg)</span>
                <span className="text-[10px] text-slate-500">{progressLogs.length} Entries Recorded</span>
              </h4>

              {progressLogs.length > 1 ? (
                <div className="h-44 flex items-end gap-3 pt-6 pb-2 border-b border-slate-800">
                  {progressLogs.map((log, index) => {
                    const minW = Math.min(...progressLogs.map((l) => l.weight)) - 1;
                    const maxW = Math.max(...progressLogs.map((l) => l.weight)) + 1;
                    const heightPercent = Math.max(15, Math.min(100, ((log.weight - minW) / (maxW - minW || 1)) * 100));

                    return (
                      <div key={log.id || index} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                        {/* Hover Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-cyan-300 pointer-events-none whitespace-nowrap z-20">
                          {log.weight} kg ({log.date})
                        </div>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[36px] bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-lg shadow-lg shadow-cyan-500/10 group-hover:brightness-125 transition-all"
                        />
                        <span className="text-[9px] text-slate-400 font-mono truncate">{log.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Log at least 2 weigh-ins to render the progress trend chart.
                </div>
              )}
            </div>

            {/* Workout History Table */}
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
                Completed Session Logbook
              </h4>

              {workoutHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Session</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Intensity (RPE)</th>
                        <th className="py-2.5 px-3">Difficulty</th>
                        <th className="py-2.5 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {workoutHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3 font-mono text-slate-400">{item.completedAt.split('T')[0]}</td>
                          <td className="py-3 px-3 font-bold text-white">{item.dayTitle}</td>
                          <td className="py-3 px-3 text-slate-300">{item.durationMinutes} mins</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
                              RPE {item.rpe}/10
                            </span>
                          </td>
                          <td className="py-3 px-3 capitalize text-slate-300">
                            {item.difficultyRating.replace('_', ' ')}
                          </td>
                          <td className="py-3 px-3 text-slate-400 italic">{item.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">No completed workouts logged yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: ADMIN DASHBOARD (/view-all-users) */}
        {/* ========================================================================= */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Database Registry</span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">Registered Athletes &amp; Plans Directory</h3>
                <p className="text-xs text-slate-400">View stored original and updated plans for all users across the SQLite/JSON database.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchAthletes}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                >
                  Refresh
                </button>
                <button
                  onClick={() => {
                    setFormUserId(allAthletes.length > 0 ? Math.max(...allAthletes.map((a) => a.id)) + 1 : 101);
                    setActiveTab('generator');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
                >
                  + Add Athlete
                </button>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Search athlete by name, goal, or ID..."
                className="w-full bg-transparent px-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/70 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">User ID</th>
                      <th className="py-3 px-4">Athlete Name</th>
                      <th className="py-3 px-4">Age / Weight / Height</th>
                      <th className="py-3 px-4">Goal</th>
                      <th className="py-3 px-4">Intensity</th>
                      <th className="py-3 px-4">Original Plan</th>
                      <th className="py-3 px-4">Revised Plan</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {allAthletes
                      .filter(
                        (a) =>
                          a.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
                          a.goal.toLowerCase().includes(adminSearch.toLowerCase()) ||
                          String(a.id).includes(adminSearch)
                      )
                      .map((athlete) => (
                        <tr key={athlete.id} className="hover:bg-slate-800/30">
                          <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">#{athlete.id}</td>
                          <td className="py-3.5 px-4 font-semibold text-white">{athlete.name}</td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {athlete.age} yrs · {athlete.weight} kg {athlete.height ? `· ${athlete.height} cm` : ''}
                          </td>
                          <td className="py-3.5 px-4 capitalize">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                              {athlete.goal}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                athlete.intensity?.toLowerCase() === 'high'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {athlete.intensity}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <details className="cursor-pointer">
                              <summary className="text-cyan-400 hover:text-cyan-300 font-semibold">View Baseline</summary>
                              <pre className="mt-2 bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-[10px] font-mono text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                                {athlete.original_plan}
                              </pre>
                            </details>
                          </td>
                          <td className="py-3.5 px-4">
                            {athlete.updated_plan && athlete.updated_plan !== 'Not updated' ? (
                              <details className="cursor-pointer">
                                <summary className="text-emerald-400 hover:text-emerald-300 font-semibold">View Revised</summary>
                                <pre className="mt-2 bg-slate-950 border border-emerald-500/30 p-2.5 rounded-lg text-[10px] font-mono text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                                  {athlete.updated_plan}
                                </pre>
                              </details>
                            ) : (
                              <span className="text-slate-500">Not updated</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setSelectedAthleteId(athlete.id);
                                setActiveTab('dashboard');
                              }}
                              className="px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-medium"
                            >
                              Dashboard
                            </button>
                            <button
                              onClick={() => handleDeleteAthlete(athlete.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: API TESTER */}
        {/* ========================================================================= */}
        {activeTab === 'api-docs' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-cyan-400" />
                <span>Backend REST API Interactive Console</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Execute live requests against the server to test Gemini structured output, nutrition generation, workout completion logging, and chat.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="space-y-2">
                  {[
                    { id: 'generate-plan', label: 'POST /api/generate-plan', desc: 'Create full plan & nutrition' },
                    { id: 'chat', label: 'POST /api/chat', desc: 'Ask FitCoach AI assistant' },
                    { id: 'exercise/alternatives', label: 'POST /api/exercise/alternatives', desc: 'Find exercise substitutions' },
                    { id: 'workout/complete', label: 'POST /api/workout/complete', desc: 'Log completed session with RPE' },
                    { id: 'view-all-users', label: 'GET /api/view-all-users', desc: 'Fetch all users & plans' },
                  ].map((ep) => (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => {
                        setApiEndpoint(ep.id);
                        if (ep.id === 'generate-plan') {
                          setApiPayload(JSON.stringify({ user_id: 104, username: 'Test Athlete', age: 26, weight: 70, height: 175, goal: 'weight loss', intensity: 'medium' }, null, 2));
                        } else if (ep.id === 'chat') {
                          setApiPayload(JSON.stringify({ userId: 101, message: 'What can I do instead of barbell squats?' }, null, 2));
                        } else if (ep.id === 'exercise/alternatives') {
                          setApiPayload(JSON.stringify({ exerciseName: 'Barbell Bench Press', equipment: ['dumbbells', 'resistance bands'] }, null, 2));
                        } else if (ep.id === 'workout/complete') {
                          setApiPayload(JSON.stringify({ userId: 101, dayNumber: 1, durationMinutes: 50, rpe: 8, difficultyRating: 'just_right', notes: 'Great chest pump' }, null, 2));
                        } else {
                          setApiPayload('');
                        }
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                        apiEndpoint === ep.id
                          ? 'bg-cyan-500/10 border-cyan-400 text-white font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-mono text-cyan-300 font-bold">{ep.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{ep.desc}</div>
                    </button>
                  ))}
                </div>

                {apiPayload && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Request Body (JSON)
                    </label>
                    <textarea
                      value={apiPayload}
                      onChange={(e) => setApiPayload(e.target.value)}
                      rows={6}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    setIsExecutingApi(true);
                    setApiResponse('');
                    const start = performance.now();
                    try {
                      const isPost = apiEndpoint !== 'view-all-users';
                      const res = await fetch(`/api/${apiEndpoint}`, {
                        method: isPost ? 'POST' : 'GET',
                        headers: isPost ? { 'Content-Type': 'application/json' } : undefined,
                        body: isPost ? apiPayload : undefined,
                      });
                      const json = await res.json();
                      setApiStatus(res.status);
                      setApiLatency(Math.round(performance.now() - start));
                      setApiResponse(JSON.stringify(json, null, 2));
                    } catch (err: unknown) {
                      setApiStatus(500);
                      setApiResponse(JSON.stringify({ error: String(err) }, null, 2));
                    } finally {
                      setIsExecutingApi(false);
                    }
                  }}
                  disabled={isExecutingApi}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2"
                >
                  {isExecutingApi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Execute Endpoint</span>
                </button>
              </div>

              <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 text-xs">
                  <span className="font-bold text-white uppercase tracking-wider">Live Response Payload</span>
                  <div className="flex items-center gap-2">
                    {apiStatus && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${apiStatus < 400 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                        HTTP {apiStatus}
                      </span>
                    )}
                    {apiLatency !== null && <span className="text-[10px] text-slate-400 font-mono">{apiLatency} ms</span>}
                  </div>
                </div>

                <pre className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 overflow-auto max-h-[460px]">
                  {apiResponse || '// Select an endpoint and click "Execute Endpoint"'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: EXERCISE ALTERNATIVE SWAPPER */}
      {/* ========================================================================= */}
      {alternativeModalExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400">AI Exercise Recommendations</span>
                <h4 className="text-base font-bold text-white">Substitute for: {alternativeModalExercise.name}</h4>
              </div>
              <button onClick={() => setAlternativeModalExercise(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {isLoadingAlternatives ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                <span>Finding biomechanical alternatives for your equipment...</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {alternativesList.map((alt, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{alt.name}</span>
                      <button
                        onClick={() => handleSwapExercise(alt.name)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 text-[11px] font-bold hover:bg-cyan-400 transition-colors"
                      >
                        Use This
                      </button>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono">Requires: {alt.equipment}</span>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{alt.reason}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setAlternativeModalExercise(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: COMPLETE WORKOUT LOGGING & RPE RATING */}
      {/* ========================================================================= */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="border-b border-slate-800 pb-3 mb-4">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Workout Completion</span>
              <h4 className="text-base font-bold text-white">Log Session Feedback</h4>
              <p className="text-xs text-slate-400">Your perceived exertion dynamically calibrates future workout intensity.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Total Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={completeDuration}
                  onChange={(e) => setCompleteDuration(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Rate of Perceived Exertion (RPE 1-10): {completeRpe}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={completeRpe}
                  onChange={(e) => setCompleteRpe(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>1 (Very Light)</span>
                  <span>5 (Moderate)</span>
                  <span>10 (Maximum Effort)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Difficulty Rating
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'too_easy', label: 'Too Easy' },
                    { id: 'just_right', label: 'Just Right' },
                    { id: 'too_hard', label: 'Too Hard' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setCompleteDifficulty(r.id)}
                      className={`py-2 rounded-xl border text-xs font-semibold ${
                        completeDifficulty === r.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Session Notes (Optional)
                </label>
                <textarea
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="e.g. Felt strong on bench press, slight fatigue in triceps..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteWorkout}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs"
                >
                  Save Workout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LOG WEIGH-IN / BODY MEASUREMENTS */}
      {/* ========================================================================= */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h4 className="text-base font-bold text-white mb-1">Record Weigh-In &amp; Metrics</h4>
            <p className="text-xs text-slate-400 mb-4">Track progress against your baseline over time.</p>

            <form onSubmit={handleLogProgress} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Body Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={newLogWeight}
                  onChange={(e) => setNewLogWeight(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Waist (cm)</label>
                  <input
                    type="number"
                    value={newLogWaist}
                    onChange={(e) => setNewLogWaist(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Chest (cm)</label>
                  <input
                    type="number"
                    value={newLogChest}
                    onChange={(e) => setNewLogChest(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  value={newLogNotes}
                  onChange={(e) => setNewLogNotes(e.target.value)}
                  placeholder="e.g. Morning fasted weigh-in"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-800/80 bg-slate-950/80 px-6 py-4 mt-8 text-center text-xs text-slate-500">
        <p>FitBuddy · AI-Powered Fitness, Workout &amp; Nutrition Companion · Powered by Google Gemini 3.8 Flash</p>
      </footer>
    </div>
  );
}
