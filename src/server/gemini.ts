import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  StructuredWorkoutDay,
  NutritionPlan,
  User,
  WorkoutPlan,
} from './storage';

dotenv.config();

const rawKey = process.env.GEMINI_API_KEY || '';
const apiKey = rawKey && rawKey !== 'MY_GEMINI_API_KEY' && rawKey !== 'your-google-gemini-api-key' ? rawKey : '';

let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface ComprehensiveProfileInput {
  name?: string;
  age?: number;
  weight?: number; // kg
  height?: number; // cm
  gender?: string;
  goal: string;
  intensity: string;
  fitnessLevel?: string;
  equipment?: string[];
  workoutPreferences?: string[];
  injuries?: string;
}

export interface GeneratedPlanResult {
  textPlan: string;
  structuredDays: StructuredWorkoutDay[];
  nutritionPlan: NutritionPlan;
  nutritionTip: string;
}

/**
 * Generate comprehensive fitness plan with structured daily workouts and nutrition
 */
export async function generateComprehensiveFitnessPlan(
  profile: ComprehensiveProfileInput
): Promise<GeneratedPlanResult> {
  const goal = profile.goal || 'general fitness';
  const intensity = profile.intensity || 'medium';
  const name = profile.name || 'Athlete';
  const age = profile.age || 28;
  const weight = profile.weight || 75;
  const height = profile.height || 175;
  const gender = profile.gender || 'unspecified';
  const fitnessLevel = profile.fitnessLevel || 'intermediate';
  const equipment = (profile.equipment && profile.equipment.length > 0)
    ? profile.equipment.join(', ')
    : 'standard gym equipment (dumbbells, barbells, benches, cables)';
  const preferences = (profile.workoutPreferences && profile.workoutPreferences.length > 0)
    ? profile.workoutPreferences.join(', ')
    : 'balanced hypertrophy and strength';
  const injuries = profile.injuries ? `Important: Avoid or protect against: ${profile.injuries}` : 'No known injuries reported.';

  const prompt = `You are a certified master fitness coach, sports nutritionist, and exercise physiologist.
Create a complete, highly personalized 7-day fitness regimen and nutritional plan for this athlete:
- Athlete Name: ${name}
- Age: ${age} | Gender: ${gender} | Weight: ${weight} kg | Height: ${height} cm
- Primary Goal: ${goal}
- Intensity: ${intensity} | Fitness Level: ${fitnessLevel}
- Available Equipment: ${equipment}
- Preferences: ${preferences}
- Injury / Health Considerations: ${injuries}

You must return a valid JSON object matching the following structure:
{
  "textPlan": "A full text version formatted clearly Day 1 through Day 7 with Warm-up (5-10 mins), Main Workout (exercises, sets, reps), and Cooldown",
  "nutritionTip": "One concise, highly actionable nutrition or recovery tip (2-3 sentences)",
  "nutritionPlan": {
    "dailyCalories": number (calculated scientific TDEE target),
    "proteinGrams": number,
    "carbsGrams": number,
    "fatsGrams": number,
    "waterLiters": number,
    "generalAdvice": "Scientific nutritional strategy overview",
    "meals": [
      {
        "name": "Breakfast",
        "timing": "e.g. 7:30 AM",
        "suggestion": "Meal description with whole foods",
        "calories": number,
        "proteinG": number,
        "carbsG": number,
        "fatsG": number
      },
      { "name": "Lunch", "timing": "e.g. 12:30 PM", "suggestion": "...", "calories": number, "proteinG": number, "carbsG": number, "fatsG": number },
      { "name": "Pre-Workout Fuel", "timing": "e.g. 4:00 PM", "suggestion": "...", "calories": number, "proteinG": number, "carbsG": number, "fatsG": number },
      { "name": "Dinner", "timing": "e.g. 7:30 PM", "suggestion": "...", "calories": number, "proteinG": number, "carbsG": number, "fatsG": number },
      { "name": "Recovery Snack", "timing": "e.g. 9:30 PM", "suggestion": "...", "calories": number, "proteinG": number, "carbsG": number, "fatsG": number }
    ],
    "supplements": ["Suggested evidence-based supplements e.g. Creatine, Whey, Vitamin D"]
  },
  "structuredDays": [
    {
      "dayNumber": 1,
      "title": "Workout Title e.g. Upper Body Push & Pull",
      "focus": "Target muscles e.g. Chest, Lats, Shoulders",
      "isRestDay": false,
      "durationMinutes": 50,
      "warmup": {
        "duration": "8 mins",
        "exercises": ["Dynamic arm circles", "Band pull-aparts", "Scapular push-ups"]
      },
      "exercises": [
        {
          "id": "ex-1",
          "name": "Exercise Name",
          "sets": 4,
          "reps": "8-10",
          "restSeconds": 90,
          "difficulty": "Intermediate",
          "targetMuscles": "Pectoralis Major, Triceps",
          "notes": "Coaching cue for technique",
          "alternatives": ["Alternative 1", "Alternative 2"]
        }
      ],
      "cooldown": {
        "duration": "6 mins",
        "tips": "Targeted static stretches and breathwork"
      }
    }
    // Repeat for days 1 to 7 (at least 1 day should be a rest/active recovery day)
  ]
}`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (parsed.structuredDays && Array.isArray(parsed.structuredDays)) {
          return {
            textPlan: parsed.textPlan || formatStructuredDaysToText(parsed.structuredDays, goal, intensity, name),
            structuredDays: parsed.structuredDays,
            nutritionPlan: parsed.nutritionPlan || generateFallbackNutrition(weight, goal),
            nutritionTip: parsed.nutritionTip || "Prioritize high-protein nutrition and stay hydrated throughout the day.",
          };
        }
      }
    } catch (err: unknown) {
      console.warn('Gemini structured plan generation error, falling back:', err);
    }
  }

  // Fallback generator
  return getFallbackComprehensivePlan(profile);
}

