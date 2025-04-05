from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

class User(BaseModel):
    id: Optional[int] = None
    email: str
    role: str
    access_id: int
    company_id: Optional[int] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    access_id: Optional[int] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Notification(BaseModel):
    id: int
    message: str
    created_at: str
    is_read: bool

class IOUser(BaseModel):
    id: int
    email: str
    office: str

class RouteHistory(BaseModel):
    id: int
    method: str
    recipient: str
    office: Optional[str] = None
    date: str
    message: str
    status: str

class ComplaintFile(BaseModel):
    type: str
    url: str

class Complaint(BaseModel):
    id: Optional[int] = None
    ticket_number: str
    reference_number: Optional[int] = None
    is_urgent: bool
    is_anonymous: bool
    mobile_number: Optional[str] = None
    date_of_issue: Optional[str] = None
    complaint_categories: str
    additional_comments: str
    person_issue: Optional[str] = None
    concerned_department: Optional[str] = None
    previous_history: Optional[str] = None
    proposed_solution: Optional[str] = None
    status: str
    employee_name: Optional[str] = None
    date_entry: str
    in_process_date: Optional[str] = None
    capa_date: Optional[str] = None
    rca_date: Optional[str] = None
    capa: Optional[str] = None
    rca: Optional[str] = None
    closed_date: Optional[str] = None
    bounced_date: Optional[str] = None
    capa1_date: Optional[str] = None
    capa2_date: Optional[str] = None
    capa3_date: Optional[str] = None
    rca1_date: Optional[str] = None
    rca2_date: Optional[str] = None
    rca3_date: Optional[str] = None
    bounced1_date: Optional[str] = None
    bounced2_date: Optional[str] = None
    bounced3_date: Optional[str] = None
    capa1: Optional[str] = None
    capa2: Optional[str] = None
    capa3: Optional[str] = None
    rca1: Optional[str] = None
    rca2: Optional[str] = None
    rca3: Optional[str] = None
    completed_date: Optional[str] = None
    gender: Optional[str] = None
    designation: Optional[str] = None
    feedback: Optional[str] = None
    feedback1: Optional[str] = None
    rca_deadline: Optional[str] = None
    rca1_deadline: Optional[str] = None
    rca2_deadline: Optional[str] = None
    lodged_by_agent: Optional[bool] = None
    lodged_from_web: Optional[bool] = None
    close_feedback: Optional[str] = None
    proof_files: Optional[List[ComplaintFile]] = []
    capa_files: Optional[List[ComplaintFile]] = []
    capa1_files: Optional[List[ComplaintFile]] = []
    office_name: Optional[str] = None
    company_name: Optional[str] = None

class ComplaintCreate(BaseModel):
    employee_id: int
    is_urgent: bool
    is_anonymous: bool
    mobile_number: Optional[str] = None
    date_of_issue: Optional[str] = None
    complaint_categories: str
    additional_comments: str
    person_issue: Optional[str] = None
    concerned_department: Optional[str] = None
    previous_history: Optional[str] = None
    proposed_solution: Optional[str] = None

