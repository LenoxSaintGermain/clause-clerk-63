import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { ParsedDocument } from '@/types/document.types';

// Configure PDF.js worker with reliable CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

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
    try {
      const arrayBuffer = await file.arrayBuffer();
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
      
      return {
        text: fullText.trim(),
        fileName: file.name,
        fileType: '.pdf'
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF. Please try uploading a DOCX or TXT file instead.');
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
