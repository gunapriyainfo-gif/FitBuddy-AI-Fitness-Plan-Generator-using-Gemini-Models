import fs from 'fs';
import path from 'path';

export interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  targetMuscles: string;
  notes?: string;
  alternatives?: string[];
}

export interface StructuredWorkoutDay {
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

export interface MealItem {
  name: string;
  timing: string;
  suggestion: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

export interface NutritionPlan {
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  waterLiters: number;
  generalAdvice: string;
  meals: MealItem[];
  supplements?: string[];
}

export interface User {
  id: number;
  name: string;
  age: number;
  weight: number; // in kg
  height?: number; // in cm
  gender?: string; // 'male' | 'female' | 'other'
  goal: string;
  intensity: string;
  fitnessLevel?: string; // 'beginner' | 'intermediate' | 'advanced'
  equipment?: string[]; // e.g. ['dumbbells', 'barbell', 'cables', 'bodyweight', 'bench']
  workoutPreferences?: string[];
  injuries?: string;
  schedule: number;
  createdAt: string;
}

export interface WorkoutPlan {
  id: number;
  userId: number;
  originalPlan: string;
  updatedPlan: string | null;
  feedback: string | null;
  nutritionTip: string;
  structuredDays?: StructuredWorkoutDay[];
  nutritionPlan?: NutritionPlan;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutHistoryEntry {
  id: string;
  userId: number;
  dayNumber: number;
  dayTitle: string;
  completedAt: string;
  durationMinutes: number;
  rpe: number; // 1-10
  difficultyRating: 'too_easy' | 'just_right' | 'too_hard' | string;
  notes?: string;
  completedExercises: string[];
}

export interface ProgressEntry {
  id: string;
  userId: number;
  date: string;
  weight: number;
  waistCm?: number;
  chestCm?: number;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  userId: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionTaken?: string;
}

export interface DatabaseState {
  users: User[];
  workoutPlans: WorkoutPlan[];
  workoutHistory: WorkoutHistoryEntry[];
  progressLogs: ProgressEntry[];
  chatHistory: ChatMessage[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'fitbuddy.json');

const INITIAL_STRUCTURED_DAYS: StructuredWorkoutDay[] = [
  {
    dayNumber: 1,
    title: "Upper Body Hypertrophy (Chest & Back)",
    focus: "Chest, Upper Back, Lats & Triceps",
    isRestDay: false,
    durationMinutes: 50,
    warmup: {
      duration: "8 mins",
      exercises: ["Scapular push-ups (15 reps)", "Band pull-aparts (20 reps)", "Arm circles & thoracic rotations", "Light dumbbell halos (10 each side)"]
    },
    exercises: [
      {
        id: "ex-1",
        name: "Barbell Bench Press (or Dumbbell Press)",
        sets: 4,
        reps: "6-8",
        restSeconds: 90,
        difficulty: "Intermediate",
        targetMuscles: "Pectoralis Major, Anterior Deltoids, Triceps",
        notes: "Keep shoulder blades retracted and drive feet into floor.",
        alternatives: ["Dumbbell Flat Press", "Weighted Dips", "Push-ups with elevated feet"]
      },
      {
        id: "ex-2",
        name: "Bent-Over Barbell Rows",
        sets: 4,
        reps: "8-10",
        restSeconds: 75,
        difficulty: "Intermediate",
        targetMuscles: "Latissimus Dorsi, Rhomboids, Rear Delts",
        notes: "Maintain a flat spine angle around 45 degrees.",
        alternatives: ["Dumbbell Single-Arm Row", "Seated Cable Row", "Chest-Supported Row"]
      },
      {
        id: "ex-3",
        name: "Incline Dumbbell Press",
        sets: 3,
        reps: "10-12",
        restSeconds: 60,
        difficulty: "Intermediate",
        targetMuscles: "Clavicular Pectoral Head (Upper Chest)",
        notes: "30-degree incline bench, smooth controlled descent.",
        alternatives: ["Incline Machine Press", "Decline Push-ups", "Incline Dumbbell Flyes"]
      },
      {
        id: "ex-4",
        name: "Lat Pulldowns or Pull-Ups",
        sets: 3,
        reps: "8-12",
        restSeconds: 60,
        difficulty: "Intermediate",
        targetMuscles: "Lats & Lower Trapezius",
        notes: "Squeeze elbows down to your pockets.",
        alternatives: ["Band-Assisted Pull-ups", "Straight-Arm Cable Pushdowns"]
      },
      {
        id: "ex-5",
        name: "Cable Face Pulls",
        sets: 3,
        reps: "15",
        restSeconds: 45,
        difficulty: "Beginner",
        targetMuscles: "Posterior Deltoids & External Rotators",
        notes: "Great for shoulder posture and rotator cuff longevity.",
        alternatives: ["Dumbbell Rear Delt Flyes", "Band Face Pulls"]
      }
    ],
    cooldown: {
      duration: "6 mins",
      tips: "Perform doorway pectoral stretch, hanging lat decompression from a bar, and slow nasal diaphragmatic breathing."
    }
  },
  {
    dayNumber: 2,
    title: "Lower Body Strength & Core",
    focus: "Quadriceps, Hamstrings, Glutes & Abs",
    isRestDay: false,
    durationMinutes: 55,
    warmup: {
      duration: "10 mins",
      exercises: ["Deep bodyweight goblet squat hold", "90/90 hip mobility switches", "Leg swings (front-to-back, side-to-side)", "Glute bridges (15 reps)"]
    },
    exercises: [
      {
        id: "ex-6",
        name: "Barbell Back Squats (or Goblet Squats)",
        sets: 4,
        reps: "6-8",
        restSeconds: 120,
        difficulty: "Intermediate",
        targetMuscles: "Quadriceps, Gluteus Maximus, Core",
        notes: "Brace abdominal wall prior to descent, knees track over toes.",
        alternatives: ["Goblet Squats", "Leg Press", "Smith Machine Squat"]
      },
      {
        id: "ex-7",
        name: "Romanian Deadlifts (RDLs)",
        sets: 3,
        reps: "8-10",
        restSeconds: 90,
        difficulty: "Intermediate",
        targetMuscles: "Hamstrings, Glutes, Erector Spinae",
        notes: "Hinge at the hips, keeping bar close to your shins.",
        alternatives: ["Dumbbell RDL", "Glute Ham Developer", "Swiss Ball Leg Curls"]
      },
      {
        id: "ex-8",
        name: "Bulgarian Split Squats",
        sets: 3,
        reps: "10 per leg",
        restSeconds: 60,
        difficulty: "Advanced",
        targetMuscles: "Quads, Glutes & Hip Stabilizers",
        notes: "Rear foot on bench. Stay upright for quads, slight hinge for glutes.",
        alternatives: ["Walking Dumbbell Lunges", "Step-Ups on Plyo Box"]
      },
      {
        id: "ex-9",
        name: "Hanging Leg Raises",
        sets: 3,
        reps: "12-15",
        restSeconds: 45,
        difficulty: "Intermediate",
        targetMuscles: "Rectus Abdominis & Hip Flexors",
        notes: "Avoid swinging momentum; curl pelvis upwards.",
        alternatives: ["Lying Reverse Crunches", "Captain's Chair Knee Raises"]
      }
    ],
    cooldown: {
      duration: "7 mins",
      tips: "Couch stretch for hip flexors, seated hamstring reach, and butterfly stretch for adductors."
    }
  },
  {
    dayNumber: 3,
    title: "Active Recovery & Mobility Flow",
    focus: "Low-Intensity Cardio, Yoga & Joint Decompression",
    isRestDay: false,
    durationMinutes: 35,
    warmup: {
      duration: "5 mins",
      exercises: ["Cat-Cow spinal waves", "Wrist & ankle rotations", "Gentle deep squats"]
    },
    exercises: [
      {
        id: "ex-10",
        name: "Zone 2 Low-Impact Incline Walk or Cycling",
        sets: 1,
        reps: "25-30 mins",
        restSeconds: 0,
        difficulty: "Beginner",
        targetMuscles: "Cardiovascular System & Aerobic Mitochondria",
        notes: "Maintain a conversational breathing pace (Heart Rate ~120-135 BPM).",
        alternatives: ["Rowing machine easy pace", "Outdoor brisk walk", "Swimming"]
      },
      {
        id: "ex-11",
        name: "Full Body Yoga & Foam Rolling Circuit",
        sets: 1,
        reps: "15 mins",
        restSeconds: 0,
        difficulty: "Beginner",
        targetMuscles: "Full Body Fascia & Mobility",
        notes: "Target thoracic spine, lats, quads, and IT bands.",
        alternatives: ["Pigeon Pose & World's Greatest Stretch"]
      }
    ],
    cooldown: {
      duration: "5 mins",
      tips: "Hydrate with electrolyte water and take 5 deep box breaths (4s in, 4s hold, 4s out, 4s hold)."
    }
  },
  {
    dayNumber: 4,
    title: "Shoulders, Arms & Upper Hypertrophy",
    focus: "Deltoids, Biceps, Triceps & Traps",
    isRestDay: false,
    durationMinutes: 48,
    warmup: {
      duration: "6 mins",
      exercises: ["Rotator cuff Y-T-W raises", "Arm swings", "Light push-ups"]
    },
    exercises: [
      {
        id: "ex-12",
        name: "Overhead Barbell Military Press",
        sets: 4,
        reps: "8",
        restSeconds: 90,
        difficulty: "Intermediate",
        targetMuscles: "Anterior & Lateral Deltoids, Upper Chest, Core",
        notes: "Lock glutes and abs tight; do not over-arch lower back.",
        alternatives: ["Seated Dumbbell Shoulder Press", "Arnold Press"]
      },
      {
        id: "ex-13",
        name: "Dumbbell Lateral Raises",
        sets: 4,
        reps: "12-15",
        restSeconds: 45,
        difficulty: "Beginner",
        targetMuscles: "Lateral Deltoids (Cap Width)",
        notes: "Slight forward lean, raise arms as if pouring water from pitchers.",
        alternatives: ["Cable Lateral Raises", "Resistance Band Side Raises"]
      },
      {
        id: "ex-14",
        name: "Incline Dumbbell Bicep Curls",
        sets: 3,
        reps: "10-12",
        restSeconds: 60,
        difficulty: "Beginner",
        targetMuscles: "Biceps Brachii (Long Head stretch)",
        notes: "Keep elbows back and supinate wrists at top.",
        alternatives: ["Standing Barbell Curls", "EZ-Bar Preacher Curls"]
      },
      {
        id: "ex-15",
        name: "Overhead Rope Tricep Extensions",
        sets: 3,
        reps: "12-15",
        restSeconds: 60,
        difficulty: "Beginner",
        targetMuscles: "Triceps Brachii (Long Head)",
        notes: "Flaring the rope handles apart at full extension.",
        alternatives: ["Skull Crushers", "Dumbbell Kickbacks"]
      }
    ],
    cooldown: {
      duration: "5 mins",
      tips: "Cross-body arm stretch, overhead tricep pull, and neck release."
    }
  },
  {
    dayNumber: 5,
    title: "Posterior Chain Power & Heavy Pull",
    focus: "Deadlifts, Upper Back, Glutes & Grip",
    isRestDay: false,
    durationMinutes: 52,
    warmup: {
      duration: "8 mins",
      exercises: ["Kettlebell deadlift groove", "Glute bridge holds", "Bird-dogs (10 each side)"]
    },
    exercises: [
      {
        id: "ex-16",
        name: "Conventional Barbell Deadlift",
        sets: 4,
        reps: "5",
        restSeconds: 120,
        difficulty: "Advanced",
        targetMuscles: "Entire Posterior Chain, Erector Spinae, Glutes, Lats",
        notes: "Pull slack out of the bar before driving floor away.",
        alternatives: ["Trap Bar Deadlift", "Rack Pulls", "Heavy Kettlebell Swings"]
      },
      {
        id: "ex-17",
        name: "Single-Arm Dumbbell Row",
        sets: 3,
        reps: "10 per side",
        restSeconds: 60,
        difficulty: "Intermediate",
        targetMuscles: "Latissimus Dorsi, Rhomboids",
        notes: "Support hand on bench, pull dumbbell to hip pocket.",
        alternatives: ["Cable Meadows Row", "Barbell Landmine Row"]
      },
      {
        id: "ex-18",
        name: "Lying or Seated Hamstring Curls",
        sets: 3,
        reps: "12-15",
        restSeconds: 60,
        difficulty: "Beginner",
        targetMuscles: "Hamstrings (Knee Flexion)",
        notes: "Control the 3-second negative eccentric.",
        alternatives: ["Nordic Hamstring Curls", "Stability Ball Leg Curls"]
      }
    ],
    cooldown: {
      duration: "7 mins",
      tips: "Pigeon pose stretch for glutes and piriformis, child's pose decompression."
    }
  },
  {
    dayNumber: 6,
    title: "Functional Conditioning & Athletic Core",
    focus: "Full Body Dynamic Power, Agility & Core Endurance",
    isRestDay: false,
    durationMinutes: 45,
    warmup: {
      duration: "7 mins",
      exercises: ["Jumping jacks", "High knees & butt kicks", "Inchworms to plank"]
    },
    exercises: [
      {
        id: "ex-19",
        name: "Kettlebell Swings",
        sets: 4,
        reps: "15-20",
        restSeconds: 45,
        difficulty: "Intermediate",
        targetMuscles: "Glutes, Hamstrings, Core, Cardiovascular",
        notes: "Explosive hip snap. This is a hinge, not a squat.",
        alternatives: ["Dumbbell Hip Snaps", "Broad Jumps"]
      },
      {
        id: "ex-20",
        name: "Dumbbell Push Press or Thrusters",
        sets: 3,
        reps: "10",
        restSeconds: 60,
        difficulty: "Intermediate",
        targetMuscles: "Quads, Shoulders, Triceps & Core",
        notes: "Use leg drive to propel weights overhead smoothly.",
        alternatives: ["Medicine Ball Wall Balls", "Goblet Squats + Press"]
      },
      {
        id: "ex-21",
        name: "Plank with Shoulder Taps & Russian Twists",
        sets: 3,
        reps: "40 secs",
        restSeconds: 45,
        difficulty: "Intermediate",
        targetMuscles: "Rotational Core & Anti-Rotation Stability",
        notes: "Keep hips locked level without swaying.",
        alternatives: ["Deadbugs", "Hollow Body Holds"]
      }
    ],
    cooldown: {
      duration: "6 mins",
      tips: "Cobra stretch for abdominals, standing quad stretch, deep calming breathwork."
    }
  },
  {
    dayNumber: 7,
    title: "Complete Regeneration & Growth Rest",
    focus: "Central Nervous System & Tissue Repair",
    isRestDay: true,
    durationMinutes: 20,
    warmup: {
      duration: "None",
      exercises: []
    },
    exercises: [
      {
        id: "ex-22",
        name: "Leisurely Walk in Sunlight & Hydration",
        sets: 1,
        reps: "20-30 mins",
        restSeconds: 0,
        difficulty: "Beginner",
        targetMuscles: "Parasympathetic Recovery",
        notes: "No strenuous training. Allow muscle fibers to rebuild.",
        alternatives: ["Sauna", "Epsom Salt Bath"]
      }
    ],
    cooldown: {
      duration: "10 mins",
      tips: "Aim for 8-9 hours of restorative sleep and prepare nutrient-dense meals for next week."
    }
  }
];

const INITIAL_NUTRITION: NutritionPlan = {
  dailyCalories: 2650,
  proteinGrams: 175,
  carbsGrams: 280,
  fatsGrams: 72,
  waterLiters: 3.2,
  generalAdvice: "Prioritize lean proteins, complex slow-digesting carbohydrates, and healthy fats. Consume high-protein fuel within 90 minutes post-workout to stimulate muscle protein synthesis.",
  meals: [
    {
      name: "Breakfast",
      timing: "7:30 AM",
      suggestion: "3 whole eggs + 2 egg whites scrambled with spinach, 1 cup cooked rolled oats with berries and 1 tbsp chia seeds.",
      calories: 580,
      proteinG: 38,
      carbsG: 62,
      fatsG: 18
    },
    {
      name: "Lunch",
      timing: "12:30 PM",
      suggestion: "Grilled chicken breast (200g), 1.5 cups brown rice or quinoa, roasted broccoli & zucchini drizzled with olive oil.",
      calories: 720,
      proteinG: 52,
      carbsG: 75,
      fatsG: 20
    },
    {
      name: "Pre-Workout Fuel",
      timing: "4:00 PM",
      suggestion: "1 medium banana with 1 tbsp natural peanut butter or rice cakes with honey.",
      calories: 220,
      proteinG: 5,
      carbsG: 35,
      fatsG: 8
    },
    {
      name: "Dinner",
      timing: "7:30 PM",
      suggestion: "Wild salmon fillet (180g) or lean beef, baked sweet potato, large mixed leafy green salad with avocado dressing.",
      calories: 680,
      proteinG: 46,
      carbsG: 55,
      fatsG: 24
    },
    {
      name: "Evening Snack",
      timing: "9:30 PM",
      suggestion: "1 cup low-fat Greek yogurt with a scoop of casein/whey or a handful of raw almonds.",
      calories: 210,
      proteinG: 22,
      carbsG: 12,
      fatsG: 6
    }
  ],
  supplements: ["Whey / Plant Protein Isolate", "Creatine Monohydrate (5g daily)", "Vitamin D3 + K2", "Omega-3 Fish Oil", "Magnesium Glycinate before bed"]
};

function ensureDataFile(): DatabaseState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const initialState: DatabaseState = {
      users: [
        {
          id: 101,
          name: "Marcus Vance",
          age: 28,
          weight: 82.5,
          height: 182,
          gender: "male",
          goal: "muscle gain",
          intensity: "high",
          fitnessLevel: "intermediate",
          equipment: ["barbell", "dumbbells", "bench", "cables", "pull_up_bar"],
          workoutPreferences: ["hypertrophy", "strength"],
          schedule: 7,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 102,
          name: "Elena Rostova",
          age: 31,
          weight: 64.0,
          height: 168,
          gender: "female",
          goal: "weight loss",
          intensity: "medium",
          fitnessLevel: "intermediate",
          equipment: ["dumbbells", "kettlebell", "resistance_bands", "bodyweight"],
          workoutPreferences: ["hiit", "mobility", "strength"],
          schedule: 7,
          createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        }
      ],
      workoutPlans: [
        {
          id: 1,
          userId: 101,
          originalPlan: "Day 1: Upper Body Power\nDay 2: Lower Body Strength\nDay 3: Active Recovery & Core\nDay 4: Shoulders & Arms\nDay 5: Posterior Chain\nDay 6: Conditioning\nDay 7: Rest",
          updatedPlan: "Day 1: Upper Body Power\nDay 2: Lower Body Strength\nDay 3: Vinyasa Yoga & Active Core Flow (Updated per feedback)\nDay 4: Shoulders & Arms\nDay 5: Posterior Chain\nDay 6: Conditioning\nDay 7: Rest",
          feedback: "Add yoga on Day 3 for active recovery and flexibility",
          nutritionTip: "For muscle hypertrophy, consume 25-35g of high-leucine protein within 90 minutes post-workout, alongside 40-50g of complex carbs.",
          structuredDays: INITIAL_STRUCTURED_DAYS,
          nutritionPlan: INITIAL_NUTRITION,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        }
      ],
      workoutHistory: [
        {
          id: "hist-1",
          userId: 101,
          dayNumber: 1,
          dayTitle: "Upper Body Hypertrophy",
          completedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
          durationMinutes: 52,
          rpe: 8,
          difficultyRating: "just_right",
          notes: "Felt strong on bench press, hit 85kg for 4x8 cleanly.",
          completedExercises: ["Barbell Bench Press", "Bent-Over Barbell Rows", "Incline Dumbbell Press", "Lat Pulldowns", "Cable Face Pulls"]
        },
        {
          id: "hist-2",
          userId: 101,
          dayNumber: 2,
          dayTitle: "Lower Body Strength",
          completedAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
          durationMinutes: 58,
          rpe: 9,
          difficultyRating: "too_hard",
          notes: "Squats were challenging, legs were quite fatigued from previous session.",
          completedExercises: ["Barbell Back Squats", "Romanian Deadlifts", "Bulgarian Split Squats", "Hanging Leg Raises"]
        }
      ],
      progressLogs: [
        {
          id: "prog-1",
          userId: 101,
          date: new Date(Date.now() - 86400000 * 14).toISOString().split('T')[0],
          weight: 84.0,
          waistCm: 86,
          chestCm: 104,
          notes: "Initial baseline measurement"
        },
        {
          id: "prog-2",
          userId: 101,
          date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
          weight: 83.2,
          waistCm: 85,
          chestCm: 105,
          notes: "Week 1 check-in"
        },
        {
          id: "prog-3",
          userId: 101,
          date: new Date().toISOString().split('T')[0],
          weight: 82.5,
          waistCm: 84,
          chestCm: 105.5,
          notes: "Target body composition progression"
        }
      ],
      chatHistory: [
        {
          id: "msg-1",
          userId: 101,
          role: "user",
          content: "What can I do instead of barbell squats if my lower back feels stiff?",
          timestamp: new Date(Date.now() - 86400000 * 0.4).toISOString()
        },
        {
          id: "msg-2",
          userId: 101,
          role: "assistant",
          content: "Great question! If your lower back feels stiff, avoid heavy axial loading today. Excellent alternatives include:\n\n1. **Goblet Squats with a Heel Elevation**: Keeps your torso much more vertical, drastically reducing lumbar shearing forces.\n2. **Bulgarian Split Squats (Dumbbells)**: Unilateral loading requires half the absolute weight while delivering tremendous quad and glute hypertrophy without spinal compression.\n3. **Leg Press or Belt Squat**: Completely unloads the spine.\n\nMake sure to spend 5 minutes with a foam roller on your glutes and hip flexors before starting!",
          timestamp: new Date(Date.now() - 86400000 * 0.4 + 1000).toISOString()
        }
      ]
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialState, null, 2), 'utf-8');
    return initialState;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.workoutHistory) parsed.workoutHistory = [];
    if (!parsed.progressLogs) parsed.progressLogs = [];
    if (!parsed.chatHistory) parsed.chatHistory = [];
    
