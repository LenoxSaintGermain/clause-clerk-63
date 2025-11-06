import { Finding } from '@/types/finding.types';
import { FindingCard } from './FindingCard';
import { Button } from '@/components/ui/button';
import { CheckCheck, FileSearch } from 'lucide-react';

interface AnalysisPanelProps {
  findings: Finding[];
  onAccept: (id: string, redline: string) => void;
  onDismiss: (id: string) => void;
  onAcceptAll: () => void;
  onHighlight: (text: string) => void;
}

export const AnalysisPanel = ({ 
  findings, 
  onAccept, 
  onDismiss, 
  onAcceptAll,
  onHighlight 
}: AnalysisPanelProps) => {
  const pendingFindings = findings.filter(f => f.status === 'pending');
  const hasFindings = findings.length > 0;
  const hasPendingFindings = pendingFindings.length > 0;

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border border-border shadow-sm">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Analysis Results</h2>
          {hasPendingFindings && (
            <Button
              onClick={onAcceptAll}
              size="sm"
              className="bg-accent hover:bg-accent/90"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Accept All ({pendingFindings.length})
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasFindings ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <FileSearch className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Analysis Yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Upload a contract and click "Analyze" to identify risks and generate redline suggestions
            </p>
          </div>
        ) : findings.every(f => f.status === 'dismissed') ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <CheckCheck className="w-16 h-16 text-success mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              All Clear!
            </h3>
            <p className="text-sm text-muted-foreground">
              All findings have been reviewed
            </p>
          </div>
        ) : (
          findings.map(finding => (
            <FindingCard
              key={finding.id}
              finding={finding}
              onAccept={onAccept}
              onDismiss={onDismiss}
              onHighlight={onHighlight}
            />
          ))
        )}
      </div>
    </div>
  );
};