/**
 * Exercise alternative finder
 */
export async function getExerciseAlternatives(
  exerciseName: string,
  equipment: string[] = [],
  reason: string = 'equipment unavailable'
): Promise<{ original: string; alternatives: { name: string; equipment: string; reason: string }[] }> {
  const equipStr = equipment.length > 0 ? equipment.join(', ') : 'dumbbells, resistance bands, bodyweight';

  const prompt = `You are a certified strength and conditioning specialist.
A trainee needs suitable exercise alternatives for: "${exerciseName}".
Reason/Constraint: ${reason}.
Available Equipment: ${equipStr}.

Provide 3 to 4 biomechanically sound exercise alternatives that target the exact same primary muscle groups.
Return JSON in this format:
{
  "original": "${exerciseName}",
  "alternatives": [
    {
      "name": "Alternative Exercise Name",
      "equipment": "Equipment needed",
      "reason": "Why this is an effective substitute"
    }
  ]
}`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      if (response && response.text) {
        return JSON.parse(response.text.trim());
      }
    } catch (err) {
      console.warn('Gemini alternative finder error:', err);
    }
  }

  // Fast fallback alternatives
  return {
    original: exerciseName,
    alternatives: [
      {
        name: `Dumbbell / Goblet variation of ${exerciseName}`,
        equipment: 'Dumbbells or Kettlebell',
        reason: 'Maintains identical joint angles and kinetic chain without requiring barbells or machines.'
      },
      {
        name: `Bodyweight & Tempo focused variation`,
        equipment: 'Bodyweight & optional resistance bands',
        reason: 'Leverages slow eccentrics and isometric pauses to create high mechanical tension.'
      },
      {
        name: `Unilateral Single-Leg / Single-Arm variation`,
        equipment: 'Light Dumbbells or Bands',
        reason: 'Eliminates muscular imbalances and reduces spinal or joint compression.'
      }
    ]
  };
}

/**
 * AI Fitness Chatbot with full athlete context
 */
