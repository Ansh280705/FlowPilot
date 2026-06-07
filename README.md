# FlowPilot AI

An AI-powered Chrome Extension platform that acts as a full browser automation AI agent capable of understanding natural language instructions and autonomously executing repetitive browser workflows on any website.

## 🚀 Features

- **Natural Language Automation**: Describe tasks in plain English, AI generates and executes workflows
- **DOM Analysis**: Intelligently analyzes webpage structure to understand forms, inputs, buttons
- **Self-Healing Selectors**: Robust element matching that adapts to website changes
- **Workflow Recording**: Record actions and replay them later
- **OCR Support**: Extract data from images and PDFs to autofill forms
- **AI-Powered**: Uses Groq API with Llama 3 for intelligent workflow generation
- **Premium UI**: Modern, clean interface with Tailwind CSS

## 📁 Project Structure

```
flowpilot-ai/
├── extension/          # Chrome Extension (Manifest V3)
│   ├── src/
│   │   ├── components/  # React UI components
│   │   ├── content-scripts/  # DOM analysis & execution
│   │   ├── background/  # Extension orchestration
│   │   └── utils/       # Helper utilities
│   └── public/         # Extension assets
├── backend/            # Node.js + Express API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # AI & OCR services
│   │   ├── db/          # Database schemas
│   │   └── config/      # Configuration
└── shared/              # Shared TypeScript types
```

## 🛠️ Tech Stack

### Extension
- React + Vite
- TypeScript
- Tailwind CSS
- Chrome Manifest V3

### Backend
- Node.js + Express
- TypeScript
- Neon PostgreSQL (Drizzle ORM)
- Groq API (Llama 3)
- Tesseract.js (OCR)
- pdf-parse

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Neon PostgreSQL account (free tier available)
- Groq API key

## 🔧 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd flowpilot-ai
```

### 2. Set up the Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your credentials:
```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=3001
```

Run database migrations:
```bash
npm run db:generate
npm run db:migrate
```

Start the backend server:
```bash
npm run dev
```

### 3. Set up the Extension

```bash
cd extension
npm install
```

Build the extension:
```bash
npm run build
```

### 4. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/dist` folder

## 🎯 Usage

1. Navigate to any website
2. Click the FlowPilot AI extension icon
3. Describe your task in natural language:
   - "Fill patient form and click finalize"
   - "Upload invoice PDF and submit reimbursement form"
4. Click "Run Automation"
5. AI analyzes the page and executes the workflow

## 📝 Example Workflows

### Form Filling
```
[
  {
    "action": "type",
    "target": "patient name",
    "value": "{{name}}"
  },
  {
    "action": "type",
    "target": "age",
    "value": "{{age}}"
  },
  {
    "action": "click",
    "target": "Finalize"
  }
]
```

### Data Extraction
```
[
  {
    "action": "extract",
    "target": "order number"
  },
  {
    "action": "extract",
    "target": "total amount"
  }
]
```

## 🔐 Security

- API keys stored only on backend
- No sensitive data in extension
- Secure message passing between components
- Auth-ready architecture

## 🚀 Deployment

### Backend
Deploy to Vercel, Railway, or any Node.js hosting platform.

### Extension
Package the `extension/dist` folder as a ZIP file and distribute through Chrome Web Store.

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

## 📧 Support

For issues and questions, please open a GitHub issue.
