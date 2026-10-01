from pydantic import BaseModel, Field
from typing import Optional


class WorkoutRequest(BaseModel):
    goal: str
    intensity: str


class UserInput(BaseModel):
    user_id: int
    username: str
    age: int
    weight: float
    goal: str
    intensity: str


class FeedbackRequest(BaseModel):
    feedback: str


class UserCreate(BaseModel):
    user_id: int = Field(..., ge=1, description="Unique user identifier")
    name: str = Field(..., min_length=1, description="User's full name")
    age: int = Field(..., ge=1, le=120, description="Age in years")
    weight: float = Field(..., ge=1.0, description="Weight in kg")
    goal: str = Field(..., description="Fitness goal: muscle gain, weight loss, etc.")
    intensity: str = Field(..., description="Workout intensity: low, medium, high")


class PlanUpdateRequest(BaseModel):
    user_id: int = Field(..., ge=1, description="User ID for which to update the plan")
    feedback: str = Field(..., min_length=1, description="User feedback to refine the plan")


class UserResponse(BaseModel):
    id: int
    name: str
    age: int
    weight: float
    goal: str
    intensity: str
    schedule: int

    class Config:
        from_attributes = True


class WorkoutPlanResponse(BaseModel):
    user_id: int
    original_plan: str
    updated_plan: Optional[str] = None

    class Config:
        from_attributes = True
