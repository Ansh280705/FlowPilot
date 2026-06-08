# Orvicc Extension

Chrome Extension component of Orvicc - an AI-powered browser automation platform.

## Development

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the dist folder
```

## Project Structure

- `src/components/` - React UI components
- `src/content-scripts/` - DOM analysis and workflow execution
- `src/background/` - Extension service worker
- `src/utils/` - Utility functions

## Key Features

- **DOM Analyzer**: Extracts page structure (inputs, buttons, forms)
- **Selector Engine**: Intelligent element matching with self-healing
- **Workflow Executor**: Executes automation steps
- **Workflow Recorder**: Records user actions for replay

## Testing

Manual testing in Chrome browser with developer tools.
