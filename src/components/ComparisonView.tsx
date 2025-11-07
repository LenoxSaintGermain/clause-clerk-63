import { useState, useEffect, useRef } from 'react';
import { diffService } from '@/services/diff.service';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { FileText, GitCompare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ComparisonViewProps {
  originalContract: string;
  currentContract: string;
  fileName: string;
}

export const ComparisonView = ({ originalContract, currentContract, fileName }: ComparisonViewProps) => {
  const [diffHtml, setDiffHtml] = useState('');
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const hasChanges = originalContract !== currentContract;

  const syncLeftToRight = () => {
    if (!leftPanelRef.current || !rightPanelRef.current) return;
    const rightEl = rightPanelRef.current;
    const leftEl = leftPanelRef.current;

    const rightMax = rightEl.scrollHeight - rightEl.clientHeight;
    const leftMax = leftEl.scrollHeight - leftEl.clientHeight;

    if (rightMax <= 0 || leftMax <= 0) return;

    const ratio = rightEl.scrollTop / rightMax;
    const nextLeftTop = Math.max(0, Math.min(leftMax, ratio * leftMax));
    syncingRef.current = true;
    leftEl.scrollTop = nextLeftTop;
  };

  const handleRightScroll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      syncLeftToRight();
      requestAnimationFrame(() => {
        syncingRef.current = false;
      });
    });
  };

  useEffect(() => {
    if (hasChanges) {
      const html = diffService.getDiffHtml(originalContract, currentContract);
      setDiffHtml(html);
    }
  }, [originalContract, currentContract, hasChanges]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const paragraphs = originalContract.split('\n\n');
  const currentParagraphs = currentContract.split('\n\n');

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col bg-card rounded-lg border border-border shadow-sm">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <GitCompare className="w-5 h-5 text-accent" />
        <h2 className="font-semibold text-foreground">Comparison View - {fileName}</h2>
      </div>

      {!hasChanges ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <Alert className="max-w-md">
            <FileText className="h-4 w-4" />
            <AlertDescription>
              No changes yet. Accept redlines in Analysis view to see the comparison.
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="px-4 py-2 bg-muted/50 border-b border-border">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Original
                </h3>
              </div>
              <div
                ref={leftPanelRef}
                className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4"
              >
                {paragraphs.map((para, index) => (
                  <p
                    key={index}
                    className="text-sm leading-relaxed text-foreground"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="px-4 py-2 bg-muted/50 border-b border-border">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <GitCompare className="w-4 h-4" />
                  Redlined (with changes highlighted)
                </h3>
              </div>
              <div
                ref={rightPanelRef}
                onScroll={handleRightScroll}
                className="flex-1 overflow-y-auto overscroll-contain p-6 diff"
                dangerouslySetInnerHTML={{ __html: diffHtml }}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
};
