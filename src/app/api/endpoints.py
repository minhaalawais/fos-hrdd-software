from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.security import OAuth2PasswordBearer
from typing import List, Dict, Any, Optional
import logging
import mysql.connector
from datetime import datetime
import json
import os
from app.core.database import get_retryable_connection
from app.core.security import get_current_user
from app.models.models import Complaint, ComplaintCreate, User, Notification, IOUser, RouteHistory
from app.services.email_service import send_email,send_timeline_email
from app.services.sms_service import send_sms

router = APIRouter()
logger = logging.getLogger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

@router.get("/io_portal_json", response_model=Dict[str, List[Any]])
async def get_complaints(current_user: User = Depends(get_current_user)):
    """
    Get all complaints for the IO portal
    """
    try:
        # Get the company_id from the current user
        company_id = current_user.get("company_id") or current_user.get("access_id")
        if not company_id:
            raise HTTPException(status_code=400, detail="Company ID not found in user data")
        
        # Get complaints data using the same logic as the Flask route
        complaints_data = get_data_from_database(company_id)
        
        return {"data": complaints_data}
    
    except Exception as e:
        logger.error(f"Error in get_complaints: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving complaints: {str(e)}")
@router.get("/get_complaint_files/{ticket_number}/{file_category}")
async def get_complaint_files(
    ticket_number: str, 
    file_category: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get files for a specific complaint and category
    
    file_category can be 'proof', 'capa', 'capa1', etc.
    Returns the actual file data as base64 encoded strings
    """
    try:
        # Validate file_category
        if file_category not in ['proof', 'capa', 'capa1', 'capa2', 'capa3']:
            raise HTTPException(status_code=400, detail="Invalid file category")
        
        files = []
        
        # Also check for files in the static directory (legacy files)
        static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static")
        images_dir = os.path.join(static_dir, "images", "capa_images")
        
        # Ensure the directory exists
        if os.path.exists(images_dir):
            # Check for old format files
            old_format_extensions = ['.png', '.jpg', '.jpeg', '.pdf', '.mp4']
            for ext in old_format_extensions:
                file_path = os.path.join(images_dir, f"{ticket_number}_{file_category}{ext}")
                if os.path.exists(file_path):
                    try:
                        # Read file and encode as base64
                        with open(file_path, "rb") as file:
                            file_data = file.read()
                            import base64
                            base64_data = base64.b64encode(file_data).decode('utf-8')
                            
                            # Determine content type and file type
                            content_type = "image/jpeg"
                            file_type = "image"
                            if ext == '.pdf':
                                content_type = "application/pdf"
                                file_type = "pdf"
                            elif ext in ['.mp4', '.avi', '.mov']:
                                content_type = "video/mp4"
                                file_type = "video"
                            
                            # Add file to list
                            files.append({
                                "type": file_type,
                                "url": f"data:{content_type};base64,{base64_data}",
                                "filename": os.path.basename(file_path)
                            })
                    except Exception as e:
                        logger.error(f"Error processing file {file_path}: {e}")
            
            # Check for new format files
            for i in range(1, 4):  # Check for up to 3 files per category
                for ext in old_format_extensions:
                    file_path = os.path.join(images_dir, f"{ticket_number}_{file_category}_{i}{ext}")
                    if os.path.exists(file_path):
                        try:
                            # Read file and encode as base64
                            with open(file_path, "rb") as file:
                                file_data = file.read()
                                import base64
                                base64_data = base64.b64encode(file_data).decode('utf-8')
                                
                                # Determine content type and file type
                                content_type = "image/jpeg"
                                file_type = "image"
                                if ext == '.pdf':
                                    content_type = "application/pdf"
                                    file_type = "pdf"
                                elif ext in ['.mp4', '.avi', '.mov']:
                                    content_type = "video/mp4"
                                    file_type = "video"
                                
                                # Add file to list
                                files.append({
                                    "type": file_type,
                                    "url": f"data:{content_type};base64,{base64_data}",
                                    "filename": os.path.basename(file_path)
                                })
                        except Exception as e:
                            logger.error(f"Error processing file {file_path}: {e}")
        
        return {"files": files}
    
    except Exception as e:
        logger.error(f"Error in get_complaint_files: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving files: {str(e)}")



@router.post("/share_complaint_timeline")
async def share_complaint_timeline(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Share complaint timeline via email
    """
    try:
        data = await request.json()
        email = data.get("email")
        subject = data.get("subject")
        complaint_id = data.get("complaintId")
        html_content = data.get("html")
        css_content = data.get("css")
        
        if not email or not subject or not complaint_id or not html_content:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Use the specialized function to send the timeline email
        email_sent = await send_timeline_email(
            email, 
            subject, 
            complaint_id, 
            html_content, 
            css_content
        )
        
        if email_sent:
            
            return {"success": True, "message": "Timeline shared successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
    
    except Exception as e:
        logger.error(f"Error in share_complaint_timeline: {e}")
        raise HTTPException(status_code=500, detail=f"Error sharing timeline: {str(e)}")\
        
def get_data_from_database(your_company_id):
    conn = get_retryable_connection('io')
    cursor = conn.cursor()
    
    # Base query for all complaint fields
    base_query = """
    SELECT 
        c.complaint_no, c.ticket_number, c.reference_number, c.is_urgent, c.is_anonymous,
        c.mobile_number, c.date_of_issue, c.complaint_categories, c.additional_comments,
        c.person_issue, c.concerned_department, c.previous_history, c.proposed_solution,
        c.status, e.employee_name, c.date_entry, c.in_process_date, c.capa_date, c.rca_date,
        c.capa, c.rca, c.closed_date, c.bounced_date, c.capa1_date, c.capa2_date, c.capa3_date,
        c.rca1_date, c.rca2_date, c.rca3_date, c.bounced1_date, c.bounced2_date, c.bounced3_date,
        c.capa1, c.capa2, c.capa3, c.rca1, c.rca2, c.rca3, c.completed_date, e.gender,
        e.designation, c.feedback, c.feedback1, c.rca_deadline, c.rca1_deadline, c.rca2_deadline,
        c.lodged_by_agent, c.lodged_from_web, c.close_feedback
    FROM complaints c
    JOIN employees e ON c.reference_number = e.employee_id
    """
    
    # Define company-specific conditions
    company_conditions = {
        70: "e.office_id IN (60,61,62,63,64,65,66,67,68,69,70,71,221,222,223,233,234,235,236)",
        68: "e.office_id IN (60,61,62,63,64,65,66,67,68,69,70,71,221,222,223,233,234,235,236) "
            "AND (LOWER(c.rca) LIKE '%please route this complaint to finance team%' "
            "OR LOWER(c.rca1) LIKE '%please route this complaint to finance team%')",
        69: "e.office_id IN (60,61,62,63,64,65,66,67,68,69,70,71,221,222,223,233,234,235,236) "
            "AND (LOWER(c.rca) LIKE '%please route this complaint to opertations team%' "
            "OR LOWER(c.rca1) LIKE '%please route this complaint to opertations team%')",
        73: "e.office_id BETWEEN 72 AND 110 AND c.complaint_categories != 'Workplace Health, Safety and Environment' "
            "AND e.temp_data = 'Corporate Office Raya'",
        74: "e.office_id BETWEEN 72 AND 110 AND c.complaint_categories != 'Workplace Health, Safety and Environment' "
            "AND e.temp_data IN ('Manga Plant','(QAIE) Plant','Kamahan','Muridke Plant')",
        75: "e.office_id BETWEEN 72 AND 110 AND c.complaint_categories != 'Workplace Health, Safety and Environment' "
            "AND e.temp_data NOT IN ('Corporate Office Raya','Manga Plant','(QAIE) Plant','Kamahan','Muridke Plant')",
        76: "e.office_id BETWEEN 72 AND 110 AND c.complaint_categories = 'Workplace Health, Safety and Environment'",
        139: "e.office_id IN (124,125,127,131,128,132,133,139)",
        134: "e.office_id IN (134,135,136,123,126,129,130)",
        137: "e.office_id IN (137,138,140)",
        146: "(e.office_id BETWEEN 146 AND 180 OR e.office_id = 144) AND LOWER(e.gender) = 'female' "
             "AND LOWER(c.additional_comments) NOT LIKE '%dormitory complaint%' "
             "OR (c.complaint_categories = 'Harassment' AND (e.office_id BETWEEN 146 AND 180 OR e.office_id = 144) "
             "AND LOWER(c.additional_comments) NOT LIKE '%dormitory complaint%')",
        147: "(e.office_id BETWEEN 146 AND 180 OR e.office_id = 144) AND LOWER(e.gender) = 'male' "
             "AND c.reference_number BETWEEN 15100 AND 153178 AND c.complaint_categories != 'Harassment' "
             "AND LOWER(c.additional_comments) NOT LIKE '%dormitory complaint%'",
        148: "(e.office_id BETWEEN 146 AND 180 OR e.office_id = 144) AND LOWER(e.gender) = 'male' "
             "AND c.reference_number BETWEEN 153178 AND 158976 AND c.complaint_categories != 'Harassment' "
             "AND LOWER(c.additional_comments) NOT LIKE '%dormitory complaint%'",
        149: "(e.office_id BETWEEN 146 AND 180 OR e.office_id = 144) AND LOWER(c.additional_comments) LIKE '%dormitory complaint%'",
        181: "e.office_id BETWEEN 181 AND 187",
        199: "e.office_id IN (199,200)",
        212: "e.office_id BETWEEN 212 AND 220 AND e.gender = 'Male'",
        213: "e.office_id BETWEEN 212 AND 220 AND e.gender = 'Female'",
        245: "e.office_id IN (243,244,245,246,247)",
        280: "e.office_id BETWEEN 280 AND 314"
    }
    
    # Get complaints directly assigned to the company
    if your_company_id in company_conditions:
        query = f"{base_query} WHERE {company_conditions[your_company_id]} AND c.status NOT IN ('Unapproved','Rejected')"
    else:
        query = f"{base_query} WHERE e.office_id = %s AND c.status NOT IN ('Unapproved','Rejected')"
    
    cursor.execute(query, () if your_company_id in company_conditions else (your_company_id,))
    complaints_data = cursor.fetchall()
    
    # Get complaints that have been routed to this company
    routed_query = f"""
    {base_query}
    JOIN complaint_routes cr ON c.ticket_number = cr.ticket_number
    WHERE cr.to_user_id = %s 
    AND cr.from_user_id != %s
    AND cr.status = 'pending'
    AND c.status NOT IN ('Unapproved','Rejected')
    """
    cursor.execute(routed_query, (your_company_id, your_company_id))
    routed_complaints_data = cursor.fetchall()
    
    # Combine both sets of complaints
    all_complaints = complaints_data + routed_complaints_data
    
    # Process complaints into dictionary format
    fetched_complaints = []
    for complaint in all_complaints:
        # Handle anonymous complaints
        if complaint[4]:  # is_anonymous
            employee_name = 'Anonymous'
            mobile_number = 'N/A'
            designation = ''
        else:
            employee_name = complaint[14]
            mobile_number = complaint[5]
            designation = complaint[40]
        
        # Get office and company info
        cursor.execute("""
            SELECT o.company_id, o.office_name, co.name 
            FROM offices o
            JOIN companies co ON o.company_id = co.company_id
            WHERE o.office_id IN (
                SELECT office_id FROM employees WHERE employee_id = %s
            )
        """, (complaint[2],))  # reference_number
        office_info = cursor.fetchone()
        
        office_name = office_info[1] if office_info else None
        company_name = office_info[2] if office_info else None
        
        # Convert dates to formatted strings
        def format_date(dt):
            if isinstance(dt, datetime):
                return dt.strftime('%a, %d %b %Y %I:%M %p')
            return None
        
        complaint_dict = {
            "ticket_number": complaint[1],
            "is_urgent": complaint[3],
            "is_anonymous": complaint[4],
            "mobile_number": mobile_number,
            "date_of_issue": format_date(complaint[6]),
            "complaint_categories": complaint[7],
            "additional_comments": complaint[8],
            "person_issue": complaint[9],
            "concerned_department": complaint[10],
            "previous_history": complaint[11],
            "proposed_solution": complaint[12],
            "status": 'Submitted' if complaint[13] == 'Closed' else complaint[13],
            "employee_name": employee_name,
            "date_entry": format_date(complaint[15]),
            "in_process_date": format_date(complaint[16]),
            "capa_date": format_date(complaint[17]),
            "rca_date": format_date(complaint[18]),
            "capa": complaint[19],
            "rca": complaint[20],
            "closed_date": format_date(complaint[21]),
            "bounced_date": format_date(complaint[22]),
            "capa1_date": format_date(complaint[23]),
            "capa2_date": format_date(complaint[24]),
            "capa3_date": format_date(complaint[25]),
            "rca1_date": format_date(complaint[26]),
            "rca2_date": format_date(complaint[27]),
            "rca3_date": format_date(complaint[28]),
            "bounced1_date": format_date(complaint[29]),
            "bounced2_date": format_date(complaint[30]),
            "bounced3_date": format_date(complaint[31]),
            "capa1": complaint[32],
            "capa2": complaint[33],
            "capa3": complaint[34],
            "rca1": complaint[35],
            "rca2": complaint[36],
            "rca3": complaint[37],
            "office_name": office_name,
            "company_name": company_name,
            "completed_date": format_date(complaint[38]),
            "gender": complaint[39],
            "designation": designation,
            "feedback": complaint[41],
            "feedback1": complaint[42],
            "capa_deadline": format_date(complaint[43]),
            "capa_deadline1": format_date(complaint[44]),
            "capa_deadline2": format_date(complaint[45]),
            "lodged_by_agent": complaint[46],
            "lodged_from_web": complaint[47],
            "closed_feedback": complaint[48]
        }
        
        fetched_complaints.append(complaint_dict)
    
    cursor.close()
    conn.close()
    return fetched_complaints

@router.post("/submit_form")
async def submit_complaint_form(
    ticket: str = Form(...),
    rca: Optional[str] = Form(None),
    capa: Optional[str] = Form(None),
    capa_deadline: Optional[str] = Form(None),
    rca1: Optional[str] = Form(None),
    capa1: Optional[str] = Form(None),
    capa_deadline1: Optional[str] = Form(None),
    rca2: Optional[str] = Form(None),
    capa2: Optional[str] = Form(None),
    capa_deadline2: Optional[str] = Form(None),
    files: List[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    """
    Submit complaint form with RCA, CAPA, and files
    """
    try:
        conn = get_retryable_connection('io')
        cursor = conn.cursor()
        
        # Get complaint ID from ticket number
        cursor.execute("SELECT id FROM complaints WHERE ticket_number = %s", (ticket,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        complaint_id = result[0]
        
        # Update complaint with form data
        update_fields = []
        update_values = []
        
        if rca is not None:
            update_fields.append("rca = %s")
            update_values.append(rca)
            update_fields.append("rca_date = %s")
            update_values.append(datetime.now())
        
        if capa is not None:
            update_fields.append("capa = %s")
            update_values.append(capa)
            update_fields.append("capa_date = %s")
            update_values.append(datetime.now())
        
        if capa_deadline is not None:
            update_fields.append("capa_deadline = %s")
            update_values.append(capa_deadline)
        
        if rca1 is not None:
            update_fields.append("rca1 = %s")
            update_values.append(rca1)
            update_fields.append("rca1_date = %s")
            update_values.append(datetime.now())
        
        if capa1 is not None:
            update_fields.append("capa1 = %s")
            update_values.append(capa1)
            update_fields.append("capa1_date = %s")
            update_values.append(datetime.now())
        
        if capa_deadline1 is not None:
            update_fields.append("capa_deadline1 = %s")
            update_values.append(capa_deadline1)
        
        if rca2 is not None:
            update_fields.append("rca2 = %s")
            update_values.append(rca2)
            update_fields.append("rca2_date = %s")
            update_values.append(datetime.now())
        
        if capa2 is not None:
            update_fields.append("capa2 = %s")
            update_values.append(capa2)
            update_fields.append("capa2_date = %s")
            update_values.append(datetime.now())
        
        if capa_deadline2 is not None:
            update_fields.append("capa_deadline2 = %s")
            update_values.append(capa_deadline2)
        
        # Update status based on what's being updated
        if capa is not None and rca is not None:
            update_fields.append("status = %s")
            update_values.append("Submitted")
        elif rca is not None:
            update_fields.append("status = %s")
            update_values.append("In Process")
        
        if update_fields:
            query = f"UPDATE complaints SET {', '.join(update_fields)} WHERE id = %s"
            update_values.append(complaint_id)
            cursor.execute(query, update_values)
        
        # Handle file uploads
        if files:
            upload_dir = "uploads"
            os.makedirs(upload_dir, exist_ok=True)
            
            for file in files:
                if file.filename:
                    # Determine file category based on form field
                    file_category = "proof"  # Default
                    if rca is not None and capa is not None:
                        file_category = "capa"
                    elif rca1 is not None and capa1 is not None:
                        file_category = "capa1"
                    elif rca2 is not None and capa2 is not None:
                        file_category = "capa2"
                    
                    # Determine file type
                    file_extension = os.path.splitext(file.filename)[1].lower()
                    if file_extension in ['.jpg', '.jpeg', '.png', '.gif']:
                        file_type = "image"
                    elif file_extension == '.pdf':
                        file_type = "pdf"
                    elif file_extension in ['.mp4', '.avi', '.mov']:
                        file_type = "video"
                    else:
                        file_type = "other"
                    
                    # Save file
                    file_path = os.path.join(upload_dir, f"{ticket}_{datetime.now().strftime('%Y%m%d%H%M%S')}{file_extension}")
                    with open(file_path, "wb") as buffer:
                        buffer.write(await file.read())
                    
                    # Save file info to database
                    cursor.execute(
                        "INSERT INTO complaint_files (complaint_id, file_category, file_type, file_url) VALUES (%s, %s, %s, %s)",
                        (complaint_id, file_category, file_type, file_path)
                    )
        
        conn.commit()
        return {"success": True, "message": "Form submitted successfully"}
    
    except mysql.connector.Error as e:
        logger.error(f"Database error in submit_complaint_form: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

@router.get("/get_user_notifications}", response_model=List[Notification])
async def get_user_notifications(current_user: User = Depends(get_current_user)):
    """
    Get notifications for a user
    """
    company_id = current_user.get("company_id") or current_user.get("access_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="Company ID not found in user data")
    try:
        conn = get_retryable_connection('io')
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT id, message, created_at, is_read
        FROM notifications
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 50
        """
        cursor.execute(query, (company_id,))
        notifications = cursor.fetchall()
        
        # Format dates
        for notification in notifications:
            notification["created_at"] = notification["created_at"].isoformat()
        
        return notifications
    
    except mysql.connector.Error as e:
        logger.error(f"Database error in get_user_notifications: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

@router.post("/update_user_notifications")
async def update_user_notifications(request: Request, current_user: User = Depends(get_current_user)):
    """
    Mark user notifications as read
    """
    company_id = current_user.get("company_id") or current_user.get("access_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="Company ID not found in user data")
    try:
        
        if not company_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        conn = get_retryable_connection('io')
        cursor = conn.cursor()
        
        query = "UPDATE notifications SET is_read = 1 WHERE user_id = %s"
        cursor.execute(query, (company_id,))
        conn.commit()
        
        return {"success": True, "message": "Notifications updated successfully"}
    
    except mysql.connector.Error as e:
        logger.error(f"Database error in update_user_notifications: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

@router.get("/get_io_users", response_model=List[IOUser])
async def get_io_users(current_user: User = Depends(get_current_user)):
    """
    Get all IO users for routing complaints
    """
    try:
        conn = get_retryable_connection('io')
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT l.access_id as id, l.email, o.name as office
        FROM logins l
        LEFT JOIN offices o ON l.office_id = o.id
        WHERE l.role = 'io'
        ORDER BY l.email
        """
        cursor.execute(query)
        users = cursor.fetchall()
        
        return users
    
    except mysql.connector.Error as e:
        logger.error(f"Database error in get_io_users: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

@router.post("/route_via_email")
async def route_complaint_via_email(request: Request, current_user: User = Depends(get_current_user)):
    """
    Route a complaint via email
    """
    try:
        data = await request.json()
        complaint_id = data.get("complaint_id")
        recipient = data.get("recipient")
        message = data.get("message", "")
        
        if not complaint_id or not recipient:
            raise HTTPException(status_code=400, detail="Complaint ID and recipient are required")
        
        # Get complaint details
        conn = get_retryable_connection('io')
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM complaints WHERE ticket_number = %s", (complaint_id,))
        complaint = cursor.fetchone()
        
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        # Send email
        subject = f"Complaint Routing: {complaint_id}"
        body = f"""
        <h2>Complaint Routing</h2>
        <p>Ticket Number: {complaint_id}</p>
        <p>Category: {complaint.get('complaint_categories', 'N/A')}</p>
        <p>Message: {message}</p>
        <p>Please review and take appropriate action.</p>
        """
        
        email_sent = await send_email(recipient, subject, body)
        
        if email_sent:
            # Record routing in database
            cursor.execute(
                """
                INSERT INTO complaint_routing 
                (complaint_id, method, recipient, message, status, created_by) 
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (complaint["id"], "email", recipient, message, "Sent", current_user["access_id"])
            )
            
            # Update complaint status
            cursor.execute(
                "UPDATE complaints SET status = 'In Process' WHERE id = %s",
                (complaint["id"],)
            )
            
            conn.commit()
            return {"success": True, "message": "Complaint routed successfully via email"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
    
    except mysql.connector.Error as e:
        logger.error(f"Database error in route_complaint_via_email: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

@router.post("/route_via_portal")
async def route_complaint_via_portal(request: Request, current_user: User = Depends(get_current_user)):
    """
    Route a complaint via IO portal
    """
    try:
        data = await request.json()
        complaint_id = data.get("complaint_id")
        recipient = data.get("recipient")  # IO user ID
        message = data.get("message", "")
        
        if not complaint_id or not recipient:
            raise HTTPException(status_code=400, detail="Complaint ID and recipient are required")
        
        # Get complaint details
        conn = get_retryable_connection('io')
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM complaints WHERE ticket_number = %s", (complaint_id,))
        complaint = cursor.fetchone()
        
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        # Get IO user details
        cursor.execute("SELECT email, office_id FROM logins WHERE access_id = %s", (recipient,))
        io_user = cursor.fetchone()
        
        if not io_user:
            raise HTTPException(status_code=404, detail="IO user not found")
        
        # Create notification for IO user
        notification_message = f"New complaint #{complaint_id} has been assigned to you. {message}"
        cursor.execute(
            "INSERT INTO notifications (user_id, message, is_read) VALUES (%s, %s, 0)",
            (recipient, notification_message)
        )
        
        # Record routing in database
        cursor.execute(
            """
            INSERT INTO complaint_routing 
            (complaint_id, method, recipient, message, status, created_by) 
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (complaint["id"], "portal", io_user["email"], message, "Assigned", current_user["access_id"])
        )
        
        # Update complaint status and assign to IO
        cursor.execute(
            "UPDATE complaints SET status = 'In Process', assigned_to = %s WHERE id = %s",
            (recipient, complaint["id"])
        )
        
        conn.commit()
        return {"success": True, "message": "Complaint routed successfully via portal"}
    
    except mysql.connector.Error as e:
        logger.error(f"Database error in route_complaint_via_portal: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

@router.get("/get_complaint_route_history/{ticket_number}", response_model=Dict[str, Any])
async def get_complaint_route_history(ticket_number: str, current_user: User = Depends(get_current_user)):
    """
    Get routing history for a complaint
    """
    try:
        conn = get_retryable_connection('io')
        cursor = conn.cursor(dictionary=True)
        
        # Get complaint ID
        cursor.execute("SELECT id FROM complaints WHERE ticket_number = %s", (ticket_number,))
        result = cursor.fetchone()
        
        if not result:
            return {"success": False, "message": "Complaint not found", "history": []}
        
        complaint_id = result["id"]
        
        # Get routing history
        query = """
        SELECT r.id, r.method, r.recipient, o.name as office, 
               r.created_at as date, r.message, r.status
        FROM complaint_routing r
        LEFT JOIN logins l ON r.recipient = l.email
        LEFT JOIN offices o ON l.office_id = o.id
        WHERE r.complaint_id = %s
        ORDER BY r.created_at DESC
        """
        cursor.execute(query, (complaint_id,))
        history = cursor.fetchall()
        
        # Format dates
        for item in history:
            item["date"] = item["date"].isoformat()
        
        return {"success": True, "history": history}
    
    except mysql.connector.Error as e:
        logger.error(f"Database error in get_complaint_route_history: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

@router.post("/create_complaint")
async def create_complaint(complaint: ComplaintCreate, current_user: User = Depends(get_current_user)):
    """
    Create a new complaint
    """
    try:
        conn = get_retryable_connection('io')
        cursor = conn.cursor()
        
        # Generate ticket number
        now = datetime.now()
        ticket_prefix = f"FOS-{now.strftime('%Y%m%d')}"
        
        cursor.execute(
            "SELECT COUNT(*) FROM complaints WHERE ticket_number LIKE %s",
            (f"{ticket_prefix}%",)
        )
        count = cursor.fetchone()[0]
        ticket_number = f"{ticket_prefix}-{count + 1:03d}"
        
        # Insert complaint
        query = """
        INSERT INTO complaints (
            ticket_number, employee_id, status, date_entry, complaint_categories,
            additional_comments, is_urgent, is_anonymous, date_of_issue,
            person_issue, concerned_department, previous_history, proposed_solution
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        values = (
            ticket_number,
            complaint.employee_id,
            "Unprocessed",
            now,
            complaint.complaint_categories,
            complaint.additional_comments,
            complaint.is_urgent,
            complaint.is_anonymous,
            complaint.date_of_issue,
            complaint.person_issue,
            complaint.concerned_department,
            complaint.previous_history,
            complaint.proposed_solution
        )
        
        cursor.execute(query, values)
        conn.commit()
        
        # Send SMS notification if mobile number is provided
        if complaint.mobile_number:
            await send_sms(complaint.mobile_number, ticket_number)
        
        return {
            "success": True,
            "message": "Complaint created successfully",
            "ticket_number": ticket_number
        }
    
    except mysql.connector.Error as e:
        logger.error(f"Database error in create_complaint: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

# Add more endpoints from the Flask app as needed
# For example, survey-related endpoints, admin endpoints, etc.

# Survey endpoints
@router.get("/survey_module")
async def survey_module(current_user: User = Depends(get_current_user)):
    """
    Get survey module data
    """
    # Implementation similar to Flask's survey_module route
    pass

@router.post("/toggle_complaint")
async def toggle_complaint(request: Request, current_user: User = Depends(get_current_user)):
    """
    Toggle complaint status
    """
    # Implementation similar to Flask's toggle_complaint route
    pass

# Admin endpoints
@router.get("/admin_portal")
async def admin_portal(current_user: User = Depends(get_current_user)):
    """
    Get admin portal data
    """
    # Implementation similar to Flask's admin_portal route
    pass

@router.get("/update_dashboard_data")
async def update_dashboard_data(
    start_date: str, 
    end_date: str, 
    current_user: User = Depends(get_current_user)
):
    """
    Update dashboard data
    """
    # Implementation similar to Flask's update_dashboard_data route
    pass

# CS endpoints
@router.get("/cs_table_json")
async def cs_table_json(current_user: User = Depends(get_current_user)):
    """
    Get CS table data
    """
    # Implementation similar to Flask's cs_table_json route
    pass

@router.post("/close_complaint")
async def close_complaint(request: Request, current_user: User = Depends(get_current_user)):
    """
    Close a complaint
    """
    # Implementation similar to Flask's close_complaint route
    pass

@router.post("/bounce_complaint")
async def bounce_complaint(request: Request, current_user: User = Depends(get_current_user)):
    """
    Bounce a complaint
    """
    # Implementation similar to Flask's bounce_complaint route
    pass

# Personal dashboard endpoints
@router.get("/personal_dashboard")
async def personal_dashboard(current_user: User = Depends(get_current_user)):
    """
    Get personal dashboard data
    """
    # Implementation similar to Flask's personal_dashboard route
    pass

# Employee management endpoints
@router.get("/get_employees_data")
async def get_employees_data(current_user: User = Depends(get_current_user)):
    """
    Get employees data
    """
    # Implementation similar to Flask's get_employees_data route
    pass

@router.post("/update_employee")
async def update_employee(request: Request, current_user: User = Depends(get_current_user)):
    """
    Update employee data
    """
    # Implementation similar to Flask's update_employee route
    pass

@router.post("/add_employee")
async def add_employee(request: Request, current_user: User = Depends(get_current_user)):
    """
    Add a new employee
    """
    # Implementation similar to Flask's add_employee route
    pass

@router.post("/delete_employee")
async def delete_employee(request: Request, current_user: User = Depends(get_current_user)):
    """
    Delete an employee
    """
    # Implementation similar to Flask's delete_employee route
    pass

