from pydantic import BaseModel, EmailStr

class StudentCreate(BaseModel):
    EnrollmentNo: str
    Course: str
    Batch: str
    EmailID: EmailStr

class StudentOut(BaseModel):
    EnrollmentNo: str
    Course: str
    Batch: str
    EmailID: EmailStr
