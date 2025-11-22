import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv
import os

load_dotenv()

dbconfig = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASS"),
    "database": os.getenv("DB_NAME"),
}

pool = pooling.MySQLConnectionPool(pool_name="mypool",
                                   pool_size=5,
                                   **dbconfig)


def get_db():
    return pool.get_connection()
