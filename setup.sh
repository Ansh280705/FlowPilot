#!/bin/bash

echo "🚀 Setting up FlowPilot AI..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Setup Backend
echo "📦 Setting up backend..."
cd backend
npm install
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your credentials"
fi
cd ..

# Setup Extension
echo "📦 Setting up extension..."
cd extension
npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your DATABASE_URL and GROQ_API_KEY"
echo "2. Run database migrations: cd backend && npm run db:migrate"
echo "3. Start backend: cd backend && npm run dev"
echo "4. Build extension: cd extension && npm run build"
echo "5. Load extension in Chrome from extension/dist folder"
