# Smart Agriwaste

Smart Agriwaste is a full-stack platform that helps farmers manage agricultural waste efficiently and connect with buyers through a marketplace.

The platform supports:
- Waste processing recommendations
- Waste listing and marketplace discovery
- Negotiation and order workflows
- Notifications and community chat

## Project Structure

- `frontend/`: Next.js 16 app (React + TypeScript)
- `backend/`: Express + TypeScript API with Socket.IO
- `dataset-api/`: Go (Gin) recommendation microservice

## Architecture Summary

- Frontend (port `3000`) consumes:
  - Backend API at `/api` (default local: `http://localhost:5000/api`)
  - Dataset API (default local: `http://localhost:8080`)
  - Socket connection (default local: `http://localhost:5000`)
- Backend (port `5000`) handles:
  - Auth/profile flows (Clerk)
  - Waste, order, negotiation, notification APIs
  - Realtime chat via Socket.IO
- Dataset API (port `8080`) handles:
  - Waste-process recommendation endpoint
- MongoDB stores platform data

## Docker Setup (Recommended)

### 1. Prerequisites

- Docker Desktop installed and running
- Git clone of this repository

### 2. Create `.env` in project root

Add the required values (example template):

```env
# Backend secrets
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
CLERK_WEBHOOK_SECRET=
ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=
AZURE_TRANSLATOR_ENDPOINT=
AZURE_TRANSLATOR_KEY=
AZURE_TRANSLATOR_REGION=

# Frontend public vars
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=
NEXT_PUBLIC_IMAGEKIT_AUTH_ENDPOINT=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
NEXT_PUBLIC_ONESIGNAL_APP_ID=

# Frontend server-side vars
CLERK_SECRET_KEY=
```

### 3. Build and run

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Dataset API: `http://localhost:8080`
- MongoDB: `mongodb://localhost:27017`

### 4. Stop services

```bash
docker compose down
```

To remove database volume too:

```bash
docker compose down -v
```

## Local Development (Without Docker)

Run each service in separate terminals.

### Backend

```bash
cd backend
npm install
npm run dev
```

### Dataset API

```bash
cd dataset-api
go mod download
go run .
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API/Config Notes

- Frontend now supports configurable runtime URLs with fallbacks:
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXT_PUBLIC_AGRI_API_URL`
  - `NEXT_PUBLIC_SOCKET_URL`
- If these are not set, it falls back to current deployed API defaults.

## Current Analysis Highlights

- Strong separation of concerns across 3 services.
- Backend and dataset API both depend on MongoDB; Docker Compose now provisions this dependency.
- Realtime chat uses Socket.IO and is exposed through backend port `5000`.
- Existing frontend was tied to deployed endpoints; this is now configurable for local/containerized runs.

## Future Improvements

- Add healthcheck endpoints and Compose health checks.
- Add root `.env.example` for easier onboarding.
- Add CI build/test workflow for all three services.
