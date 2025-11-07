export interface Finding {
  id: string;
  originalText: string;
  occurrenceIndex: number;
  risk: string;
  suggestedRedline: string;
  status: 'pending' | 'accepted' | 'dismissed';
  refinementCount?: number;
}

export type FindingStatus = Finding['status'];
