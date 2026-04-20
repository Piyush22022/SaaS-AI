# SaaS AI

Quick.ai is a full-stack AI content workspace built with React, Vite, Express, Clerk, and Supabase. It includes tools for writing articles, generating images, reviewing resumes, removing backgrounds, removing objects, and browsing community creations.

## Features

- AI article generation
- AI image generation
- Resume review
- Background removal
- Object removal
- Community feed for public creations
- Clerk authentication

## Project Structure

- `client/` - React frontend
- `server/` - Express backend

## Prerequisites

- Node.js 18+
- npm
- A Supabase Postgres database
- Clerk account and keys

## Setup

### 1. Install dependencies

From the project root:

```powershell
cd client
npm install

cd ..\server
npm install
```

### 2. Configure environment variables

Create or update `client/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:5000
```

Create or update `server/.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
ARTICLE_AI_PROVIDER=local
GROQ_API_KEY=optional_if_you_want_groq
OPENAI_API_KEY=optional_if_you_want_openai
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_IMAGE_SIZE=1024x1024
```

Run `supabase/schema.sql` in the Supabase SQL editor before starting the backend.

### 3. Run the backend

```powershell
cd server
npm run server
```

The backend runs on `http://localhost:5000`.

### 4. Run the frontend

Open a second terminal:

```powershell
cd client
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Available Scripts

### Client

- `npm run dev` - Start the Vite dev server
- `npm run build` - Build the frontend for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

### Server

- `npm run server` - Start the backend with nodemon
- `npm start` - Start the backend with Node

## API Overview

- `GET /api/health` - Health check
- `POST /api/ai/generate-article` - Generate an article
- `POST /api/ai/generate-image` - Generate an image
- `POST /api/ai/review-resume` - Review a resume
- `GET /api/creations/mine` - Get the current user’s creations
- `GET /api/creations/public` - Get public community creations
- `PATCH /api/creations/:id/publish` - Publish a creation
- `POST /api/creations/:id/like` - Like a creation

## Notes

- The app uses a local fallback for article and image generation when external AI keys are missing.
- Background removal and object removal currently use local browser-based processing.
- Make sure your `.env` files are not committed to GitHub.

## Build Check

To verify everything before deployment:

```powershell
cd client
npm run build

cd ..\server
npm run server
```
