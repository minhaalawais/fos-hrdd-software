import os
import random
import time
import mysql.connector
from mysql.connector import pooling
from mysql.connector.errors import PoolError, DatabaseError
from typing import Dict, Any, Optional
from app.core.config import settings

# Database configuration
dbconfigs = {
    "admin": {
        "host": settings.DB_HOST,
        "user": settings.DB_USER,
        "password": settings.DB_PASSWORD,
        "database": settings.DB_NAME,
        
    },
    "complaints": {
        "host": settings.DB_HOST,
        "user": settings.DB_USER,
        "password": settings.DB_PASSWORD,
        "database": settings.DB_NAME
    },
    "io": {
        "host": settings.DB_HOST,
        "user": settings.DB_USER,
        "password": settings.DB_PASSWORD,
        "database": settings.DB_NAME
    },
    "personal": {
        "host": settings.DB_HOST,
        "user": settings.DB_USER,
        "password": settings.DB_PASSWORD,
        "database": settings.DB_NAME
    }
}

# Initialize pools dictionary
pools = {}

MAX_RETRIES = 10
BASE_DELAY = 1  # time in seconds
MAX_DELAY = 30  # maximum delay in seconds

def get_retryable_connection(purpose: str):
    """
    Get a database connection with retry logic
    """
    temp_users = ['admin', 'complaints', 'io', 'personal']
    all_users = [purpose] + [u for u in temp_users if u != purpose]
    
    for attempt in range(MAX_RETRIES):
        random.shuffle(all_users)  # Randomize user order to distribute load
        for user in all_users:
            try:
                print(f"Attempting to connect using user: {user}")
                pool = get_pool(user)
                start_time = time.time()
                while time.time() - start_time < 5:  # 5-second timeout
                    try:
                        connection = pool.get_connection()
                        if connection.is_connected():
                            print(f"Successfully connected to the database using user: {user}")
                            return connection
                        else:
                            connection.close()
                            raise mysql.connector.InterfaceError("Invalid connection")
                    except mysql.connector.PoolError as pool_error:
                        print(f"PoolError encountered for user {user}: {pool_error}")
                        time.sleep(0.1)  # Short sleep before retrying
                raise mysql.connector.PoolError("Connection attempt timed out")
            except (mysql.connector.PoolError, mysql.connector.InterfaceError) as e:
                if "max_user_connections" in str(e) or "pool exhausted" in str(e):
                    print(f"Connection issue for {user}: {str(e)}. Trying next user.")
                    continue
                else:
                    print(f"Unexpected error for user {user}: {str(e)}")
                    raise
        
        # If we've tried all users and still haven't connected, wait and retry
        delay = min(BASE_DELAY * (2 ** attempt) + random.uniform(0, 1), MAX_DELAY)
        print(f"All users at connection limit. Retrying in {delay:.2f} seconds... (Attempt {attempt + 1}/{MAX_RETRIES})")
        time.sleep(delay)
    
    error_message = "Failed to establish a database connection after maximum retries"
    print(error_message)
    raise mysql.connector.OperationalError(error_message)

def get_pool(purpose: str):
    """
    Get or create a connection pool for the specified purpose
    """
    if purpose not in pools:
        config = dbconfigs[purpose]
        pools[purpose] = pooling.MySQLConnectionPool(
            pool_name=f"{purpose}_pool",
            pool_size=10,  # Reduced pool size
            pool_reset_session=True,
            **config
        )
    return pools[purpose]

def close_all_connections():
    """
    Close all database connections
    """
    for pool in pools.values():
        pool.close()

