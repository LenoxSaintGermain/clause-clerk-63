import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { ParsedDocument } from '@/types/document.types';

// Configure PDF.js worker with bundled asset (same-origin, reliable)
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

class DocumentService {
  async parseFile(file: File): Promise<ParsedDocument> {
    const fileType = this.getFileExtension(file.name);
    
    switch (fileType) {
      case '.docx':
        return this.parseDocx(file);
      case '.pdf':
        return this.parsePdf(file);
      case '.txt':
      case '.md':
        return this.parseText(file);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private getFileExtension(fileName: string): string {
    return fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  }

  private async parseDocx(file: File): Promise<ParsedDocument> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    return {
      text: result.value,
      fileName: file.name,
      fileType: '.docx'
    };
  }

  private async parsePdf(file: File): Promise<ParsedDocument> {
    const arrayBuffer = await file.arrayBuffer();
    
    const tryParse = async () => {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }
      
      return fullText.trim();
    };

    try {
      const text = await tryParse();
      return {
        text,
        fileName: file.name,
        fileType: '.pdf'
      };
    } catch (error) {
      // Fallback to CDN worker if bundled version fails
      try {
        console.warn('PDF worker failed, retrying with CDN worker...', error);
        pdfjsLib.GlobalWorkerOptions.workerSrc = 
          `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '5.4.394'}/build/pdf.worker.min.mjs`;
        const text = await tryParse();
        return {
          text,
          fileName: file.name,
          fileType: '.pdf'
        };
      } catch (error2) {
        console.error('PDF parsing error:', error2);
        throw new Error('Failed to parse PDF. If this PDF is scanned or image-based, please upload a DOCX or TXT instead.');
      }
    }
  }

  private async parseText(file: File): Promise<ParsedDocument> {
    const text = await file.text();
    
    return {
      text,
      fileName: file.name,
      fileType: this.getFileExtension(file.name)
    };
  }

  async exportToDocx(
    originalText: string,
    modifications: Array<{ original: string; replacement: string }>
  ): Promise<Blob> {
    let processedText = originalText;
    
    // Apply all modifications
    modifications.forEach(({ original, replacement }) => {
      processedText = processedText.replace(original, replacement);
    });

    // Create document with track changes indication
    const paragraphs = processedText.split('\n\n').map(para => {
      return new Paragraph({
        children: [new TextRun(para)]
      });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    });

    return await Packer.toBlob(doc);
  }

  async exportToText(
    originalText: string,
    modifications: Array<{ original: string; replacement: string }>
  ): Promise<string> {
    let processedText = originalText;
    
    modifications.forEach(({ original, replacement }) => {
      processedText = processedText.replace(original, replacement);
    });

    return processedText;
  }
}

export const documentService = new DocumentService();
