import asyncio
import logging
from datetime import datetime, timedelta
import time
import threading
from app.core.database import get_retryable_connection
import mysql.connector
from app.services.email_service import send_email

logger = logging.getLogger(__name__)

def start():
    """
    Start the background task scheduler
    """
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    logger.info("Background task scheduler started")

def run_scheduler():
    """
    Run the scheduler loop
    """
    while True:
        try:
            # Check for overdue CAPA deadlines
            check_capa_deadlines()
            
            # Sleep for 1 hour before next check
            time.sleep(3600)
        
        except Exception as e:
            logger.error(f"Error in scheduler: {e}")
            time.sleep(300)  # Sleep for 5 minutes before retry

def check_capa_deadlines():
    """
    Check for overdue CAPA deadlines and send notifications
    """
    try:
        conn = get_retryable_connection('scheduler')
        cursor = conn.cursor(dictionary=True)
        
        # Get complaints with deadlines approaching in the next 24 hours
        now = datetime.now()
        tomorrow = now + timedelta(days=1)
        
        query = """
        SELECT c.id, c.ticket_number, c.complaint_categories, 
               c.capa_deadline, c.capa_deadline1, c.capa_deadline2,
               l.email
        FROM complaints c
        LEFT JOIN logins l ON c.assigned_to = l.access_id
        WHERE 
            (c.status = 'In Process' AND c.capa_deadline IS NOT NULL AND c.capa_deadline <= %s) OR
            (c.status = 'Bounced' AND c.capa_deadline1 IS NOT NULL AND c.capa_deadline1 <= %s) OR
            (c.status = 'Bounced1' AND c.capa_deadline2 IS NOT NULL AND c.capa_deadline2 <= %s)
        """
        
        cursor.execute(query, (tomorrow, tomorrow, tomorrow))
        complaints = cursor.fetchall()
        
        for complaint in complaints:
            # Determine which deadline is approaching
            deadline = None
            deadline_type = ""
            
            if complaint["status"] == "In Process" and complaint["capa_deadline"]:
                deadline = complaint["capa_deadline"]
                deadline_type = "CAPA"
            elif complaint["status"] == "Bounced" and complaint["capa_deadline1"]:
                deadline = complaint["capa_deadline1"]
                deadline_type = "CAPA1"
            elif complaint["status"] == "Bounced1" and complaint["capa_deadline2"]:
                deadline = complaint["capa_deadline2"]
                deadline_type = "CAPA2"
            
            if deadline:
                # Send notification email
                if complaint["email"]:
                    subject = f"URGENT: {deadline_type} Deadline Approaching for Complaint #{complaint['ticket_number']}"
                    body = f"""
                    <h2>CAPA Deadline Reminder</h2>
                    <p>This is a reminder that the {deadline_type} deadline for complaint #{complaint['ticket_number']} is approaching.</p>
                    <p><strong>Deadline:</strong> {deadline}</p>
                    <p><strong>Category:</strong> {complaint['complaint_categories']}</p>
                    <p>Please complete the required actions before the deadline.</p>
                    """
                    
                    asyncio.run(send_email(complaint["email"], subject, body))
                
                # Create notification in system
                cursor.execute(
                    "INSERT INTO notifications (user_id, message, is_read) VALUES (%s, %s, 0)",
                    (
                        complaint["assigned_to"],
                        f"{deadline_type} deadline for complaint #{complaint['ticket_number']} is on {deadline}"
                    )
                )
        
        conn.commit()
        logger.info(f"Checked CAPA deadlines, sent {len(complaints)} notifications")
    
    except mysql.connector.Error as e:
        logger.error(f"Database error in check_capa_deadlines: {e}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