export async function askFitnessCoach(
  userQuestion: string,
  athleteContext: {
    user?: User | null;
    workoutPlan?: WorkoutPlan | null;
    history?: any[];
  }
): Promise<{ answer: string; suggestedAction?: string }> {
  const user = athleteContext.user;
  const userDesc = user
    ? `Athlete: ${user.name}, Age: ${user.age}, Weight: ${user.weight}kg, Goal: ${user.goal}, Intensity: ${user.intensity}, Fitness Level: ${user.fitnessLevel || 'intermediate'}, Equipment: ${user.equipment?.join(', ') || 'standard'}.`
    : 'Athlete: General user.';

  const prompt = `You are "FitCoach", a knowledgeable, friendly, and science-grounded AI Fitness Coach.
User Profile: ${userDesc}

Athlete Question: "${userQuestion}"

Instructions:
1. Provide a direct, motivating, and scientifically sound answer.
2. If the user asks for exercise replacements (e.g. "What can I do instead of squats?"), give 2-3 specific substitutes with form cues.
3. If they ask about soreness, fatigue, or nutrition, provide practical recovery tips.
4. Keep the answer concise (2 to 4 paragraphs), friendly, and direct.
5. If medical pain or an injury is described, include a clear safety reminder to consult a medical or healthcare provider.
6. Suggest 1 actionable next step at the end.`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      if (response && response.text) {
        return {
          answer: response.text.trim(),
        };
      }
    } catch (err) {
      console.warn('FitCoach chat error:', err);
    }
  }

  // Fallback chatbot answer
  return {
    answer: `Here's my coaching recommendation for "${userQuestion}":\n\nWhen optimizing your training for ${user?.goal || 'fitness'}, consistency and movement quality take top priority. If you need exercise substitutions, focus on preserving the fundamental movement pattern (push, pull, hinge, squat, or carry) with whatever equipment you have available.\n\nMake sure you are drinking enough water (${(Number(user?.weight || 75) * 0.035).toFixed(1)}L/day) and taking 60-90 seconds of rest between working sets for recovery.\n\n*Note: Always listen to your body; if you feel sharp joint pain rather than muscular fatigue, rest and consult a healthcare professional.*`,
  };
}

/**
 * Dynamic plan adjustment based on completed workouts or user feedback
 */
export async function dynamicPlanAdjustment(
  currentPlan: WorkoutPlan,
  adjustmentContext: {
    feedback?: string;
    completedDay?: number;
    difficultyRating?: string;
    rpe?: number;
  }
): Promise<{ updatedText: string; updatedStructuredDays?: StructuredWorkoutDay[]; nutritionTip: string }> {
  const originalPlanText = currentPlan.updatedPlan || currentPlan.originalPlan;
  const feedback = adjustmentContext.feedback || (
    adjustmentContext.difficultyRating === 'too_hard'
      ? `Athlete reported Day ${adjustmentContext.completedDay} was too hard (RPE ${adjustmentContext.rpe}/10). Lower volume and intensity slightly.`
      : adjustmentContext.difficultyRating === 'too_easy'
      ? `Athlete reported Day ${adjustmentContext.completedDay} was too easy (RPE ${adjustmentContext.rpe}/10). Increase progressive overload and challenge.`
      : 'Calibrate plan based on athlete feedback.'
  );

  const prompt = `You are a professional fitness trainer assistant.
Original 7-Day Workout Plan:
---------------------------------
${originalPlanText}
---------------------------------

Adjustment / Feedback:
"${feedback}"

Task:
Revise the workout plan to precisely incorporate this feedback while preserving the overall 7-day structure.
Provide the revised full text plan. Note the changes on the specific days modified.`;

  let updatedText = '';
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      if (response && response.text) {
        updatedText = response.text.trim();
      }
    } catch (err) {
      console.warn('Dynamic plan adjustment error:', err);
    }
  }

  if (!updatedText) {
    updatedText = `${originalPlanText}\n\n[DYNAMIC ADJUSTMENT: ${feedback}]\nPlan has been recalibrated for optimal recovery and progressive overload.`;
  }

  // Update structured days in memory
  const structuredDays = currentPlan.structuredDays ? JSON.parse(JSON.stringify(currentPlan.structuredDays)) : undefined;
  if (structuredDays && adjustmentContext.completedDay) {
    const day = structuredDays.find((d: StructuredWorkoutDay) => d.dayNumber === adjustmentContext.completedDay);
    if (day && adjustmentContext.difficultyRating === 'too_hard') {
      day.exercises.forEach((ex: any) => {
        if (ex.sets > 3) ex.sets -= 1;
        ex.restSeconds += 15;
      });
    } else if (day && adjustmentContext.difficultyRating === 'too_easy') {
      day.exercises.forEach((ex: any) => {
        ex.sets += 1;
      });
    }
  }

  return {
    updatedText,
    updatedStructuredDays: structuredDays,
    nutritionTip: `Adjusted recovery guideline: Ensure you consume 30-40g protein post-training, prioritize sleep, and stay hydrated to recover from current workout volume.`,
  };
}

