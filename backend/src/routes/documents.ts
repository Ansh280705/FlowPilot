import express from 'express';
import multer from 'multer';
import { getDb } from '../config/database';
import { documents } from '../db/schema';
import { OCRService } from '../services/ocrService';
import { desc, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = express.Router();
const ocrService = new OCRService();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  },
});

// Upload document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const db = getDb();
    const { filename, mimetype, buffer } = req.file;
    const { userId, workflowId } = req.body;

    // Extract text using OCR
    let extractedText = '';
    let extractedData: Record<string, string> = {};

    if (mimetype.startsWith('image/')) {
      extractedText = await ocrService.extractTextFromImage(buffer);
      extractedData = ocrService.extractStructuredData(extractedText);
    } else if (mimetype === 'application/pdf') {
      extractedText = await ocrService.extractTextFromPDF(buffer);
      extractedData = ocrService.extractStructuredData(extractedText);
    }

    // Save to database
    const [newDocument] = await db.insert(documents).values({
      id: randomUUID(),
      filename,
      type: mimetype.startsWith('image/') ? 'image' : 'pdf',
      extractedText,
      extractedData,
      userId: userId || 'default-user',
      workflowId,
    }).returning();

    res.status(201).json(newDocument);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get all documents
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const allDocuments = await db.query.documents.findMany({
      orderBy: [desc(documents.uploadedAt)],
    });
    res.json(allDocuments);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get document by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const document = await db.query.documents.findFirst({
      where: eq(documents.id, req.params.id),
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.delete(documents).where(eq(documents.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
