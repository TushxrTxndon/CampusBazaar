# CampusBazaar

A campus marketplace platform for buying and selling products within the campus community.

## Project Structure

- **Backend/**: FastAPI backend with MySQL database
- **Frontend/**: React frontend with modern UI
- **Database/**: Database schema and SQL scripts

## Quick Start

### Backend Setup

1. Navigate to the Backend directory:
```bash
cd Backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure your database connection in `db.py`

5. Run the backend server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`

### Frontend Setup

1. Navigate to the Frontend directory:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Features

- User registration and authentication
- Product browsing and search
- Shopping cart functionality
- Order management
- Modern, responsive UI
- RESTful API backend

## Tech Stack

**Backend:**
- FastAPI
- MySQL
- Python

**Frontend:**
- React 18
- React Router
- Vite
- Axios

## API Documentation

Once the backend is running, visit `http://127.0.0.1:8000/docs` for interactive API documentation.
