export interface Finding {
  id: string;
  originalText: string;
  risk: string;
  suggestedRedline: string;
  status: 'pending' | 'accepted' | 'dismissed';
}

export type FindingStatus = Finding['status'];
