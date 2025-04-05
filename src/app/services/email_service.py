import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

async def send_email(to_email: str, subject: str, body: str) -> bool:
    """
    Send an email using SMTP
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        body: Email body (HTML)
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = settings.SMTP_USER
        message["To"] = to_email
        
        # Add HTML content
        html_part = MIMEText(body, "html")
        message.attach(html_part)
        
        # Connect to SMTP server
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            print('Connecting to SMTP server...')
            print('Server:', settings.SMTP_SERVER)
            print('Port:', settings.SMTP_PORT)
            print('User:', settings.SMTP_USER)
            print('Password:', settings.SMTP_PASSWORD)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, message.as_string())
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False

async def send_timeline_email(
    to_email: str, 
    subject: str, 
    complaint_id: str, 
    html_content: str, 
    css_content: str = ""
) -> bool:
    """
    Send a complaint timeline email with proper formatting
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        complaint_id: The complaint ticket number
        html_content: The HTML content of the timeline
        css_content: Optional CSS styles to include
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Create email content with embedded CSS
        email_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{subject}</title>
            <style>
                /* Base styles */
                body {{
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #1a1a1a;
                    color: white;
                }}
                
                .container {{
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                
                .timeline {{
                    position: relative;
                    margin: 0 auto;
                }}
                
                .timeline-row {{
                    padding: 20px 30px;
                    position: relative;
                    background-color: rgba(0, 0, 0, 0.5);
                    border-radius: 10px;
                    margin-bottom: 20px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }}
                
                .timeline-time {{
                    color: #fff;
                    font-size: 14px;
                    margin-bottom: 10px;
                }}
                
                .timeline-content {{
                    background-color: rgba(0, 0, 0, 0.3);
                    padding: 15px;
                    border-radius: 5px;
                }}
                
                .slider-container {{
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    overflow: hidden;
                    margin: 20px 0;
                    height: 250px;
                }}
                
                .text-yellow-300 {{
                    color: #fcd34d;
                }}
                
                .text-white {{
                    color: white;
                }}
                
                .bg-primary {{
                    background-color: #206E71;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                }}
                
                .bg-secondary {{
                    background-color: #2D9480;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                }}
                
                .bg-yellow-400 {{
                    background-color: #fbbf24;
                    color: black;
                    padding: 4px 8px;
                    border-radius: 4px;
                }}
                
                .bg-gradient-to-r {{
                    background: linear-gradient(to right, #F5A83C, #FF8C42);
                    padding: 16px 24px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    color: white;
                    font-weight: bold;
                    margin: 24px 0;
                    display: inline-block;
                }}
                
                /* Additional styles from the CSS content */
                {css_content}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>{subject}</h1>
                <p>Please find below the complaint timeline for ticket {complaint_id}:</p>
                {html_content}
                <p>This email was sent from the FOS-HRDD Grievance Management Portal.</p>
            </div>
        </body>
        </html>
        """
        
        # Send the email using the general send_email function
        return await send_email(to_email, subject, email_content)
        
    except Exception as e:
        logger.error(f"Error in send_timeline_email: {e}")
        return False

