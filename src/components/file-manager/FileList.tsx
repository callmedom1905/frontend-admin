'use client';

import React from 'react';
import { FileItem } from '@/types/file-manager';

interface FileListProps {
  files: FileItem[];
  selectedFiles: FileItem[];
  onFileClick: (file: FileItem) => void;
  onFileDoubleClick: (file: FileItem) => void;
  onFileSelect: (file: FileItem, isSelected: boolean) => void;
  onClearSelection: () => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  selectedFiles,
  onFileClick,
  onFileDoubleClick,
  onFileSelect,
  onClearSelection,
}) => {
  const isSelected = (file: FileItem) => {
    return selectedFiles.some(f => f.name === file.name);
  };

  const handleFileClick = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    onFileClick(file);
  };

  const handleFileDoubleClick = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    onFileDoubleClick(file);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClearSelection();
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (file: FileItem) => {
    if (!file.is_file) {
      return (
        <svg className="h-6 w-6 text-[#3E2723]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
        </svg>
      );
    }

    if (file.is_image) {
      return (
        <div className="h-6 w-6 overflow-hidden rounded">
          <img
            src={file.thumb_url || file.url}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        </div>
      );
    }

    // File type icons
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return (
          <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM9 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
          </svg>
        );
      case 'doc':
      case 'docx':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
        );
      case 'xls':
      case 'xlsx':
        return (
          <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm2 18H6V4h7v5h5v11H8z" />
          </svg>
        );
    }
  };

  return (
    <div 
      className="overflow-hidden"
      onClick={handleContainerClick}
    >
      {files.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto mb-4 h-16 w-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
            </svg>
            <p className="text-lg font-medium text-gray-600 dark:text-bodydark2">
              Thư mục trống
            </p>
            <p className="text-sm text-gray-500 dark:text-bodydark2">
              Không có file hoặc thư mục nào trong thư mục này
            </p>
          </div>
        </div>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-boxdark-2">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-bodydark2">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-bodydark2">
                Size
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-bodydark2">
                Modified
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-strokedark dark:bg-boxdark">
            {files.map((file) => (
              <tr
                key={file.name}
                className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-boxdark-2 ${
                  isSelected(file) ? 'bg-[#E6C67A]/5' : ''
                }`}
                onClick={(e) => handleFileClick(e, file)}
                onDoubleClick={(e) => handleFileDoubleClick(e, file)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file)}
                    <span className="text-sm font-medium text-black dark:text-white">
                      {file.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-bodydark2">
                  {file.is_file ? formatFileSize(file.size) : '--'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-bodydark2">
                    {new Date(Number(file.time) * 1000).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}; 