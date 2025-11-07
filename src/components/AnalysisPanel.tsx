import { useState, useRef, useEffect } from 'react';
import { Finding } from '@/types/finding.types';
import { ContractBlock } from '@/types/document.types';
import { FindingCard } from './FindingCard';
import { AcceptAllDialog } from './AcceptAllDialog';
import { ConnectionLine } from './ConnectionLine';
import { Button } from '@/components/ui/button';
import { CheckCheck, FileSearch, Undo2 } from 'lucide-react';
import { useConnectionCoords } from '@/hooks/use-connection-coords';

interface AnalysisPanelProps {
  findings: Finding[];
  onAccept: (id: string, redline: string) => void;
  onDismiss: (id: string) => void;
  onAcceptAll: () => void;
  onHighlight: (text: string) => void;
  onUpdateRedline: (id: string, redline: string) => void;
  onSelect: (id: string) => void;
  onSelectBlock: (text: string) => void;
  selectedFindingId: string | null;
  canUndo: boolean;
  onUndo: () => void;
  blockRefs?: Map<string, HTMLDivElement>;
  contractBlocks?: ContractBlock[];
}

export const AnalysisPanel = ({ 
  findings, 
  onAccept, 
  onDismiss, 
  onAcceptAll,
  onHighlight,
  onUpdateRedline,
  onSelect,
  onSelectBlock,
  selectedFindingId,
  canUndo,
  onUndo,
  blockRefs,
  contractBlocks
}: AnalysisPanelProps) => {
  const [showAcceptAllDialog, setShowAcceptAllDialog] = useState(false);
  const findingCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const pendingFindings = findings.filter(f => f.status === 'pending');
  const hasFindings = findings.length > 0;
  const hasPendingFindings = pendingFindings.length > 0;

  // Get refs for selected finding and target block
  const selectedFindingRef = selectedFindingId 
    ? findingCardRefs.current.get(selectedFindingId) 
    : null;
  
  const selectedFinding = findings.find(f => f.id === selectedFindingId);
  const targetBlockId = selectedFinding && contractBlocks && blockRefs
    ? contractBlocks.find(b => 
        b.content.toLowerCase().includes(selectedFinding.originalText.toLowerCase())
      )?.id
    : null;
  
  const targetBlockRef = targetBlockId && blockRefs
    ? blockRefs.get(targetBlockId) || null
    : null;

  // Calculate connection coordinates
  const sourceRef = useRef<HTMLElement | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    sourceRef.current = selectedFindingRef;
    targetRef.current = targetBlockRef;
  }, [selectedFindingRef, targetBlockRef]);

  const coords = useConnectionCoords(
    sourceRef as React.RefObject<HTMLElement>,
    targetRef as React.RefObject<HTMLElement>,
    !!selectedFindingId && !!targetBlockRef
  );

  // Handle responsive
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAcceptAllClick = () => {
    setShowAcceptAllDialog(true);
  };

  const handleConfirmAcceptAll = () => {
    setShowAcceptAllDialog(false);
    onAcceptAll();
  };

  return (
    <>
      <ConnectionLine 
        coords={coords} 
        isVisible={!!selectedFindingId && !!targetBlockRef} 
        isMobile={isMobile}
      />
      <div className="h-full flex flex-col bg-card rounded-lg border border-border shadow-sm">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Analysis Results</h2>
          <div className="flex items-center gap-2">
            {canUndo && (
              <Button
                onClick={onUndo}
                size="sm"
                variant="outline"
                className="hover:bg-accent/10"
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Undo All
              </Button>
            )}
            {hasPendingFindings && (
              <Button
                onClick={handleAcceptAllClick}
                size="sm"
                className="bg-accent hover:bg-accent/90"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Accept All ({pendingFindings.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
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
              ref={(el) => {
                if (el) {
                  findingCardRefs.current.set(finding.id, el);
                } else {
                  findingCardRefs.current.delete(finding.id);
                }
              }}
              finding={finding}
              onAccept={onAccept}
              onDismiss={onDismiss}
              onHighlight={onHighlight}
              onUpdateRedline={onUpdateRedline}
              onSelect={onSelect}
              onSelectBlock={onSelectBlock}
              isSelected={selectedFindingId === finding.id}
            />
          ))
        )}
      </div>

      <AcceptAllDialog
        open={showAcceptAllDialog}
        onOpenChange={setShowAcceptAllDialog}
        onConfirm={handleConfirmAcceptAll}
        count={pendingFindings.length}
      />
      </div>
    </>
  );
};