    // Auto-migrate plans to include structuredDays and nutritionPlan if missing
    let modified = false;
    for (const plan of parsed.workoutPlans || []) {
      if (!plan.structuredDays || plan.structuredDays.length === 0) {
        plan.structuredDays = INITIAL_STRUCTURED_DAYS;
        plan.nutritionPlan = INITIAL_NUTRITION;
        modified = true;
      }
    }
    if (parsed.progressLogs.length <= 1) {
      parsed.progressLogs = [
        {
          id: "prog-1",
          userId: 101,
          date: "2026-09-17",
          weight: 84.0,
          waistCm: 86,
          chestCm: 104,
          notes: "Initial baseline measurement"
        },
        {
          id: "prog-2",
          userId: 101,
          date: "2026-09-24",
          weight: 83.1,
          waistCm: 85,
          chestCm: 105,
          notes: "Week 1 check-in"
        },
        {
          id: "prog-3",
          userId: 101,
          date: "2026-10-01",
          weight: 82.3,
          waistCm: 84,
          chestCm: 105.5,
          notes: "Week 2 progress weigh-in"
        }
      ];
      modified = true;
    }
    if (modified) {
      writeData(parsed);
    }
    return parsed;
  } catch {
    return { users: [], workoutPlans: [], workoutHistory: [], progressLogs: [], chatHistory: [] };
  }
}