// Helpers
function formatStructuredDaysToText(days: StructuredWorkoutDay[], goal: string, intensity: string, name: string): string {
  let output = `FitBuddy 7-Day Periodized Plan for ${name}\nGoal: ${goal.toUpperCase()} | Intensity: ${intensity.toUpperCase()}\n\n`;

  days.forEach((day) => {
    output += `Day ${day.dayNumber}: ${day.title} (${day.focus})\n`;
    if (day.warmup.exercises.length > 0) {
      output += `Warm-up (${day.warmup.duration}): ${day.warmup.exercises.join(', ')}\n`;
    }
    output += `Main Workout (${day.durationMinutes} mins):\n`;
    day.exercises.forEach((ex) => {
      output += `- ${ex.name}: ${ex.sets} sets x ${ex.reps} reps (Rest: ${ex.restSeconds}s) [${ex.targetMuscles}]\n`;
    });
    output += `Cooldown (${day.cooldown.duration}): ${day.cooldown.tips}\n\n`;
  });

  return output.trim();
}

function generateFallbackNutrition(weight: number, goal: string): NutritionPlan {
  const g = goal.toLowerCase();
  let calories = weight * 30;
  let protein = weight * 1.8;
  let fats = weight * 0.8;

  if (g.includes('muscle')) {
    calories = weight * 34;
    protein = weight * 2.2;
    fats = weight * 0.9;
  } else if (g.includes('loss')) {
    calories = weight * 24;
    protein = weight * 2.0;
    fats = weight * 0.7;
  }

  const carbs = Math.max(0, (calories - (protein * 4 + fats * 9)) / 4);
  const water = Number((weight * 0.035).toFixed(1));

  return {
    dailyCalories: Math.round(calories),
    proteinGrams: Math.round(protein),
    carbsGrams: Math.round(carbs),
    fatsGrams: Math.round(fats),
    waterLiters: water,
    generalAdvice: `For your ${goal} target, maintain consistent meal timing. Consume high-quality protein evenly across 4-5 meals with ample fiber from vegetables.`,
    meals: [
      { name: "Breakfast", timing: "8:00 AM", suggestion: "Oatmeal with protein powder, fresh berries, chia seeds, and 2 poached eggs.", calories: Math.round(calories * 0.25), proteinG: Math.round(protein * 0.25), carbsG: Math.round(carbs * 0.3), fatsG: Math.round(fats * 0.25) },
      { name: "Lunch", timing: "1:00 PM", suggestion: "Grilled chicken breast, quinoa or brown rice, steamed broccoli, and avocado olive oil dressing.", calories: Math.round(calories * 0.3), proteinG: Math.round(protein * 0.35), carbsG: Math.round(carbs * 0.35), fatsG: Math.round(fats * 0.3) },
      { name: "Pre/Post Workout Fuel", timing: "4:30 PM", suggestion: "Greek yogurt with honey and banana slices, or whey protein shake with an apple.", calories: Math.round(calories * 0.15), proteinG: Math.round(protein * 0.15), carbsG: Math.round(carbs * 0.2), fatsG: Math.round(fats * 0.1) },
      { name: "Dinner", timing: "7:45 PM", suggestion: "Baked salmon or lean sirloin, roasted sweet potato wedges, asparagus, and mixed greens.", calories: Math.round(calories * 0.3), proteinG: Math.round(protein * 0.25), carbsG: Math.round(carbs * 0.15), fatsG: Math.round(fats * 0.35) }
    ],
    supplements: ["Whey / Plant Isolate", "Creatine Monohydrate (5g)", "Electrolytes", "Omega-3", "Vitamin D3"]
  };
}

