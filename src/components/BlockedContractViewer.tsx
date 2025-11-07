import { useEffect, useRef, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { ContractBlock } from './ContractBlock';
import { ContractBlock as ContractBlockType } from '@/types/document.types';
import { parseContractIntoBlocks, findBlockContainingText } from '@/utils/block-parser.utils';
import { scrollToBlockResponsive } from '@/utils/animation.utils';
import { useBlockHeight } from '@/hooks/use-block-height';

interface BlockedContractViewerProps {
  text: string;
  fileName: string;
  highlightedText?: string;
  selectedBlockId?: string | null;
  onBlocksGenerated?: (blocks: ContractBlockType[]) => void;
}

export const BlockedContractViewer = ({
  text,
  fileName,
  highlightedText,
  selectedBlockId,
  onBlocksGenerated
}: BlockedContractViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [isScrolling, setIsScrolling] = useState(false);
  const [passingBlockIds, setPassingBlockIds] = useState<Set<string>>(new Set());

  const blockHeight = useBlockHeight();
  const isMobile = window.innerWidth < 768;

  // Parse contract into blocks
  const blocks = useMemo(() => {
    const parsed = parseContractIntoBlocks(text);
    onBlocksGenerated?.(parsed);
    return parsed;
  }, [text, onBlocksGenerated]);

  // Scroll to block when highlighted text changes
  useEffect(() => {
    if (!highlightedText || !containerRef.current || isScrolling) return;

    const targetBlock = findBlockContainingText(blocks, highlightedText);
    if (!targetBlock) return;

    const blockElement = blockRefs.current.get(targetBlock.id);
    if (!blockElement) return;

    setIsScrolling(true);

    // Calculate scroll position
    const containerTop = containerRef.current.scrollTop;
    const blockTop = blockElement.offsetTop;
    const containerHeight = containerRef.current.clientHeight;
    const targetScroll = blockTop - (containerHeight / 3);

    // Animate scroll
    scrollToBlockResponsive(
      containerRef.current,
      Math.max(0, targetScroll),
      isMobile
    ).then(() => {
      setTimeout(() => {
        setIsScrolling(false);
        setPassingBlockIds(new Set());
      }, 300);
    });

    // Mark passing blocks during scroll
    const currentBlockIndex = blocks.findIndex(b => b.id === targetBlock.id);
    const currentVisibleBlock = blocks.find(b => {
      const el = blockRefs.current.get(b.id);
      if (!el) return false;
      const top = el.offsetTop;
      return top >= containerTop && top <= containerTop + containerHeight;
    });
    const startIndex = blocks.findIndex(b => b.id === currentVisibleBlock?.id);

    if (startIndex !== -1 && currentBlockIndex !== -1) {
      const passing = new Set<string>();
      const start = Math.min(startIndex, currentBlockIndex);
      const end = Math.max(startIndex, currentBlockIndex);
      for (let i = start; i < end; i++) {
        passing.add(blocks[i].id);
      }
      setPassingBlockIds(passing);
    }
  }, [highlightedText, blocks, isScrolling, isMobile]);

  const setBlockRef = (blockId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      blockRefs.current.set(blockId, el);
    } else {
      blockRefs.current.delete(blockId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border border-border shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3 shrink-0">
        <FileText className="w-5 h-5 text-accent" />
        <h2 className="font-semibold text-foreground">{fileName}</h2>
        <span className="text-xs text-muted-foreground ml-auto">
          {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}
        </span>
      </div>

      {/* Blocks container */}
      <div
        id="blocked-contract-viewer"
        ref={containerRef}
        className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4"
      >
        {blocks.map((block) => (
          <ContractBlock
            key={block.id}
            ref={setBlockRef(block.id)}
            block={block}
            height={blockHeight}
            isSelected={selectedBlockId === block.id || (highlightedText ? block.content.toLowerCase().includes(highlightedText.toLowerCase()) : false)}
            highlightedText={highlightedText}
            isPassing={!isMobile && passingBlockIds.has(block.id)}
          />
        ))}
      </div>
    </div>
  );
};
