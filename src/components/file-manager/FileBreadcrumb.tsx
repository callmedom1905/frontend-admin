'use client';

import React from 'react';

interface FileBreadcrumbProps {
  currentPath: string;
  onPathChange: (path: string) => void;
}

export const FileBreadcrumb: React.FC<FileBreadcrumbProps> = ({
  currentPath,
  onPathChange,
}) => {
  const pathParts = currentPath.split('/').filter(Boolean);

  const handlePathClick = (index: number) => {
    const newPath = pathParts.slice(0, index + 1).join('/');
    onPathChange(newPath);
  };

  return (
    <div className="flex items-center gap-2 border-b border-stroke bg-gray-50 px-4 py-2 dark:border-strokedark dark:bg-boxdark-2">
      <button
        type= "button"
        onClick={() => onPathChange('')}
        className="flex items-center gap-1 text-sm font-medium text-[#3E2723] hover:text-[#D4AF37] transition-colors"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
        Home
      </button>

      {pathParts.map((part, index) => (
        <React.Fragment key={index}>
          <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>
          <button
            onClick={() => handlePathClick(index)}
            className="text-sm font-medium text-gray-600 hover:text-[#3E2723] transition-colors dark:text-bodydark2 dark:hover:text-white"
          >
            {part}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}; 