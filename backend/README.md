# FlowPilot AI Backend

Node.js + Express backend API for FlowPilot AI browser automation platform.

## Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npm run db:generate
npm run db:migrate

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Workflows
- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/:id` - Get workflow by ID
- `POST /api/workflows` - Create workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

### Executions
- `GET /api/executions` - Get all executions
- `GET /api/executions/:id` - Get execution by ID
- `POST /api/executions` - Create execution
- `PUT /api/executions/:id` - Update execution

### Documents
- `POST /api/documents/upload` - Upload document (OCR)
- `GET /api/documents` - Get all documents
- `GET /api/documents/:id` - Get document by ID
- `DELETE /api/documents/:id` - Delete document

### AI
- `POST /api/ai/generate-workflow` - Generate workflow from prompt
- `POST /api/ai/enhance-prompt` - Enhance natural language prompt

## Database Schema

Uses Neon PostgreSQL with Drizzle ORM.

Tables:
- `users` - User accounts
- `workflows` - Automation workflows
- `executions` - Workflow execution history
- `workflow_variables` - Workflow variable definitions
- `documents` - Uploaded documents (OCR results)

## Services

### AI Service
- Integrates with Groq API (Llama 3)
- Generates workflows from natural language
- Enhances user prompts

### OCR Service
- Extracts text from images (Tesseract.js)
- Extracts text from PDFs (pdf-parse)
- Structured data extraction

## Environment Variables

```env
PORT=3001
DATABASE_URL=postgresql://...
GROQ_API_KEY=gsk_...
CORS_ORIGIN=chrome-extension://*
MAX_FILE_SIZE=10485760
```
