# SaaS AI

Quick.ai is a full-stack AI content workspace built with React, Vite, Express, Clerk, and Supabase. It gives users one place to write articles, generate images, review resumes, and experiment with simple image editing tools.

## What It Does

- Generate blog articles from a topic
- Generate AI-style images from a prompt
- Review resumes with structured feedback
- Remove image backgrounds
- Remove objects from images
- Browse community creations
- Authenticate with Clerk

## Project Structure

- `client/` - React frontend
- `server/` - Express backend
- `supabase/` - SQL schema for the database

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Auth: Clerk
- Database: Supabase Postgres
- AI: OpenAI / Groq / local fallback logic

## Local Development

### 1. Install dependencies

```powershell
cd client
npm install

cd ..\server
npm install
```

### 2. Configure environment variables

`client/.env`

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:5000
```

`server/.env`

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
ARTICLE_AI_PROVIDER=local
GROQ_API_KEY=optional
OPENAI_API_KEY=optional
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_IMAGE_SIZE=1024x1024
```

Run the schema file in the Supabase SQL editor before starting the server:

```sql
supabase/schema.sql
```

### 3. Start the backend

```powershell
cd server
npm run server
```

Backend runs on `http://localhost:5000`.

### 4. Start the frontend

Open another terminal:

```powershell
cd client
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Available Scripts

### Client

- `npm run dev` - Start the Vite dev server
- `npm run build` - Build the frontend
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

### Server

- `npm run server` - Start the backend with nodemon
- `npm start` - Start the backend with Node

## API Endpoints

- `GET /api/health`
- `POST /api/ai/generate-article`
- `POST /api/ai/generate-image`
- `POST /api/ai/review-resume`
- `GET /api/creations/mine`
- `GET /api/creations/public`
- `PATCH /api/creations/:id/publish`
- `POST /api/creations/:id/like`

## Notes

- The app includes local fallbacks when external AI keys are missing.
- Background removal and object removal currently run in the browser.
- Do not commit `.env` files.
