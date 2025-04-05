import requests
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

async def send_sms(mobile_number: str, ticket_number: str) -> bool:
    """
    Send an SMS notification for a new complaint
    
    Args:
        mobile_number: Recipient mobile number
        ticket_number: Complaint ticket number
        
    Returns:
        bool: True if SMS was sent successfully, False otherwise
    """
    try:
        # Format mobile number if needed
        mobile_number = format_mobile_number(mobile_number)
        
        # Prepare message
        message = f"Your complaint #{ticket_number} has been registered. You can track its status online."
        
        # Send SMS using API
        url = "https://api.sms-service-provider.com/send"
        payload = {
            "token": settings.SMS_API_TOKEN,
            "secret": settings.SMS_API_SECRET,
            "to": mobile_number,
            "message": message
        }
        
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            logger.info(f"SMS sent successfully to {mobile_number}")
            return True
        else:
            logger.error(f"Failed to send SMS: {response.text}")
            return False
    
    except Exception as e:
        logger.error(f"Error sending SMS: {str(e)}")
        return False

def format_mobile_number(mobile: str) -> str:
    """
    Format mobile number to standard format
    
    Args:
        mobile: Mobile number to format
        
    Returns:
        str: Formatted mobile number
    """
    # Remove non-digit characters
    mobile = ''.join(filter(str.isdigit, mobile))
    
    # Add country code if needed
    if mobile.startswith('03'):
        return '923' + mobile[2:]
    elif mobile.startswith('3'):
        return '923' + mobile[1:]
    
    return mobile

