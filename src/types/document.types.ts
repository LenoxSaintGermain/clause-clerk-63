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
