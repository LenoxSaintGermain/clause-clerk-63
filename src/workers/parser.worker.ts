// src/workers/parser.worker.ts

import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up the PDF.js worker source
// This is crucial for the worker to function correctly.
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;

const parsePdf = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument(arrayBuffer).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => (item as any).str).join(' ');
  }
  return text;
};

const parseDocx = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const parseText = (file: File) => {
  return file.text();
};

self.onmessage = async (event: MessageEvent<{ file: File }>) => {
  const { file } = event.data;
  let text = '';
  let error: string | null = null;

  try {
    switch (file.type) {
      case 'application/pdf':
        text = await parsePdf(file);
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        text = await parseDocx(file);
        break;
      case 'text/plain':
      case 'text/markdown':
        text = await parseText(file);
        break;
      default:
        throw new Error(`Unsupported file type: ${file.type}`);
    }
  } catch (e) {
    console.error('Error parsing file in worker:', e);
    error = e instanceof Error ? e.message : 'An unknown error occurred during parsing.';
  }

  self.postMessage({ text, error });
};
