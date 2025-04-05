import re
import os
import uuid
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def format_cnic(cnic: str) -> str:
    """
    Format a CNIC number (Pakistani ID)
    """
    cnic = str(cnic)
    cnic = re.sub(r'\D', '', cnic)  # Remove non-digits
    
    if len(cnic) == 13:
        return f"{cnic[:5]}-{cnic[5:12]}-{cnic[12]}"
    else:
        return cnic

def generate_unique_filename(original_filename: str) -> str:
    """
    Generate a unique filename for uploads
    """
    _, ext = os.path.splitext(original_filename)
    return f"{uuid.uuid4().hex}{ext}"

def format_date(date_obj: Optional[datetime]) -> Optional[str]:
    """
    Format a datetime object to string
    """
    if not date_obj:
        return None
    
    return date_obj.strftime("%Y-%m-%d %H:%M:%S")

def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent XSS
    """
    if not text:
        return ""
    
    # Replace potentially dangerous characters
    text = text.replace("<", "&lt;").replace(">", "&gt;")
    text = text.replace("&", "&amp;").replace('"', "&quot;").replace("'", "&#x27;")
    
    return text

