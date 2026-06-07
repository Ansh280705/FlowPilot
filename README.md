# FlowPilot AI

AI-powered browser automation platform. Describe a task in plain English — FlowPilot figures out the steps and executes them on any webpage, no code required.

---

## What It Does

FlowPilot AI is a Chrome extension that lets you automate repetitive browser tasks by just typing what you want. It analyses the current page, sends your prompt to an AI (Groq / Llama 3.3), and executes the generated steps — filling forms, clicking buttons, navigating pages — all automatically.

Example prompts:
- `"Fill name as Rahul Sharma, phone 919876543210, date 06/15/2026 10:30 AM, then click Book Appointment"`
- `"Search for react tutorial and click the first result"`
- `"Fill the login form with email test@gmail.com and password mypass123 then click Login"`

---

## Project Structure

```
flowpilot-ai/
├── backend/          Express + TypeScript API server
├── extension/        Chrome MV3 extension (React + TypeScript)
├── frontend/         Marketing website + dashboard (React + JavaScript)
└── shared/
    └── types/        Shared TypeScript types (workflow, execution, etc.)
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Chrome Extension | React 18, TypeScript, Vite, Tailwind CSS, @crxjs/vite-plugin |
| Website Frontend | React 18, JavaScript, Vite, Tailwind CSS, React Router v6, Axios |
| Backend API | Node.js, Express, TypeScript, tsx (watch mode) |
| Database | NeonDB (serverless Postgres) via Drizzle ORM |
| AI | Groq SDK → Llama 3.3 70B Versatile |
| Auth | JWT (jsonwebtoken), bcryptjs |
| OCR | Tesseract.js + pdf-parse |
| File Upload | Multer (memory storage) |

---

## Running Ports

| Service | Port | Command |
|---|---|---|
| Backend API | 3002 | `cd backend && npm run dev` |
| Frontend Website | 5173 | `cd frontend && npm run dev` |
| Extension | Load `extension/dist/` in Chrome | `cd extension && npm run build` |

---

## Environment Variables

### `backend/.env`
```env
PORT=3002
NODE_ENV=development
DATABASE_URL=postgresql://...your_neon_db_url...
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=*
MAX_FILE_SIZE=10485760
```

### `extension/.env`
```env
VITE_BACKEND_API_URL=http://localhost:3002/api
```

---

## Database Schema (NeonDB via Drizzle ORM)

### Tables

**`users`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| email | text unique | lowercase |
| name | text | nullable |
| password_hash | text | bcrypt hash |
| plan | text | `free` / `pro` / `enterprise` |
| created_at | timestamp | |

**`workflows`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| description | text | |
| steps | jsonb | array of WorkflowStep |
| variables | jsonb | array of WorkflowVariable |
| user_id | uuid FK → users | |
| is_public | boolean | default false |
| tags | jsonb | string array |
| created_at / updated_at | timestamp | |

**`executions`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workflow_id | uuid FK → workflows | |
| user_id | uuid FK → users | |
| status | text | `pending/running/completed/failed/stopped` |
| current_step | integer | |
| logs | jsonb | array of ExecutionLog |
| variables | jsonb | key-value pairs |
| error | text | nullable |
| started_at / completed_at | timestamp | |

**`workflow_variables`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workflow_id | uuid FK | |
| name / type / default_value / description | text | |
| required | boolean | |

**`documents`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| filename / type | text | `image` or `pdf` |
| extracted_text | text | OCR output |
| extracted_data | jsonb | structured key-value from OCR |
| user_id | uuid FK | |
| workflow_id | uuid FK nullable | |

**`subscriptions`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK unique | |
| plan | text | |
| status | text | `active/cancelled/past_due` |
| current_period_end | timestamp | |

**`usage_logs`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| month | text | `YYYY-MM` format |
| run_count | integer | incremented per execution |

---

## Backend API Routes

### Auth — `/api/auth`
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/register` | none | Create account, returns JWT |
| POST | `/login` | none | Login, returns JWT |
| GET | `/me` | JWT | Get current user |
| GET | `/usage` | JWT | Get monthly run count + totals |

### Workflows — `/api/workflows`
| Method | Route | Description |
|---|---|---|
| GET | `/` | List all workflows |
| GET | `/:id` | Get single workflow |
| POST | `/` | Create workflow |
| PUT | `/:id` | Update workflow + sync variables |
| DELETE | `/:id` | Delete workflow |

### Executions — `/api/executions`
| Method | Route | Description |
|---|---|---|
| GET | `/` | List executions |
| GET | `/:id` | Get single execution |
| POST | `/` | Save execution record |
| PUT | `/:id` | Update execution status |

### AI — `/api/ai`
| Method | Route | Description |
|---|---|---|
| POST | `/generate-workflow` | Generate steps from prompt + page context |
| POST | `/enhance-prompt` | Improve/translate the prompt |

