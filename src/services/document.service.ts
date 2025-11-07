import { ParsedDocument } from '@/types/document.types';

class DocumentService {
  parseFile(file: File): Promise<ParsedDocument> {
    return new Promise((resolve, reject) => {
      // Vite-specific syntax for creating a worker
      const worker = new Worker(new URL('../workers/parser.worker.ts', import.meta.url), {
        type: 'module',
      });

      worker.onmessage = (event: MessageEvent<{ text: string; error: string | null }>) => {
        const { text, error } = event.data;
        if (error) {
          reject(new Error(error));
        } else {
          resolve({
            text,
            fileName: file.name,
            fileType: this.getFileExtension(file.name),
          });
        }
        worker.terminate();
      };

      worker.onerror = (error) => {
        reject(new Error(`Worker error: ${error.message}`));
        worker.terminate();
      };

      worker.postMessage({ file });
    });
  }

  private getFileExtension(fileName: string): string {
    return fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  }
}

export const documentService = new DocumentService();

