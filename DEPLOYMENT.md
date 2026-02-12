# Deployment Instructions

## Backend (Python/FastAPI)

The backend is deployed as a Vercel Serverless Function.

1. **Environment Variables**: Set `DATABASE_URL` in your Vercel project settings.
2. **Dependencies**: Listed in `backend/requirements.txt`.
3. **Entry Point**: `backend/app.py`.

## Frontend (React/Vite)

The frontend is deployed as static files.

1. **Build Command**: `npm run build` (runs automatically).
2. **Output Directory**: `frontend/dist`.
3. **Environment Variables**: Set `VITE_API_BASE=/api` in Vercel to point to the backend.

## Environment Variables

Add these in your Vercel project settings:

- `DATABASE_URL`: Your PostgreSQL connection string.
- `VITE_API_BASE`: Set to `/api` for production.

## Local Development

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Troubleshooting

- **404 Errors**: Ensure `VITE_API_BASE` is set correctly.
- **Database Connection**: Verify `DATABASE_URL` is accessible from Vercel's IPs.