import { Buffer } from 'buffer';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { AppError } from './appError';
import { logger } from './logger';

export type SupportedFileType = 'pdf' | 'docx';

export interface ExtractedDocumentResult {
  text: string;
  charCount: number;
  wordCount: number;
  fileType: SupportedFileType;
}

/**
 * Validates document magic numbers (headers) to guard against renamed or spoofed files.
 */
export function validateFileSignature(
  buffer: Buffer,
  mimeType: string,
  filename: string
): SupportedFileType {
  if (!buffer || buffer.length < 4) {
    throw new AppError('Invalid or empty file provided.', 400);
  }

  const isPdfHeader =
    buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF-
  const isZipHeader =
    buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04; // PK..

  const ext = filename.split('.').pop()?.toLowerCase();

  if (isPdfHeader) {
    if (ext !== 'pdf' && !mimeType.includes('pdf')) {
      logger.warn(`[DocumentExtractor] Signature is PDF but extension is .${ext}`);
    }
    return 'pdf';
  }

  if (isZipHeader) {
    // DOCX is a zip-compressed openXML package
    if (ext === 'docx' || mimeType.includes('wordprocessingml') || mimeType.includes('document')) {
      return 'docx';
    }
    throw new AppError(
      'Zip file detected, but it does not match standard Word Document (.docx) format.',
      400
    );
  }

  throw new AppError(
    'Unsupported file format. Please upload a valid PDF (.pdf) or Word document (.docx).',
    400
  );
}

/**
 * Normalizes and cleans raw text extracted from uploaded resumes.
 */
export function sanitizeExtractedText(raw: string): string {
  if (!raw) return '';

  return raw
    // Strip null bytes and non-printable control characters
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    // Normalize unicode whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove repeated page divider markers
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
    // Collapse 3+ newlines to 2
    .replace(/\n{3,}/g, '\n\n')
    // Collapse tabs and spaces
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Safely extracts text from PDF and DOCX files.
 */
export async function extractTextFromDocument(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ExtractedDocumentResult> {
  const fileType = validateFileSignature(buffer, mimeType, filename);
  let rawText = '';

  try {
    if (fileType === 'pdf') {
      const parser = new PDFParse({ data: buffer });
      try {
        const textResult = await parser.getText();
        rawText = textResult.text ?? '';
      } finally {
        await parser.destroy();
      }
    } else if (fileType === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value ?? '';
    }
  } catch (error) {
    logger.error('[DocumentExtractor] Failed to parse document text:', error);
    throw new AppError(
      `Failed to parse document text: ${error instanceof Error ? error.message : 'Corrupted or password-protected file.'}`,
      400
    );
  }

  const cleanText = sanitizeExtractedText(rawText);

  if (cleanText.length < 30) {
    throw new AppError(
      'Document contains insufficient readable text. Please ensure the document is not an image-only scan or empty.',
      400
    );
  }

  const words = cleanText.split(/\s+/).filter(Boolean);

  return {
    text: cleanText,
    charCount: cleanText.length,
    wordCount: words.length,
    fileType,
  };
}