function getFallbackComprehensivePlan(profile: ComprehensiveProfileInput): GeneratedPlanResult {
  const goal = profile.goal || 'muscle gain';
  const intensity = profile.intensity || 'high';
  const name = profile.name || 'Athlete';
  const weight = profile.weight || 78;

  const nutritionPlan = generateFallbackNutrition(weight, goal);
  const nutritionTip = `For optimal ${goal} results, focus on getting 1.8-2.2g of protein per kg of bodyweight, drink ${nutritionPlan.waterLiters}L of water daily, and get 7-9 hours of sleep for central nervous system recovery.`;

  // We can return a high quality structured day set
  return {
    textPlan: `FitBuddy 7-Day Periodized Plan for ${name}\nGoal: ${goal.toUpperCase()} | Intensity: ${intensity.toUpperCase()}\n\nDay 1: Upper Body Power (Chest, Back & Deltoids)\nWarm-up: 8 mins dynamic arm circles, scapular retractions, band pull-aparts\nMain Workout:\n- Barbell Flat Bench Press: 4 sets x 6 reps (Heavy)\n- Weighted Pull-Ups / Lat Pulldowns: 4 sets x 8 reps\n- Incline Dumbbell Press: 3 sets x 10 reps\n- Bent-Over Barbell Rows: 4 sets x 8 reps\n- Cable Face Pulls: 3 sets x 15 reps\nCooldown: 6 mins pectoral stretch, hanging lat hang\n\nDay 2: Lower Body Strength (Quads, Hamstrings & Core)\nWarm-up: 10 mins bodyweight squats, hip 90/90 openers, leg swings\nMain Workout:\n- Barbell Back Squat: 4 sets x 6 reps\n- Romanian Deadlifts (RDL): 3 sets x 8 reps\n- Bulgarian Split Squats: 3 sets x 10 reps per leg\n- Hanging Leg Raises: 3 sets x 12 reps\nCooldown: 7 mins couch stretch, seated hamstring reach\n\nDay 3: Active Recovery & Vinyasa Mobility\nWarm-up: 5 mins gentle flow\nMain Workout:\n- 30 mins brisk walk or light cycle\n- Core Plank Variations & Yoga Flow: 15 mins\nCooldown: 8 mins foam rolling & hydration\n\nDay 4: Shoulders & Arms Hypertrophy\nWarm-up: 6 mins rotator cuff Y-T-W raises\nMain Workout:\n- Overhead Barbell Military Press: 4 sets x 8 reps\n- Dumbbell Lateral Raises: 4 sets x 12-15 reps\n- Incline Dumbbell Bicep Curls: 3 sets x 10 reps\n- Tricep Rope Cable Pushdowns: 3 sets x 12 reps\nCooldown: 6 mins tricep stretch, shoulder cross-pull\n\nDay 5: Posterior Chain & Heavy Pull\nWarm-up: 8 mins glute bridges, cat-cow\nMain Workout:\n- Conventional Deadlift: 4 sets x 5 reps\n- Dumbbell Single-Arm Rows: 3 sets x 10 reps per arm\n- Hamstring Leg Curls: 3 sets x 12 reps\nCooldown: 7 mins pigeon pose stretch\n\nDay 6: Functional Conditioning & Athletic Core\nWarm-up: 7 mins jumping jacks, inchworms\nMain Workout:\n- Kettlebell Swings: 4 sets x 15 reps\n- Dumbbell Push Press: 3 sets x 8 reps\n- Goblet Squats: 3 sets x 12 reps\n- Ab Wheel Rollouts: 3 sets x 10 reps\nCooldown: 6 mins child's pose, deep breathing\n\nDay 7: Full Regeneration & Growth Sleep\nWarm-up: None\nMain Workout: Complete rest day. Hydration & recovery.\nCooldown: 8-9 hours quality restorative sleep`,
    structuredDays: [
      {
        dayNumber: 1,
        title: "Upper Body Power (Chest, Back & Deltoids)",
        focus: "Chest, Upper Back, Lats & Shoulders",
        isRestDay: false,
        durationMinutes: 52,
        warmup: { duration: "8 mins", exercises: ["Dynamic arm circles", "Scapular push-ups", "Band pull-aparts"] },
        exercises: [
          { id: "e1", name: "Barbell Bench Press (or Dumbbell Press)", sets: 4, reps: "6-8", restSeconds: 90, difficulty: "Intermediate", targetMuscles: "Chest, Triceps", notes: "Retract scapulae firmly.", alternatives: ["Dumbbell Bench Press", "Weighted Dips", "Push-ups"] },
          { id: "e2", name: "Bent-Over Barbell Rows", sets: 4, reps: "8", restSeconds: 75, difficulty: "Intermediate", targetMuscles: "Lats, Upper Back", notes: "Pull with elbows.", alternatives: ["Single-Arm Dumbbell Row", "Seated Cable Row"] },
          { id: "e3", name: "Incline Dumbbell Press", sets: 3, reps: "10", restSeconds: 60, difficulty: "Intermediate", targetMuscles: "Upper Chest", notes: "Control the negative.", alternatives: ["Incline Push-ups", "Cable Crossover"] },
          { id: "e4", name: "Cable Face Pulls", sets: 3, reps: "15", restSeconds: 45, difficulty: "Beginner", targetMuscles: "Rear Deltoids", notes: "External rotation focus.", alternatives: ["Band Face Pulls", "Dumbbell Rear Flyes"] }
        ],
        cooldown: { duration: "6 mins", tips: "Doorway chest stretch and overhead tricep pull." }
      },
      {
        dayNumber: 2,
        title: "Lower Body Strength & Core",
        focus: "Quads, Hamstrings, Glutes & Abs",
        isRestDay: false,
        durationMinutes: 55,
        warmup: { duration: "10 mins", exercises: ["Goblet squat holds", "90/90 hip switches", "Glute bridges"] },
        exercises: [
          { id: "e5", name: "Barbell Back Squats (or Goblet Squats)", sets: 4, reps: "6", restSeconds: 120, difficulty: "Intermediate", targetMuscles: "Quadriceps, Glutes", notes: "Drive knees out in line with toes.", alternatives: ["Goblet Squats", "Leg Press"] },
          { id: "e6", name: "Romanian Deadlifts (RDLs)", sets: 3, reps: "8-10", restSeconds: 90, difficulty: "Intermediate", targetMuscles: "Hamstrings, Glutes", notes: "Hinge deep at hips.", alternatives: ["Dumbbell RDL", "Single-Leg RDL"] },
          { id: "e7", name: "Bulgarian Split Squats", sets: 3, reps: "10 per leg", restSeconds: 60, difficulty: "Advanced", targetMuscles: "Quads, Glutes", notes: "Elevate rear foot on bench.", alternatives: ["Walking Lunges", "Box Step-ups"] },
          { id: "e8", name: "Hanging Leg Raises", sets: 3, reps: "12", restSeconds: 45, difficulty: "Intermediate", targetMuscles: "Lower Abs", notes: "Avoid swinging.", alternatives: ["Lying Leg Raises", "Plank"] }
        ],
        cooldown: { duration: "7 mins", tips: "Couch stretch and seated hamstring reach." }
      },
      {
        dayNumber: 3,
        title: "Active Recovery & Mobility Flow",
        focus: "Zone 2 Cardio & Full Body Yoga",
        isRestDay: false,
        durationMinutes: 35,
        warmup: { duration: "5 mins", exercises: ["Cat-cow", "Spinal twists"] },
        exercises: [
          { id: "e9", name: "Zone 2 Low-Impact Cardio", sets: 1, reps: "25-30 mins", restSeconds: 0, difficulty: "Beginner", targetMuscles: "Aerobic Base", notes: "Conversational pace.", alternatives: ["Outdoor walk", "Stationary cycle", "Rowing"] },
          { id: "e10", name: "Yoga & Foam Rolling Routine", sets: 1, reps: "15 mins", restSeconds: 0, difficulty: "Beginner", targetMuscles: "Full Body Mobility", notes: "Hold stretches 30s each.", alternatives: ["Dynamic hip stretch"] }
        ],
        cooldown: { duration: "5 mins", tips: "Deep diaphragmatic breathing." }
      },
      {
        dayNumber: 4,
        title: "Shoulders & Arms Hypertrophy",
        focus: "Deltoids, Biceps & Triceps",
        isRestDay: false,
        durationMinutes: 48,
        warmup: { duration: "6 mins", exercises: ["Rotator cuff Y-T-W", "Arm circles"] },
        exercises: [
          { id: "e11", name: "Overhead Military Press", sets: 4, reps: "8", restSeconds: 90, difficulty: "Intermediate", targetMuscles: "Deltoids, Core", notes: "Strict lockout.", alternatives: ["Dumbbell Shoulder Press", "Arnold Press"] },
          { id: "e12", name: "Dumbbell Lateral Raises", sets: 4, reps: "12-15", restSeconds: 45, difficulty: "Beginner", targetMuscles: "Side Delts", notes: "Strict tempo, no swing.", alternatives: ["Cable Lateral Raises"] },
          { id: "e13", name: "Incline Dumbbell Bicep Curls", sets: 3, reps: "10", restSeconds: 60, difficulty: "Beginner", targetMuscles: "Biceps", notes: "Supinate at peak.", alternatives: ["Barbell Curls"] },
          { id: "e14", name: "Overhead Rope Tricep Extensions", sets: 3, reps: "12", restSeconds: 60, difficulty: "Beginner", targetMuscles: "Triceps", notes: "Flare rope at end.", alternatives: ["Skull Crushers", "Dips"] }
        ],
        cooldown: { duration: "5 mins", tips: "Shoulder cross-pull and tricep stretch." }
      },
      {
        dayNumber: 5,
        title: "Posterior Chain Power & Pull",
        focus: "Deadlifts, Upper Back & Hamstrings",
        isRestDay: false,
        durationMinutes: 52,
        warmup: { duration: "8 mins", exercises: ["Glute bridges", "Bird-dogs"] },
        exercises: [
          { id: "e15", name: "Conventional Deadlift", sets: 4, reps: "5", restSeconds: 120, difficulty: "Advanced", targetMuscles: "Posterior Chain, Glutes, Back", notes: "Drive the floor away.", alternatives: ["Trap Bar Deadlift", "Rack Pulls"] },
          { id: "e16", name: "Single-Arm Dumbbell Rows", sets: 3, reps: "10 per arm", restSeconds: 60, difficulty: "Intermediate", targetMuscles: "Lats, Rhomboids", notes: "Pull to hip pocket.", alternatives: ["Chest-Supported Rows"] },
          { id: "e17", name: "Hamstring Curls", sets: 3, reps: "12", restSeconds: 60, difficulty: "Beginner", targetMuscles: "Hamstrings", notes: "Control eccentric 3s.", alternatives: ["Nordic Curls", "Stability Ball Curls"] }
        ],
        cooldown: { duration: "7 mins", tips: "Pigeon pose and lower back child's pose." }
      },
      {
        dayNumber: 6,
        title: "Functional Conditioning & Core",
        focus: "Full Body Agility & Explosive Stamina",
        isRestDay: false,
        durationMinutes: 45,
        warmup: { duration: "7 mins", exercises: ["High knees", "Butt kicks", "Inchworms"] },
        exercises: [
          { id: "e18", name: "Kettlebell Swings", sets: 4, reps: "15", restSeconds: 45, difficulty: "Intermediate", targetMuscles: "Glutes, Core, Cardio", notes: "Explosive hip snap.", alternatives: ["Dumbbell Swings"] },
          { id: "e19", name: "Dumbbell Push Press or Thrusters", sets: 3, reps: "10", restSeconds: 60, difficulty: "Intermediate", targetMuscles: "Quads, Shoulders", notes: "Smooth kinetic link.", alternatives: ["Wall Balls"] },
          { id: "e20", name: "Plank with Shoulder Taps", sets: 3, reps: "40s", restSeconds: 45, difficulty: "Intermediate", targetMuscles: "Core Anti-Rotation", notes: "Keep pelvis still.", alternatives: ["Deadbugs"] }
        ],
        cooldown: { duration: "6 mins", tips: "Cobra stretch and slow nasal breathing." }
      },
      {
        dayNumber: 7,
        title: "Full Rest & Tissue Regeneration",
        focus: "Complete Central Nervous System Recovery",
        isRestDay: true,
        durationMinutes: 20,
        warmup: { duration: "None", exercises: [] },
        exercises: [
          { id: "e21", name: "Leisure Nature Walk & Sunshine", sets: 1, reps: "20-30 mins", restSeconds: 0, difficulty: "Beginner", targetMuscles: "Parasympathetic Tone", notes: "Zero strenuous training.", alternatives: ["Sauna session", "Epsom bath"] }
        ],
        cooldown: { duration: "10 mins", tips: "Prioritize 8+ hours of deep sleep." }
      }
    ],
    nutritionPlan,
    nutritionTip,
  };
}
