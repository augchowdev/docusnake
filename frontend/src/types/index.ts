export interface User {
  userId: string;
  username: string;
  email: string;
  token: string;
}

export interface AuthResponse {
  Token: string;
  Username: string;
  Email: string;
  UserId: string;
}

export interface LoginRequest {
  Email: string;
  Password: string;
}

export interface RegisterRequest {
  Username: string;
  Email: string;
  Password: string;
}

export interface Document {
  Id: string;
  UserId: string;
  FolderId?: string | null;
  Name: string;
  OriginalImagePath?: string | null;
  ExtractedText?: string | null;
  ExtractedData?: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  FolderName?: string | null;
}

export interface CreateDocumentRequest {
  Name: string;
  FolderId?: string | null;
  OriginalImagePath?: string | null;
  ExtractedText?: string | null;
}

export interface UpdateDocumentRequest {
  Name: string;
  FolderId?: string | null;
  OriginalImagePath?: string | null;
  ExtractedText?: string | null;
  ExtractedData?: string | null;
}

export interface Folder {
  Id: string;
  UserId: string;
  ParentFolderId?: string | null;
  Name: string;
  CreatedAt: string;
  Children: Folder[];
  Documents: Document[];
}

export interface CreateFolderRequest {
  Name: string;
  ParentFolderId?: string | null;
}

export interface UpdateFolderRequest {
  Name: string;
  ParentFolderId?: string | null;
}

export type ExportFormat = 'excel' | 'csv';

export interface ExtractedDataMap {
  [key: string]: string;
}
