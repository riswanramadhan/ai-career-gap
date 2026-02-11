# Career Gap Architect (AI-Powered)

Full Stack MVP that analyzes the gap between a candidate's Resume and a Job Description using Generative AI. Built with performance and engineering depth in mind.

## Live Demo
- **Demo Website:** https://ai-career-gap-frontend.vercel.app/


## Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, TypeScript.
- **Backend:** Node.js, Express.js.
- **Database:** PostgreSQL (via Supabase), Prisma ORM.
- **AI Engine:** Google Gemini 1.5 Flash (via `@google/genai`).
- **Deployment:** Vercel (Monorepo setup).

## 💡 Key Engineering Features
1.  **Smart Caching System (SHA-256 Hashing):**
    - To save AI costs and reduce latency, the system hashes the Resume + Job Description.
    - If the same combination is submitted, it fetches the result from PostgreSQL instantly (Cache Hit) instead of calling the AI (Cache Miss).
2.  **Structured AI Output:**
    - Uses strict JSON schema enforcement to ensure the AI always returns valid data for the frontend.
3.  **Robust Error Handling:**
    - Handles CORS preflight checks manually for seamless cross-origin requests.
    - Validates input presence before processing.

## Local Setup

1.  **Clone the repo:**
    ```bash
    git clone [https://github.com/your-username/career-gap-architect.git](https://github.com/your-username/career-gap-architect.git)
    cd career-gap-architect
    ```

2.  **Setup Backend:**
    ```bash
    cd backend
    npm install
    # Create .env file with DATABASE_URL and GEMINI_API_KEY
    npx prisma generate
    npm run dev
    ```

3.  **Setup Frontend:**
    ```bash
    cd frontend
    npm install
    # Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:5000
    npm run dev
    ```

---
*Submitted by Riswan for the Full Stack AI Engineer Assessment.*
