import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { documentService } from '@/services/document.service';
import { ParsedDocument } from '@/types/document.types';

interface FileUploaderProps {
  onFileLoaded: (document: ParsedDocument) => void;
  isProcessing: boolean;
}

export const FileUploader = ({ onFileLoaded, isProcessing }: FileUploaderProps) => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    try {
      toast.loading('Parsing document...', { id: 'parse' });
      const parsed = await documentService.parseFile(file);
      toast.success('Document loaded successfully', { id: 'parse' });
      onFileLoaded(parsed);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to parse document',
        { id: 'parse' }
      );
    }
  }, [onFileLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
        transition-all duration-200
        ${isDragActive 
          ? 'border-accent bg-accent/5 scale-[1.02]' 
          : 'border-border hover:border-accent/50 hover:bg-accent/5'
        }
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center gap-4">
        {isDragActive ? (
          <>
            <FileText className="w-16 h-16 text-accent animate-pulse" />
            <p className="text-lg font-medium text-accent">Drop your contract here</p>
          </>
        ) : (
          <>
            <Upload className="w-16 h-16 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium text-foreground mb-2">
                Drop your contract here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports DOCX, PDF, TXT, and MD files
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
