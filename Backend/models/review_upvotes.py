from pydantic import BaseModel, EmailStr

class ReviewUpvoteCreate(BaseModel):
    FeedBackID: int
    VoterEmail: EmailStr

class ReviewUpvoteOut(BaseModel):
    UpvoteID: int
    FeedBackID: int
    VoterEmail: EmailStr
