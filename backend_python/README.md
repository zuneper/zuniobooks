# Zuniobooks Python FastAPI Backend Deployment Guide (Railway)

This directory contains the Python FastAPI backend for Zuniobooks with PostgreSQL database integration.

## Deploying on Railway

1. **Create a Railway Project**:
   - Go to [Railway.app](https://railway.app/) and start a new project.
   - Add a **PostgreSQL** database service.

2. **Deploy Service**:
   - Connect your GitHub repository to Railway.
   - Set the Root Directory to `/backend_python` or set startup command `uvicorn main:app --host 0.0.0.0 --port $PORT`.

3. **Environment Variables**:
   - `DATABASE_URL`: Set automatically by Railway PostgreSQL plugin.
   - `JWT_SECRET`: Any random secure string (e.g., `zuniobooks_galaxy_secret_key_2026`).

4. **Admin Account**:
   - On first database initialization, the Admin account is automatically seeded:
     - **Username**: `zune19`
     - **Password**: `sampleacc@01`