function writeData(state: DatabaseState): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

export function saveUser(
  userId: number,
  name: string,
  age: number,
  weight: number,
  goal: string,
  intensity: string,
  extra?: Partial<User>
): User {
  const state = ensureDataFile();
  const existingIndex = state.users.findIndex(u => u.id === Number(userId));

  let user: User;
  if (existingIndex >= 0) {
    user = {
      ...state.users[existingIndex],
      name,
      age: Number(age),
      weight: Number(weight),
      goal,
      intensity,
      ...(extra || {})
    };
    state.users[existingIndex] = user;
  } else {
    user = {
      id: Number(userId),
      name,
      age: Number(age),
      weight: Number(weight),
      goal,
      intensity,
      schedule: 7,
      createdAt: new Date().toISOString(),
      ...(extra || {})
    };
    state.users.push(user);
  }

  writeData(state);
  return user;
}

export function savePlan(
  userId: number,
  plan: string,
  nutritionTip: string = '',
  structuredDays?: StructuredWorkoutDay[],
  nutritionPlan?: NutritionPlan
): WorkoutPlan {
  const state = ensureDataFile();
  const uid = Number(userId);
  const existingIndex = state.workoutPlans.findIndex(p => p.userId === uid);

  let workout: WorkoutPlan;
  if (existingIndex >= 0) {
    workout = {
      ...state.workoutPlans[existingIndex],
      originalPlan: plan,
      nutritionTip: nutritionTip || state.workoutPlans[existingIndex].nutritionTip,
      structuredDays: structuredDays || state.workoutPlans[existingIndex].structuredDays || INITIAL_STRUCTURED_DAYS,
      nutritionPlan: nutritionPlan || state.workoutPlans[existingIndex].nutritionPlan || INITIAL_NUTRITION,
      updatedAt: new Date().toISOString(),
    };
    state.workoutPlans[existingIndex] = workout;
  } else {
    workout = {
      id: state.workoutPlans.length > 0 ? Math.max(...state.workoutPlans.map(p => p.id)) + 1 : 1,
      userId: uid,
      originalPlan: plan,
      updatedPlan: null,
      feedback: null,
      nutritionTip,
      structuredDays: structuredDays || INITIAL_STRUCTURED_DAYS,
      nutritionPlan: nutritionPlan || INITIAL_NUTRITION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.workoutPlans.push(workout);
  }

  writeData(state);
  return workout;
}

export function updatePlan(
  userId: number,
  updatedText: string,
  feedback?: string,
  newNutritionTip?: string,
  newStructuredDays?: StructuredWorkoutDay[]
): WorkoutPlan | null {
  const state = ensureDataFile();
  const uid = Number(userId);
  const existingIndex = state.workoutPlans.findIndex(p => p.userId === uid);

  if (existingIndex >= 0) {
    const prev = state.workoutPlans[existingIndex];
    const workout: WorkoutPlan = {
      ...prev,
      updatedPlan: updatedText,
      feedback: feedback !== undefined ? feedback : prev.feedback,
      nutritionTip: newNutritionTip || prev.nutritionTip,
      structuredDays: newStructuredDays || prev.structuredDays,
      updatedAt: new Date().toISOString(),
    };
    state.workoutPlans[existingIndex] = workout;
    writeData(state);
    return workout;
  }

  const workout: WorkoutPlan = {
    id: state.workoutPlans.length > 0 ? Math.max(...state.workoutPlans.map(p => p.id)) + 1 : 1,
    userId: uid,
    originalPlan: updatedText,
    updatedPlan: updatedText,
    feedback: feedback || null,
    nutritionTip: newNutritionTip || '',
    structuredDays: newStructuredDays || INITIAL_STRUCTURED_DAYS,
    nutritionPlan: INITIAL_NUTRITION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.workoutPlans.push(workout);
  writeData(state);
  return workout;
}

export function getOriginalPlan(userId: number): string | null {
  const state = ensureDataFile();
  const workout = state.workoutPlans.find(p => p.userId === Number(userId));
  return workout ? workout.originalPlan : null;
}

export function getWorkoutPlan(userId: number): WorkoutPlan | null {
  const state = ensureDataFile();
  const workout = state.workoutPlans.find(p => p.userId === Number(userId));
  return workout || null;
}

export function getUser(userId: number): User | null {
  const state = ensureDataFile();
  return state.users.find(u => u.id === Number(userId)) || null;
}

export function getAllUsers(): User[] {
  const state = ensureDataFile();
  return state.users;
}

export function getAllUsersWithPlans() {
  const state = ensureDataFile();
  return state.users.map(user => {
    const plan = state.workoutPlans.find(p => p.userId === user.id);
    return {
      id: user.id,
      name: user.name,
      age: user.age,
      weight: user.weight,
      height: user.height,
      gender: user.gender,
      goal: user.goal,
      intensity: user.intensity,
      fitnessLevel: user.fitnessLevel,
      equipment: user.equipment,
      schedule: user.schedule,
      original_plan: plan ? plan.originalPlan : "N/A",
      updated_plan: plan && plan.updatedPlan ? plan.updatedPlan : "Not updated",
      nutrition_tip: plan ? plan.nutritionTip : "",
      feedback: plan ? plan.feedback : null,
      structuredDays: plan?.structuredDays,
      nutritionPlan: plan?.nutritionPlan,
      createdAt: user.createdAt,
    };
  });
}

export function deleteUser(userId: number): boolean {
  const state = ensureDataFile();
  const uid = Number(userId);
  state.users = state.users.filter(u => u.id !== uid);
  state.workoutPlans = state.workoutPlans.filter(p => p.userId !== uid);
  state.workoutHistory = state.workoutHistory.filter(h => h.userId !== uid);
  state.progressLogs = state.progressLogs.filter(l => l.userId !== uid);
  state.chatHistory = state.chatHistory.filter(c => c.userId !== uid);
  writeData(state);
  return true;
}

// Workout Logging & History
export function logWorkoutSession(entry: Omit<WorkoutHistoryEntry, 'id' | 'completedAt'>): WorkoutHistoryEntry {
  const state = ensureDataFile();
  const newEntry: WorkoutHistoryEntry = {
    ...entry,
    id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    completedAt: new Date().toISOString(),
  };
  state.workoutHistory.unshift(newEntry);
  writeData(state);
  return newEntry;
}

export function getWorkoutHistory(userId: number): WorkoutHistoryEntry[] {
  const state = ensureDataFile();
  return state.workoutHistory.filter(h => h.userId === Number(userId));
}

// Progress & Body Measurements
export function logProgressEntry(entry: Omit<ProgressEntry, 'id'>): ProgressEntry {
  const state = ensureDataFile();
  const newEntry: ProgressEntry = {
    ...entry,
    id: `prog-${Date.now()}`,
  };
  state.progressLogs.push(newEntry);
  state.progressLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Also update latest weight on user profile
  const user = state.users.find(u => u.id === entry.userId);
  if (user) {
    user.weight = entry.weight;
  }

  writeData(state);
  return newEntry;
}

export function getProgressLogs(userId: number): ProgressEntry[] {
  const state = ensureDataFile();
  return state.progressLogs.filter(p => p.userId === Number(userId));
}

// AI Chatbot Messages
export function addChatMessage(userId: number, role: 'user' | 'assistant', content: string, actionTaken?: string): ChatMessage {
  const state = ensureDataFile();
  const msg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId: Number(userId),
    role,
    content,
    timestamp: new Date().toISOString(),
    actionTaken
  };
  state.chatHistory.push(msg);
  writeData(state);
  return msg;
}

export function getChatHistory(userId: number): ChatMessage[] {
  const state = ensureDataFile();
  return state.chatHistory.filter(c => c.userId === Number(userId));
}
