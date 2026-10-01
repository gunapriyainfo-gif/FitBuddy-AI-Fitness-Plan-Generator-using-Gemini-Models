import express, { Request, Response } from 'express';
import {
  saveUser,
  savePlan,
  updatePlan,
  getOriginalPlan,
  getWorkoutPlan,
  getUser,
  getAllUsers,
  getAllUsersWithPlans,
  deleteUser,
  logWorkoutSession,
  getWorkoutHistory,
  logProgressEntry,
  getProgressLogs,
  addChatMessage,
  getChatHistory,
} from './storage';
import {
  generateComprehensiveFitnessPlan,
  getExerciseAlternatives,
  askFitnessCoach,
  dynamicPlanAdjustment,
} from './gemini';

export const apiRouter = express.Router();

apiRouter.use(express.json());
apiRouter.use(express.urlencoded({ extended: true }));

// 1. Generate Comprehensive Fitness & Nutrition Plan
apiRouter.post('/generate-plan', async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      userId,
      username,
      name,
      age,
      weight,
      height,
      gender,
      goal,
      intensity,
      fitnessLevel,
      equipment,
      workoutPreferences,
      injuries,
    } = req.body;

    const finalUserId = Number(user_id || userId);
    const finalName = username || name || 'Athlete';
    const finalAge = Number(age || 28);
    const finalWeight = Number(weight || 75);
    const finalHeight = Number(height || 175);
    const finalGender = gender || 'unspecified';
    const finalGoal = goal || 'general fitness';
    const finalIntensity = intensity || 'medium';
    const finalFitnessLevel = fitnessLevel || 'intermediate';
    const finalEquipment = Array.isArray(equipment) ? equipment : [];
    const finalPreferences = Array.isArray(workoutPreferences) ? workoutPreferences : [];

    if (!finalUserId || isNaN(finalUserId)) {
      return res.status(400).json({ error: 'Valid user_id is required' });
    }

    // 1. Save / Update User in Database
    const savedUser = saveUser(
      finalUserId,
      finalName,
      finalAge,
      finalWeight,
      finalGoal,
      finalIntensity,
      {
        height: finalHeight,
        gender: finalGender,
        fitnessLevel: finalFitnessLevel,
        equipment: finalEquipment,
        workoutPreferences: finalPreferences,
        injuries: injuries || '',
      }
    );

    // 2. Generate Plan via Gemini
    const planResult = await generateComprehensiveFitnessPlan({
      name: finalName,
      age: finalAge,
      weight: finalWeight,
      height: finalHeight,
      gender: finalGender,
      goal: finalGoal,
      intensity: finalIntensity,
      fitnessLevel: finalFitnessLevel,
      equipment: finalEquipment,
      workoutPreferences: finalPreferences,
      injuries,
    });

    // 3. Save to Database
    const savedPlan = savePlan(
      finalUserId,
      planResult.textPlan,
      planResult.nutritionTip,
      planResult.structuredDays,
      planResult.nutritionPlan
    );

    // Also seed an initial baseline weight progress log if none exists
    const existingLogs = getProgressLogs(finalUserId);
    if (existingLogs.length === 0) {
      logProgressEntry({
        userId: finalUserId,
        date: new Date().toISOString().split('T')[0],
        weight: finalWeight,
        notes: 'Initial plan creation baseline',
      });
    }

    return res.json({
      status: 'success',
      message: 'Comprehensive fitness plan and nutrition blueprint generated successfully!',
      user_id: savedUser.id,
      name: savedUser.name,
      username: savedUser.name,
      age: savedUser.age,
      weight: savedUser.weight,
      height: savedUser.height,
      goal: savedUser.goal,
      intensity: savedUser.intensity,
      workout_plan: planResult.textPlan,
      nutrition_tip: planResult.nutritionTip,
      structuredDays: planResult.structuredDays,
      nutritionPlan: planResult.nutritionPlan,
      plan_id: savedPlan.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

// 2. AI Fitness Chatbot Endpoint ("Ask FitCoach")
apiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { userId, message } = req.body;
    const finalUserId = Number(userId || 101);
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message string is required' });
    }

    // Save user's question to chat history
    addChatMessage(finalUserId, 'user', message);

    const user = getUser(finalUserId);
    const workoutPlan = getWorkoutPlan(finalUserId);
    const history = getWorkoutHistory(finalUserId);

    // Call FitCoach AI
    const coachResponse = await askFitnessCoach(message, {
      user,
      workoutPlan,
      history,
    });

    // Save assistant answer
    const assistantMsg = addChatMessage(
      finalUserId,
      'assistant',
      coachResponse.answer,
      coachResponse.suggestedAction
    );

    return res.json({
      reply: coachResponse.answer,
      messageId: assistantMsg.id,
      timestamp: assistantMsg.timestamp,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

apiRouter.get('/chat/history/:userId', (req: Request, res: Response) => {
  try {
    const uid = Number(req.params.userId);
    const history = getChatHistory(uid);
    return res.json(history);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

// 3. Exercise Alternatives Finder
apiRouter.post('/exercise/alternatives', async (req: Request, res: Response) => {
  try {
    const { exerciseName, equipment, reason } = req.body;
    if (!exerciseName) {
      return res.status(400).json({ error: 'exerciseName is required' });
    }
    const result = await getExerciseAlternatives(
      exerciseName,
      equipment || [],
      reason || 'equipment unavailable'
    );
    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

// 4. Workout Session Completion & History
apiRouter.post('/workout/complete', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      dayNumber,
      dayTitle,
      durationMinutes,
      rpe,
      difficultyRating,
      notes,
      completedExercises,
    } = req.body;

    const finalUserId = Number(userId || 101);
    const log = logWorkoutSession({
      userId: finalUserId,
      dayNumber: Number(dayNumber || 1),
      dayTitle: dayTitle || `Day ${dayNumber}`,
      durationMinutes: Number(durationMinutes || 45),
      rpe: Number(rpe || 7),
      difficultyRating: difficultyRating || 'just_right',
      notes: notes || '',
      completedExercises: Array.isArray(completedExercises) ? completedExercises : [],
    });

    // If rated 'too_hard' or 'too_easy', trigger dynamic recalibration
    let calibrationNote = null;
    const currentPlan = getWorkoutPlan(finalUserId);
    if (currentPlan && (difficultyRating === 'too_hard' || difficultyRating === 'too_easy')) {
      const adjusted = await dynamicPlanAdjustment(currentPlan, {
        completedDay: Number(dayNumber),
        difficultyRating,
        rpe: Number(rpe),
      });

      updatePlan(
        finalUserId,
        adjusted.updatedText,
        `Auto-calibrated after Day ${dayNumber} (RPE ${rpe}/10: ${difficultyRating.replace('_', ' ')})`,
        adjusted.nutritionTip,
        adjusted.updatedStructuredDays
      );
      calibrationNote = `Plan has been dynamically calibrated based on your ${difficultyRating.replace('_', ' ')} feedback.`;
    }

    return res.json({
      status: 'success',
      message: 'Workout session logged successfully!',
      log,
      calibrationNote,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

apiRouter.get('/workout/history/:userId', (req: Request, res: Response) => {
  try {
    const uid = Number(req.params.userId);
    const history = getWorkoutHistory(uid);
    return res.json(history);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

// 5. Body Weight & Measurement Progress Tracking
apiRouter.post('/progress/log', (req: Request, res: Response) => {
  try {
    const { userId, date, weight, waistCm, chestCm, notes } = req.body;
    const finalUserId = Number(userId || 101);
    if (!weight) {
      return res.status(400).json({ error: 'weight is required' });
    }

    const entry = logProgressEntry({
      userId: finalUserId,
      date: date || new Date().toISOString().split('T')[0],
      weight: Number(weight),
      waistCm: waistCm ? Number(waistCm) : undefined,
      chestCm: chestCm ? Number(chestCm) : undefined,
      notes: notes || '',
    });

    return res.json({
      status: 'success',
      message: 'Progress recorded successfully!',
      entry,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

apiRouter.get('/progress/:userId', (req: Request, res: Response) => {
  try {
    const uid = Number(req.params.userId);
    const logs = getProgressLogs(uid);
    return res.json(logs);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

// 6. Dynamic Plan Revision via Feedback
apiRouter.post(['/update-plan/:user_id', '/update-plan'], async (req: Request, res: Response) => {
  try {
    const paramId = req.params.user_id;
    const bodyId = req.body.user_id || req.body.userId;
    const finalUserId = Number(paramId || bodyId);
    const feedback = req.body.feedback || '';

    if (!finalUserId || isNaN(finalUserId)) {
      return res.status(400).json({ error: 'Valid user_id is required' });
    }
    if (!feedback.trim()) {
      return res.status(400).json({ error: 'Feedback text is required' });
    }

    const currentPlan = getWorkoutPlan(finalUserId);
    if (!currentPlan) {
      return res.status(404).json({ error: 'Workout plan not found for this user.' });
    }

    const adjusted = await dynamicPlanAdjustment(currentPlan, {
      feedback: feedback.trim(),
    });

    updatePlan(
      finalUserId,
      adjusted.updatedText,
      feedback.trim(),
      adjusted.nutritionTip,
      adjusted.updatedStructuredDays
    );

    return res.json({
      status: 'success',
      message: 'Workout plan updated successfully!',
      user_id: finalUserId,
      original_plan: currentPlan.originalPlan,
      updated_plan: adjusted.updatedText,
      nutrition_tip: adjusted.nutritionTip,
      structuredDays: adjusted.updatedStructuredDays || currentPlan.structuredDays,
      feedback,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

// 7. Directory & Admin routes
apiRouter.get(['/view-all-users', '/users'], (_req: Request, res: Response) => {
  try {
    const records = getAllUsersWithPlans();
    return res.json(records);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

apiRouter.get('/users/:user_id', (req: Request, res: Response) => {
  try {
    const uid = Number(req.params.user_id);
    const user = getUser(uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const plan = getWorkoutPlan(uid);
    return res.json({
      user,
      plan,
      original_plan: plan?.originalPlan,
      updated_plan: plan?.updatedPlan,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

apiRouter.delete('/users/:user_id', (req: Request, res: Response) => {
  try {
    const uid = Number(req.params.user_id);
    deleteUser(uid);
    return res.json({ success: true, message: `User #${uid} deleted` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

// 8. Backward compatibility routes
apiRouter.post('/generate-workout/gemini', async (req: Request, res: Response) => {
  try {
    const { goal, intensity, username, name } = req.body;
    const planResult = await generateComprehensiveFitnessPlan({
      goal: goal || 'general fitness',
      intensity: intensity || 'medium',
      name: username || name || 'Athlete',
    });
    return res.json({
      model: 'gemini-3.8-flash',
      workout_plan: planResult.textPlan,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

apiRouter.get('/nutrition-tip', (_req: Request, res: Response) => {
  return res.json({
    nutrition_tip: 'Prioritize 1.8-2.2g of protein per kg of bodyweight, drink at least 3 liters of water, and recover with 7-9 hours of sleep.',
  });
});