### Documents — `/api/documents`
| Method | Route | Description |
|---|---|---|
| POST | `/upload` | Upload image/PDF, run OCR |
| GET | `/` | List documents |
| GET | `/:id` | Get document |
| DELETE | `/:id` | Delete document |

---

## Plans & Limits

| Plan | Runs/month | Saved Workflows | Recording | Price |
|---|---|---|---|---|
| Free | 50 | 3 | ❌ | $0 |
| Pro | Unlimited | Unlimited | ✅ | $12/mo |
| Enterprise | Unlimited | Unlimited | ✅ + API + Teams | $49/mo |

Usage is tracked in `usage_logs` per `YYYY-MM`. The `checkUsageLimit` middleware on execution routes enforces the 50-run cap for free users and returns HTTP 429 with an upgrade message when exceeded.

---

## Extension Architecture

```
extension/src/
├── background/index.ts       Service worker — handles all messages, API calls
├── content-scripts/index.ts  Injected into every page — executes steps, records actions
├── App.tsx                   Popup UI — 3 tabs: Automate, Workflows, History
├── components/
│   ├── PromptInput.tsx
│   ├── WorkflowList.tsx
│   ├── ExecutionLogs.tsx
│   └── RecordingControls.tsx
└── utils/
    ├── workflowExecutor.ts   Runs each step (click, type, select, navigate…)
    ├── workflowRecorder.ts   Records user actions into workflow steps
    ├── selectorEngine.ts     Finds elements by text/placeholder/aria/label/fuzzy
    ├── domAnalyzer.ts        Extracts page context (inputs, buttons, forms, tables)
    └── chromeMessaging.ts    Type-safe chrome.runtime.sendMessage wrappers
```

### Message Flow
```
Popup (App.tsx)
  → sendMessageToBackground({ type: 'EXECUTE_PROMPT', prompt })
  → background/index.ts
      → analyzePage() → content-scripts (ANALYZE_PAGE)
      → POST /api/ai/generate-workflow
      → for each step: executeStep() → content-scripts (EXECUTE_STEP)
      → POST /api/executions (save result)
  → returns { success, execution } to popup
```

### Content Script Injection
The content script (`assets/content-script.js`) is declared in `manifest.json` and auto-injected on all URLs at `document_idle`. For tabs already open before the extension loaded, `ensureContentScriptLoaded()` in the background script injects it programmatically via `chrome.scripting.executeScript`.

### AI Intent Detection
Before sending to Groq, the `AIService.checkIfNotAutomation()` method detects coding/Q&A prompts (leetcode, solve, explain, algorithm, etc.) and returns an immediate error message instead of wasting an API call.

### Element Finding Strategy (3 layers)
1. **CSS selector** — if AI provides an exact selector from page context
2. **SelectorEngine** — matches by text, placeholder, aria-label, label, id, name, className
3. **Fuzzy fallback** — strips non-alphanumeric chars and does substring matching across all inputs/buttons

### React-compatible `type` action
Uses `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set` to bypass React's synthetic event system, then fires `input`, `change`, `keydown`, `keypress`, `keyup` events so controlled components update their state.

---

## Frontend Website Pages

| Route | Page | Auth Required |
|---|---|---|
| `/` | Landing — hero, features, pricing | No |
| `/login` | Login form | No |
| `/register?plan=free\|pro\|enterprise` | Register with plan selection | No |
| `/pricing` | Full plan comparison table | No |
| `/dashboard` | Usage bar, workflows, recent runs | Yes |
| `/settings` | Profile, plan, auth token copy | Yes |

Auth is managed via `AuthContext` — JWT stored in `localStorage` as `fp_token`, set as `axios` default header on load.

---

## Setup & Installation

### 1. Clone & install dependencies
```bash
cd backend   && npm install
cd frontend  && npm install
cd extension && npm install
```

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
# Fill in DATABASE_URL, GROQ_API_KEY, JWT_SECRET
```

### 3. Push DB schema to NeonDB
```bash
cd backend
npm run db:migrate   # runs drizzle-kit push:pg
```

### 4. Start backend
```bash
cd backend && npm run dev
# Runs on http://localhost:3002
```

### 5. Start frontend
```bash
cd frontend && npm run dev
# Runs on http://localhost:5173
```

### 6. Build & load extension
```bash
cd extension && npm run build
# In Chrome: go to chrome://extensions → Load unpacked → select extension/dist/
```

### 7. Rebuild DB migrations (if schema changes)
```bash
cd backend
npm run db:generate   # drizzle-kit generate:pg → creates SQL migration files
npm run db:migrate    # drizzle-kit push:pg → applies to NeonDB
```

---

## Git & Version Control

- Repo root: `c:\Users\anshr\Desktop\project\flowpilot-ai\`
- Branch: `master`
- `.gitignore` excludes: `node_modules/`, `dist/`, `.env`, `*.log`, `*.tsbuildinfo`
- `.env.example` contains placeholder values only — never commit real credentials

---

## Known Limitations / TODO

- [ ] Extension login screen — currently uses a hardcoded `default-user` userId; needs to send JWT from extension to backend
- [ ] Stripe integration — pricing page exists but checkout is not wired up
- [ ] Workflow recording saves steps locally; needs backend sync
- [ ] `chrome://` and `edge://` pages cannot run content scripts (by browser design)
- [ ] Date/time inputs (`<input type="datetime-local">`) need special handling beyond plain `.value` setting

