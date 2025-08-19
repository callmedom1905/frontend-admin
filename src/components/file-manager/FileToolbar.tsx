'use client';

import React from 'react';
import { FileItem, FileViewMode } from '@/types/file-manager';

interface FileToolbarProps {
  currentPath: string;
  selectedFiles: FileItem[];
  viewMode: FileViewMode;
  onUpload: () => void;
  onDelete: () => void;
  onNewFolder: () => void;
  onViewModeChange: (mode: FileViewMode) => void;
  onDownload: () => void;
}

export const FileToolbar: React.FC<FileToolbarProps> = ({
  currentPath,
  selectedFiles,
  viewMode,
  onUpload,
  onDelete,
  onNewFolder,
  onViewModeChange,
  onDownload,
}) => {
  const hasSelection = selectedFiles.length > 0;
  const canDownload = selectedFiles.length === 1 && selectedFiles[0].is_file;

  return (
    <div className="flex items-center justify-between border-b border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onUpload}
          className="flex items-center gap-2 rounded-lg bg-[#3E2723] px-4 py-2 text-sm font-medium text-[#FAF3E0] hover:bg-[#D4AF37] transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Upload
        </button>

        <button
          type="button"
          onClick={onNewFolder}
          className="flex items-center gap-2 rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-boxdark-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          New Folder
        </button>

        {hasSelection && (
          <>
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-2 rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-danger hover:bg-red-50 dark:border-strokedark dark:hover:bg-red-900/20"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete ({selectedFiles.length})
            </button>

            {canDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="flex items-center gap-2 rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-boxdark-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
              viewMode === 'grid'
                ? 'bg-[#3E2723] text-[#FAF3E0]'
                : 'text-bodydark2 hover:text-black dark:hover:text-white'
            }`}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
              viewMode === 'list'
                ? 'bg-[#3E2723] text-[#FAF3E0]'
                : 'text-bodydark2 hover:text-black dark:hover:text-white'
            }`}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}; 