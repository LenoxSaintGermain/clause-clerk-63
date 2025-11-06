import { useState, useEffect } from 'react';
import { highlightText } from '@/utils/highlighter';
import { FileText } from 'lucide-react';

interface ContractViewerProps {
  text: string;
  fileName: string;
  highlightedText?: string;
}

export const ContractViewer = ({ text, fileName, highlightedText }: ContractViewerProps) => {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (highlightedText) {
      setDisplayText(highlightText(text, highlightedText));
    } else {
      setDisplayText(text);
    }
  }, [text, highlightedText]);

  const paragraphs = displayText.split('\n\n');

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border border-border shadow-sm">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <FileText className="w-5 h-5 text-accent" />
        <h2 className="font-semibold text-foreground">{fileName}</h2>
      </div>
      
      <div 
        id="contract-viewer"
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {paragraphs.map((para, index) => (
          <p
            key={index}
            className="text-sm leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: para }}
          />
        ))}
      </div>
    </div>
  );
};
