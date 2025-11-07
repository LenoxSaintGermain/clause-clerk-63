import { forwardRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ContractBlock as ContractBlockType } from '@/types/document.types';
import { highlightText } from '@/utils/highlighter';

interface ContractBlockProps {
  block: ContractBlockType;
  height: number;
  isSelected: boolean;
  highlightedText?: string;
  isPassing?: boolean;
}

export const ContractBlock = forwardRef<HTMLDivElement, ContractBlockProps>(
  ({ block, height, isSelected, highlightedText, isPassing = false }, ref) => {
    const displayContent = highlightedText && isSelected
      ? highlightText(block.content, highlightedText)
      : block.content;

    const paragraphs = displayContent.split('\n\n');

    return (
      <Card
        ref={ref}
        data-block-id={block.id}
        data-block-number={block.blockNumber}
        className={`relative transition-all duration-300 ${
          isSelected
            ? 'border-l-4 border-l-accent bg-accent/5'
            : 'border-border'
        } ${
          isPassing ? 'opacity-70' : 'opacity-100'
        }`}
        style={{
          height: `${height}px`,
          minHeight: `${height}px`,
          maxHeight: `${height}px`
        }}
      >
        {/* Block number badge */}
        <div className="absolute top-2 right-2 z-10">
          <Badge
            variant={isSelected ? 'default' : 'secondary'}
            className="text-xs"
          >
            Block {block.blockNumber}
          </Badge>
        </div>

        {/* Content with scroll */}
        <div className="h-full overflow-y-auto overscroll-contain p-6 pr-20 space-y-4">
          {paragraphs.map((para, index) => (
            <p
              key={index}
              className="text-sm leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: para }}
            />
          ))}
        </div>
      </Card>
    );
  }
);

ContractBlock.displayName = 'ContractBlock';
