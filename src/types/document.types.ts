export interface ParsedDocument {
  text: string;
  fileName: string;
  fileType: string;
}

export type SupportedFileType = '.docx' | '.pdf' | '.txt' | '.md';

export interface ExportOptions {
  format: 'docx' | 'pdf' | 'txt';
  includeTrackChanges: boolean;
}

export interface ContractBlock {
  id: string;
  content: string;
  blockNumber: number;
  wordCount: number;
  startIndex: number;
  endIndex: number;
}
