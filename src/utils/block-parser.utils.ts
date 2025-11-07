import { v4 as uuidv4 } from 'uuid';
import { ContractBlock } from '@/types/document.types';

const TARGET_WORDS_PER_BLOCK = 200;
const MIN_WORDS_PER_BLOCK = 150;

/**
 * Parse contract text into blocks of approximately 200 words each
 */
export const parseContractIntoBlocks = (contractText: string): ContractBlock[] => {
  if (!contractText || contractText.trim().length === 0) {
    return [];
  }

  const blocks: ContractBlock[] = [];
  const paragraphs = contractText.split('\n\n').filter(p => p.trim().length > 0);

  let currentBlockContent: string[] = [];
  let currentWordCount = 0;
  let blockNumber = 1;
  let startIndex = 0;

  paragraphs.forEach((paragraph, index) => {
    const paragraphWords = paragraph.trim().split(/\s+/).length;

    // Add paragraph to current block
    currentBlockContent.push(paragraph);
    currentWordCount += paragraphWords;

    // Check if we should create a block
    const shouldCreateBlock =
      currentWordCount >= TARGET_WORDS_PER_BLOCK ||
      index === paragraphs.length - 1; // Last paragraph

    if (shouldCreateBlock && currentWordCount >= MIN_WORDS_PER_BLOCK) {
      const content = currentBlockContent.join('\n\n');
      const endIndex = startIndex + content.length;

      blocks.push({
        id: uuidv4(),
        content,
        blockNumber,
        wordCount: currentWordCount,
        startIndex,
        endIndex
      });

      // Reset for next block
      startIndex = endIndex;
      currentBlockContent = [];
      currentWordCount = 0;
      blockNumber++;
    }
  });

  // Handle any remaining content (if less than MIN_WORDS_PER_BLOCK)
  if (currentBlockContent.length > 0) {
    const content = currentBlockContent.join('\n\n');
    blocks.push({
      id: uuidv4(),
      content,
      blockNumber,
      wordCount: currentWordCount,
      startIndex,
      endIndex: startIndex + content.length
    });
  }

  return blocks;
};

/**
 * Find which block contains a specific text
 */
export const findBlockContainingText = (
  blocks: ContractBlock[],
  searchText: string
): ContractBlock | null => {
  const normalizedSearch = searchText.trim().replace(/\s+/g, ' ').toLowerCase();

  for (const block of blocks) {
    const normalizedContent = block.content.trim().replace(/\s+/g, ' ').toLowerCase();
    if (normalizedContent.includes(normalizedSearch)) {
      return block;
    }
  }

  return null;
};

/**
 * Get block by block number
 */
export const getBlockByNumber = (
  blocks: ContractBlock[],
  blockNumber: number
): ContractBlock | null => {
  return blocks.find(block => block.blockNumber === blockNumber) || null;
};
