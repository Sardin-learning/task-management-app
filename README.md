# TaskFlow — Task Management Application

A beginner-friendly full-stack task manager built with React + Vite and Node.js + Express. No database is used: the backend persists tasks in `backend/data/tasks.json`.

## Requirements
- Node.js 18 or newer
- npm

## Run locally

Open two terminals.

### 1. Start the backend
```bash
cd backend
npm install
npm run dev
```
API: http://localhost:5000  
Health check: http://localhost:5000/api/health

### 2. Start the frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/tasks` | List tasks |
| GET | `/api/tasks/:id` | Get one task |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

Optional list filters: `GET /api/tasks?status=Pending&search=report`

Example POST body:
```json
{
  "title": "Prepare project presentation",
  "description": "Finish the slides",
  "priority": "High",
  "status": "Pending",
  "dueDate": "2026-12-01"
}
```

## Configuration
The frontend uses `http://localhost:5000/api` by default. To change it, create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```
The backend accepts `PORT` and `FRONTEND_ORIGIN` environment variables. See `backend/.env.example`.

## Important storage note
This project has no database. Tasks are saved in a JSON file on the backend server. Back up `backend/data/tasks.json`. For production with multiple backend instances or concurrent writes, use a database or a durable storage service instead; a local JSON file is intended for learning and small single-instance deployments.

## Build frontend
```bash
cd frontend
npm run build
```
The production output is created in `frontend/dist`.
