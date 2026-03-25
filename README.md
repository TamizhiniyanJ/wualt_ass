# Wualt Leads

A lightweight lead management application built with a Django REST API and a React + Vite + Tailwind frontend, secured with JWT authentication.

## Features

- User registration (username, email, password) with password validation
- JWT-based authentication (login/logout)
- Per-user lead management (each user sees only their own leads)
- Full lead CRUD:
  - Create, edit, delete leads
  - Fields: name, email, phone, source, status
- Rich UI/UX:
  - Protected routes on the frontend
  - Search, filter by status, and sortable columns
  - Modal forms for add/edit and delete confirmation
  - Color-coded lead status pills

## Technology Stack

- **Backend**: Python, Django, Django REST Framework
- **Auth**: Custom JWT (PyJWT), Django auth
- **Database**: PostgreSQL
- **Frontend**: React, Vite, React Router, Tailwind CSS

## Project Structure

- `backend/` – Django project (`config`) and app (`leads`)
  - JWT auth (`leads/authentication.py`)
  - Lead model, serializer, and viewset
  - Auth endpoints: `POST /api/auth/login/`, `POST /api/auth/register/`
  - Lead endpoints: `GET/POST /api/leads/`, `PATCH/DELETE /api/leads/{id}/`
- `frontend/` – React + Vite app
  - Routing, layout, and pages in `src/`
  - `LoginPage` for sign in / sign up
  - `LeadsPage` for managing leads

## Backend: Local Setup

1. Navigate to the backend folder:

   ```bash
   cd backend
   ```

2. Create and activate a virtual environment (example for Windows PowerShell):

   ```bash
   python -m venv .venv
   .venv\\Scripts\\Activate.ps1
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in `backend/` with at least:

   ```env
   DJANGO_SECRET_KEY=your-secret-key
   DJANGO_DEBUG=True

   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=localhost
   DB_PORT=5432

   ALLOWED_ORIGINS=http://localhost:5173
   ```

5. Apply migrations and run the server:

   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000/api`.

## Frontend: Local Setup

1. Navigate to the frontend folder:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` (or `.env.local`) in `frontend/` with:

   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`.

## Basic Usage

1. Open the app at `http://localhost:5173`.
2. Use **Sign in** / **Create an account** in the header or login page:
   - New users: create an account (username, email, password + confirmation).
   - Existing users: log in with username and password.
3. After logging in, you will be redirected to the **Leads** page:
   - Add new leads with the **New Lead** button.
   - Edit or delete existing leads using the **Edit** and **Delete** actions.
   - Use the search bar and status filter to quickly find leads.

## Deploying

- **Frontend**: Deploy the `frontend/` Vite app (for example, on Vercel), configuring:
  - Build command: `npm run build`
  - Output directory: `dist`
  - Env var: `VITE_API_BASE_URL` pointing to your deployed backend API.
- **Backend**: Deploy the Django app to a platform that supports Gunicorn/Django and PostgreSQL (Render, Railway, etc.), and configure:
  - Django env vars from the `.env` section above
  - A managed PostgreSQL instance
  - CORS allowed origins including your frontend URL.

## License

This project is for personal/educational use. Add a proper license here if you intend to open-source it.


## Demo Video

[Watch the demonstration video](https://drive.google.com/file/d/1wTAXAejVYuWhQDKWxMJ24MnqXGpps623/view?usp=sharing)