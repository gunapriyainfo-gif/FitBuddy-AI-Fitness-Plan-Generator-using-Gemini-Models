"""
nutrition.py - Handles nutrition-specific logic.
Provides nutritional calculations, calorie targets, and dietary guidance.
"""

def calculate_macros(weight_kg: float, goal: str):
    """
    Calculates estimated daily calorie targets and macronutrient distributions
    based on body weight and fitness goal.
    """
    goal_clean = (goal or "").strip().lower()

    if "muscle" in goal_clean:
        calories = weight_kg * 34
        protein = weight_kg * 2.2
        fats = weight_kg * 0.9
    elif "loss" in goal_clean:
        calories = weight_kg * 24
        protein = weight_kg * 2.0
        fats = weight_kg * 0.7
    else:  # general fitness / endurance
        calories = weight_kg * 30
        protein = weight_kg * 1.6
        fats = weight_kg * 0.8

    carbs = max(0.0, (calories - (protein * 4 + fats * 9)) / 4)
    water_liters = round(weight_kg * 0.035, 1)

    return {
        "daily_calories": round(calories),
        "protein_g": round(protein),
        "carbs_g": round(carbs),
        "fats_g": round(fats),
        "water_liters": water_liters
    }
