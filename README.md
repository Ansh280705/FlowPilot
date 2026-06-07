<div align="center">

<img src="extension/public/icon128.png" alt="FlowPilot AI Logo" width="80" height="80" />

# FlowPilot AI

**Automate any website with plain English.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](#)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](#)
[![Chrome MV3](https://img.shields.io/badge/Chrome-MV3-yellow.svg)](#)
[![Powered by Groq](https://img.shields.io/badge/AI-Groq%20%2F%20Llama%203.3-orange.svg)](#)

[Demo](#demo) · [Features](#features) · [Getting Started](#getting-started) · [API Docs](#api-routes) · [Contributing](#contributing)

---

<img src="https://placehold.co/900x500/0f0f17/6366f1?text=FlowPilot+AI+—+Browser+Automation+Screenshot" alt="FlowPilot AI Screenshot" width="900" style="border-radius:12px" />

</div>

---

## What is FlowPilot AI?

FlowPilot AI is a **Chrome extension + web platform** that lets you automate repetitive browser tasks by just typing what you want. No code. No selectors. No scripts.

Type a task → AI understands the page → steps execute automatically.

```
"Fill name as Rahul Sharma, phone 919876543210, date 06/15/2026 10:30 AM, then click Book Appointment"
```

FlowPilot analyses the active page, sends your prompt to **Groq (Llama 3.3 70B)**, generates browser automation steps, and executes them — filling forms, clicking buttons, navigating pages — all in real time.

---

## Features

- 🤖 **AI-Powered** — Describe tasks in plain English, including Hinglish
- ⚡ **Instant Execution** — Runs on any webpage, no setup per site
- 🎥 **Workflow Recording** — Record your actions and replay them anytime
- 💾 **Saved Workflows** — Store, duplicate, and rerun automations
- 📄 **OCR Support** — Upload PDFs and images to extract data and use in automations
- 📊 **Execution History** — Full logs for every run with step-by-step details
- 🔐 **Auth + Plans** — Free tier, Pro, and Enterprise with usage limits
- 🛡️ **Smart Guardrails** — Detects non-automation prompts (coding questions, LeetCode, etc.) and explains the tool's scope

---

## Project Structure

```
flowpilot-ai/
├── 🖥️  backend/          Express + TypeScript API (port 3002)
├── 🧩  extension/        Chrome MV3 extension (React + TypeScript)
├── 🌐  frontend/         Marketing site + dashboard (React + JavaScript)
└── 📦  shared/
        └── types/        Shared TypeScript interfaces
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Chrome Extension** | React 18, TypeScript, Vite, Tailwind CSS, @crxjs/vite-plugin |
| **Website** | React 18, JavaScript, Vite, Tailwind CSS, React Router v6, Axios |
| **Backend API** | Node.js, Express, TypeScript, tsx |
| **Database** | NeonDB (serverless Postgres) + Drizzle ORM |
| **AI** | Groq SDK → Llama 3.3 70B Versatile |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **OCR** | Tesseract.js + pdf-parse |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [NeonDB](https://neon.tech) database (free tier works)
- A [Groq](https://console.groq.com) API key (free)
- Chrome browser

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/flowpilot-ai.git
cd flowpilot-ai
```

### 2. Install dependencies

```bash
cd backend   && npm install && cd ..
cd frontend  && npm install && cd ..
cd extension && npm install && cd ..
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in:

```env
PORT=3002
DATABASE_URL=postgresql://your_neon_connection_string
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=any_random_secret_string
```

`extension/.env` is already configured for local development:
```env
VITE_BACKEND_API_URL=http://localhost:3002/api
```

### 4. Push database schema

```bash
cd backend
npm run db:migrate
```

### 5. Start the backend

```bash
cd backend
npm run dev
# → http://localhost:3002
```

### 6. Start the frontend website

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

### 7. Build and load the extension

```bash
cd extension
npm run build
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/dist/` folder

---

## Demo

### Automating a form

Type this in the extension popup:

```
Fill name as John Doe, email as john@example.com, then click Submit
```

FlowPilot will:
1. Analyse the current page to find all inputs
2. Generate steps using the real placeholder/label names
3. Fill each field using React-compatible input events
4. Click the submit button

### Saving and replaying workflows

Any automation can be saved as a named workflow from the **Workflows** tab and replayed on any matching page with one click.

---

## Plans & Pricing

| Feature | Free | Pro | Enterprise |
|---|:---:|:---:|:---:|
| Runs per month | 50 | Unlimited | Unlimited |
| Saved workflows | 3 | Unlimited | Unlimited |
| Workflow recording | ❌ | ✅ | ✅ |
| Priority AI model | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ✅ |
| Team seats | ❌ | ❌ | 5 |
| Support | Community | Email | Priority |
| Price | $0 | $12/mo | $49/mo |

---

## API Routes

### Auth — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Create account → returns JWT |
| `POST` | `/login` | Login → returns JWT |
| `GET` | `/me` | Get current user (JWT required) |
| `GET` | `/usage` | Monthly run count + totals |

### Workflows — `/api/workflows`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List all workflows |
| `GET` | `/:id` | Get single workflow |
| `POST` | `/` | Create workflow |
| `PUT` | `/:id` | Update workflow |
| `DELETE` | `/:id` | Delete workflow |

### AI — `/api/ai`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/generate-workflow` | Generate automation steps from prompt |
| `POST` | `/enhance-prompt` | Translate/improve the prompt |

### Documents — `/api/documents`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Upload image/PDF, run OCR |
| `GET` | `/` | List documents |
| `DELETE` | `/:id` | Delete document |

---

## Database Schema

```
users             id, email, name, password_hash, plan, created_at
workflows         id, name, description, steps (jsonb), user_id, tags
executions        id, workflow_id, user_id, status, logs (jsonb), current_step
workflow_variables id, workflow_id, name, type, default_value, required
documents         id, filename, type, extracted_text, extracted_data, user_id
subscriptions     id, user_id, plan, status, current_period_end
usage_logs        id, user_id, month (YYYY-MM), run_count
```

---

## Extension Architecture

```
extension/src/
├── background/index.ts        Service worker — orchestrates all automation
├── content-scripts/index.ts   Page script — executes steps, records actions
├── App.tsx                    Popup UI (Automate / Workflows / History tabs)
├── components/                PromptInput, WorkflowList, ExecutionLogs, RecordingControls
└── utils/
    ├── workflowExecutor.ts    Runs each step (click, type, select, navigate…)
    ├── workflowRecorder.ts    Records user clicks/inputs into replayable steps
    ├── selectorEngine.ts      3-layer element finding: CSS → aria/label → fuzzy
    ├── domAnalyzer.ts         Extracts page context for AI (inputs, forms, buttons)
    └── chromeMessaging.ts     Type-safe chrome.runtime message helpers
```

### How a single automation works

```
User types prompt in popup
        ↓
background/index.ts receives EXECUTE_PROMPT
        ↓
Injects content script if not already present
        ↓
Sends ANALYZE_PAGE → gets all inputs, buttons, forms on the page
        ↓
POST /api/ai/generate-workflow with prompt + page context
        ↓
Llama 3.3 returns structured steps with real selectors + values
        ↓
For each step → sends EXECUTE_STEP to content script
        ↓
WorkflowExecutor fills fields / clicks buttons using native setter trick
        ↓
Saves execution record to POST /api/executions
        ↓
Shows logs in popup
```

---

## Available Scripts

### Backend
```bash
npm run dev          # Start dev server with hot reload (tsx watch)
npm run build        # Compile TypeScript to dist/
npm run db:generate  # Generate migration files from schema
npm run db:migrate   # Push schema changes to NeonDB
npm run db:studio    # Open Drizzle Studio (DB GUI)
```

### Extension
```bash
npm run build        # Build extension → extension/dist/
npm run dev          # Vite dev server (for popup UI development only)
```

### Frontend
```bash
npm run dev          # Start Vite dev server on port 5173
npm run build        # Build to frontend/dist/
```

---

## Roadmap

- [ ] Extension login screen — link to website account from the popup
- [ ] Stripe integration — wire up pricing page to Stripe checkout
- [ ] `datetime-local` input support
- [ ] Variable substitution UI — fill workflow variables from the popup before running
- [ ] Schedule automations — run workflows at set times
- [ ] Team workspace — share workflows across an enterprise team
- [ ] Webhook triggers — trigger automations via API or external events

---

## Folder Structure (Source Files Only)

```
flowpilot-ai/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          NeonDB connection via Drizzle
│   │   ├── db/
│   │   │   ├── schema/index.ts      All table definitions
│   │   │   └── migrations/          Auto-generated SQL migrations
│   │   ├── middleware/
│   │   │   ├── auth.ts              JWT authMiddleware + optionalAuth
│   │   │   └── usageCheck.ts        Monthly run limit enforcement
│   │   ├── routes/
│   │   │   ├── auth.ts              Register, login, me, usage
│   │   │   ├── workflows.ts         CRUD + variable sync
│   │   │   ├── executions.ts        Execution records CRUD
│   │   │   ├── documents.ts         File upload + OCR
│   │   │   └── ai.ts                Workflow generation + prompt enhancement
│   │   ├── services/
│   │   │   ├── aiService.ts         Groq integration, non-automation detection
│   │   │   └── ocrService.ts        Tesseract.js + pdf-parse
│   │   └── index.ts                 Express app entry point
│   ├── .env.example
│   ├── drizzle.config.ts
│   └── package.json
│
├── extension/
│   ├── src/
│   │   ├── background/index.ts      Service worker — orchestrates automation
│   │   ├── content-scripts/index.ts Injected page script — executes steps
│   │   ├── components/              Popup UI components
│   │   ├── utils/
│   │   │   ├── workflowExecutor.ts  Runs click/type/select/navigate actions
│   │   │   ├── workflowRecorder.ts  Records user actions into workflow steps
│   │   │   ├── selectorEngine.ts    3-layer element finding + self-healing
│   │   │   ├── domAnalyzer.ts       Extracts page context for AI
│   │   │   └── chromeMessaging.ts   Type-safe chrome.runtime helpers
│   │   ├── types/workflow.ts        Local type aliases (mirrors shared/)
│   │   ├── App.tsx                  Popup root — 3 tabs
│   │   └── main.tsx
│   ├── manifest.json
│   ├── vite.config.ts
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── context/AuthContext.jsx  JWT state + axios header injection
│   │   ├── components/Navbar.jsx    Responsive nav with mobile menu
│   │   └── pages/
│   │       ├── Landing.jsx          Hero, features, pricing preview
│   │       ├── Login.jsx
│   │       ├── Register.jsx         Plan-aware signup (?plan=pro)
│   │       ├── Dashboard.jsx        Usage bar, workflows, run history
│   │       ├── Pricing.jsx          Full plan comparison table
│   │       └── Settings.jsx         Profile, plan, auth token copy
│   ├── vite.config.js
│   └── package.json
│
└── shared/
    └── types/workflow.ts            WorkflowStep, Workflow, Execution, PageContext…
```

---

## Environment Variables Reference

### `backend/.env`

| Variable | Required | Example | Description |
|---|:---:|---|---|
| `PORT` | ✅ | `3002` | Server port |
| `DATABASE_URL` | ✅ | `postgresql://...` | NeonDB connection string |
| `GROQ_API_KEY` | ✅ | `gsk_...` | Groq API key |
| `JWT_SECRET` | ✅ | `any-random-string` | JWT signing secret |
| `NODE_ENV` | ❌ | `development` | Environment |
| `CORS_ORIGIN` | ❌ | `*` | Allowed CORS origins |
| `MAX_FILE_SIZE` | ❌ | `10485760` | Max upload size in bytes (10MB) |

### `extension/.env`

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `VITE_BACKEND_API_URL` | ✅ | `http://localhost:3002/api` | Backend API base URL |

---

## How the AI Understands Your Page

When you run an automation, FlowPilot sends the AI a structured snapshot of the current page:

```
Page: Book Appointment (http://example.com/booking)

EXACT page elements:
1. [input] placeholder="John Doe" label="CUSTOMER NAME" selector="input.name-field"
2. [input] placeholder="919876543210" label="PHONE NUMBER" selector="input.phone-field"
3. [input] placeholder="mm/dd/yyyy" label="DATE & TIME" selector="input[type=datetime-local]"
4. [button] text="Book Appointment" selector="button.submit-btn"
```

The AI uses this to generate steps with **exact CSS selectors and real values** — no guessing. If a selector fails at runtime, `selectorEngine` falls back through label matching → aria-label → placeholder → fuzzy text scan.

---

## Prompt Tips

| What you want | Example prompt |
|---|---|
| Fill a form | `Fill name as John, email as john@test.com, then click Submit` |
| Login | `Enter email test@gmail.com and password Pass@123 then click Login` |
| Search | `Type "react hooks" in the search box and press Enter` |
| Navigate | `Go to https://github.com/trending` |
| Click something | `Click the Sign Up button` |
| Multi-step | `Fill the checkout form: name John Doe, card 4111111111111111, expiry 12/28, CVV 123, then click Place Order` |

> **Tip:** Always include the actual values you want filled. The more specific you are, the better the result.

---

## Contributing

Contributions are welcome. To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and test them
4. Open a pull request with a clear description of what changed and why

Please keep PRs focused — one feature or fix per PR. For major changes, open an issue first to discuss the approach.

---

## License

MIT © 2026 FlowPilot AI

---

<div align="center">

Built with ❤️ using React, Express, Groq, and NeonDB

**[⭐ Star this repo](../../stargazers)** if FlowPilot saves you time

</div>
