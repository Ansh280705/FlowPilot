import Tesseract from 'tesseract.js';
import pdfParse from 'pdf-parse';
import type { Buffer } from 'buffer';

export class OCRService {
  async extractTextFromImage(buffer: Buffer): Promise<string> {
    try {
      const result = await Tesseract.recognize(buffer, 'eng', {
        logger: (m) => console.log(m),
      });
      return result.data.text;
    } catch (error) {
      console.error('Error extracting text from image:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  extractStructuredData(text: string): Record<string, string> {
    const data: Record<string, string> = {};
    
    // Extract common patterns
    const patterns = {
      email: /[\w.-]+@[\w.-]+\.\w+/g,
      phone: /\+?[\d\s-()]{10,}/g,
      date: /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g,
      amount: /\$?\s?\d{1,3}(,\d{3})*(\.\d{2})?/g,
      invoice: /invoice\s*#?\s*[:\s]*([a-zA-Z0-9-]+)/gi,
      name: /name\s*[:\s]*([^\n]+)/gi,
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      if (matches) {
        data[key] = matches.join(', ');
      }
    }

    return data;
  }
}
