export interface ChronicleEntry {
  id: number;
  title: string;
  content: string; // Sanitized HTML
  authorId: number;
  authorAlias: string;
  createdDate: string; // ISO 8601
  lastEditedDate?: string;
  editedById?: number;
  editedByAlias?: string;
  commentCount?: number;
}

export interface CreateChronicleEntryRequest {
  title: string;
  content: string; // HTML
}

export interface UpdateChronicleEntryRequest {
  title: string;
  content: string; // HTML
}

export interface ChronicleEntriesResponse {
  entries: ChronicleEntry[];
  totalCount: number;
}
