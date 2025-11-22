from pydantic import BaseModel,EmailStr
from datetime import date
class FeedbackCreate(BaseModel):
    FeedBackID: int
    Date: date 
    Rating: int
    Review: str
    EmailID: EmailStr
    PID: str


class FeedbackOut(BaseModel):
    FeedBackID: int
    Date: str
    Rating: int
    Review: str
    Upvotes: int
    EmailID: EmailStr
    PID: str