---

---

## AI Context Section

> **Copy-paste this section when starting a new AI session about this project.**

---

### FLOWPILOT AI — PROJECT CONTEXT

**What it is:** A Chrome MV3 extension + Express backend + React website for AI-powered browser automation. Users type plain English instructions, the AI (Groq Llama 3.3 70B) generates workflow steps, and the extension executes them on the active tab.

**Root directory:** `c:\Users\anshr\Desktop\project\flowpilot-ai\`

**Three sub-projects:**
- `backend/` — Express + TypeScript, port 3002, `npm run dev` uses tsx watch
- `extension/` — Chrome MV3, React + TypeScript, built with Vite + @crxjs/vite-plugin, output in `extension/dist/`
- `frontend/` — React + JavaScript (no TypeScript), Vite, port 5173, marketing site + dashboard

**Database:** NeonDB (serverless Postgres) accessed via Drizzle ORM (`drizzle-orm/neon-http`). Schema in `backend/src/db/schema/index.ts`. Push schema changes with `npm run db:migrate` (uses `drizzle-kit push:pg`).

**Tables:** `users`, `workflows`, `executions`, `workflow_variables`, `documents`, `subscriptions`, `usage_logs`

**Auth:** JWT via `jsonwebtoken` + `bcryptjs`. Token stored in browser `localStorage` as `fp_token`. Backend middleware in `backend/src/middleware/auth.ts` (`authMiddleware`, `optionalAuth`). Usage limits enforced in `backend/src/middleware/usageCheck.ts`.

**Plans:** free (50 runs/month, 3 workflows), pro (unlimited), enterprise (unlimited + teams + API)

**AI service:** `backend/src/services/aiService.ts` — calls Groq, detects non-automation prompts (coding, Q&A) and returns an error message before calling the API. System prompt forces concrete values in generated steps.

**Extension message flow:**
1. Popup sends `chrome.runtime.sendMessage` to background service worker
2. Background calls `ensureContentScriptLoaded()` (PINGs, injects `assets/content-script.js` if needed)
3. Background calls `analyzePage()` → content script returns DOM elements, forms, inputs
4. Background sends page context + prompt to `POST /api/ai/generate-workflow`
5. Background executes each step by sending `EXECUTE_STEP` to content script
6. Content script uses `WorkflowExecutor` → `SelectorEngine` (3-layer element finding: CSS selector → text/aria/label matching → fuzzy fallback)
7. `type` action uses native input value setter + fires `input`/`change`/keyboard events for React compatibility
8. Execution saved to `POST /api/executions`

**Key files:**
- `extension/src/background/index.ts` — all message handling, API calls, execution orchestration
- `extension/src/content-scripts/index.ts` — PING/ANALYZE_PAGE/EXECUTE_STEP/START_RECORDING/STOP_RECORDING
- `extension/src/utils/workflowExecutor.ts` — executes each action type
- `extension/src/utils/selectorEngine.ts` — finds DOM elements, self-healing selectors
- `extension/src/utils/domAnalyzer.ts` — extracts page context for AI
- `extension/src/utils/workflowRecorder.ts` — records user actions into workflow steps
- `backend/src/routes/auth.ts` — register, login, me, usage
- `backend/src/routes/workflows.ts` — CRUD + variable sync on PUT
- `backend/src/routes/executions.ts` — CRUD
- `backend/src/routes/ai.ts` — generate-workflow, enhance-prompt
- `backend/src/services/aiService.ts` — Groq integration, non-automation detection
- `frontend/src/context/AuthContext.jsx` — JWT auth state, axios header injection
- `shared/types/workflow.ts` — all shared TypeScript interfaces

**Extension build:** `content-script.js` has a stable filename (set via `rollupOptions.output.chunkFileNames` in `extension/vite.config.ts`). Background service worker is loaded via `service-worker-loader.js` (crxjs pattern).

**Env vars needed:**
- `backend/.env`: `DATABASE_URL`, `GROQ_API_KEY`, `JWT_SECRET`, `PORT=3002`
- `extension/.env`: `VITE_BACKEND_API_URL=http://localhost:3002/api`

**Current state (as of June 2026):**
- Auth (register/login/JWT) — fully working
- Workflow CRUD — working
- AI generation + execution — working for form fill + click actions
- Usage tracking + plan limits — working
- Frontend website (landing, login, register, dashboard, pricing, settings) — built and running
- Extension login screen — NOT YET built (uses hardcoded `default-user`)
- Stripe payments — NOT YET wired (pricing page exists)

---
#   F l o w P i l o t  
 