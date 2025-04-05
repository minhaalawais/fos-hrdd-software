from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
import logging
import logging.config
import os
import json
from datetime import datetime, timedelta
import mysql.connector
from app.core.config import settings
from app.core.database import get_retryable_connection, close_all_connections
from app.core.security import create_access_token, verify_password, get_password_hash, verify_token
from app.api.endpoints import router as api_router
from app.models.models import UserLogin, Token, TokenData

# Configure logging
logging.config.fileConfig('logging.conf', disable_existing_loggers=False)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for FOS-HRDD Grievance Management Portal",
    version=settings.VERSION,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router)

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

@app.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        print('Attempting to connect to database')
        conn = get_retryable_connection('personal')
        print('Connected to database')
        cursor = conn.cursor(dictionary=True)
        
        # Get user from database
        query = "SELECT * FROM logins WHERE email = %s"
        cursor.execute(query, (form_data.username,))
        user = cursor.fetchone()
        
        if not user or not verify_password(form_data.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"], "role": user["role"], "access_id": user["access_id"]},
            expires_delta=access_token_expires
        )
        print('Access token created')
        return {"access_token": access_token, "token_type": "bearer"}
    
    except mysql.connector.Error as e:
        logger.error(f"Database error during login: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

@app.post("/logout")
async def logout(request: Request, response: Response):
    # In a stateless API with JWT tokens, we don't need to do anything server-side
    # The client should discard the token
    return {"success": True, "message": "Logged out successfully"}

@app.get("/")
async def root():
    return {"message": "Welcome to FOS-HRDD API"}

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up FOS-HRDD API")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down FOS-HRDD API")
    close_all_connections()

