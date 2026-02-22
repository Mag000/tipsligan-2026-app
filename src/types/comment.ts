export interface ChronicleComment {
  id: number;
  text: string;
  authorId: number;
  authorAlias: string;
  chronicleEntryId: number;
  createdDate: string; // ISO 8601
  lastEditedDate?: string;
  editedById?: number;
  editedByAlias?: string;
}

export interface CreateCommentRequest {
  text: string;
}

export interface UpdateCommentRequest {
  text: string;
}

export interface ChronicleCommentsResponse {
  comments: ChronicleComment[];
  totalCount: number;
  hasMore: boolean;
}
