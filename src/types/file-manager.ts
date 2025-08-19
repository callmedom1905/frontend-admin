export interface FileItem {
  name: string;
  url: string;
  time: string;
  icon: string;
  is_file: boolean;
  is_image: boolean;
  thumb_url?: string;
  size?: number;
  type?: string;
}

export type FileViewMode = 'grid' | 'list';

export interface FileManagerState {
  files: FileItem[];
  currentPath: string;
  selectedFiles: FileItem[];
  viewMode: FileViewMode;
  isLoading: boolean;
  error: string | null;
}

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
} 