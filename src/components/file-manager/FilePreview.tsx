'use client';

import React, { useState } from 'react';
import { FileItem } from '@/types/file-manager';
import { apiClient } from '@/lib/apiClient';

interface FilePreviewProps {
  file: FileItem;
  onClose: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const isImage = file.is_image;
  const isPdf = file.name.toLowerCase().endsWith('.pdf');
  const isText = file.name.toLowerCase().match(/\.(txt|md|js|ts|jsx|tsx|css|html|php|json)$/);

  const downloadFile = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      // Tạo URL download từ Laravel File Manager API
      const downloadUrl = `${apiClient.getBaseUrl()}/api/file-manager/download?file=${encodeURIComponent(file.name)}`;
      
      // Lấy token từ cookie
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      
      // Tạo headers với authentication
      const headers: Record<string, string> = {
        'Accept': 'application/octet-stream',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Fetch file với authentication
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      // Lấy blob từ response
      const blob = await response.blob();
      
      // Tạo URL cho blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Tạo thẻ a để download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.name;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup blob URL
      window.URL.revokeObjectURL(blobUrl);
      
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: mở file trong tab mới nếu download API không hoạt động
      window.open(file.url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderPreview = () => {
    if (isImage) {
      return (
        <div className="flex justify-center">
          <img
            src={file.url}
            alt={file.name}
            className="max-h-96 max-w-full rounded-lg object-contain"
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="flex justify-center">
          <iframe
            src={file.url}
            className="h-96 w-full rounded-lg border"
            title={file.name}
          />
        </div>
      );
    }

    if (isText) {
      return (
        <div className="h-96 overflow-auto rounded-lg border bg-gray-50 p-4 dark:bg-boxdark-2">
          <pre className="text-sm text-black dark:text-white">
            {/* For text files, you might want to fetch the content */}
            <code>Preview not available for this file type.</code>
          </pre>
        </div>
      );
    }

    return (
      <div className="flex h-96 items-center justify-center rounded-lg border bg-gray-50 dark:bg-boxdark-2">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm2 18H6V4h7v5h5v11H8z" />
          </svg>
          <p className="text-lg font-medium text-gray-600 dark:text-bodydark2">
            Preview not available
          </p>
          <p className="text-sm text-gray-500 dark:text-bodydark2">
            This file type cannot be previewed
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/30 transition-opacity duration-200"
      style={{ animation: "fadeInModal 0.25s" }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full relative transition-transform duration-200 dark:bg-boxdark"
        style={{ animation: "scaleInModal 0.25s" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white">
              {file.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-bodydark2">
              {new Date(Number(file.time) * 1000).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadFile}
              disabled={isDownloading}
              className="py-2 px-4 rounded-lg bg-[#3E2723] text-[#FAF3E0] font-medium hover:bg-[#D4AF37] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-black dark:hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-4">
          {renderPreview()}
        </div>

        <div className="rounded-lg bg-gray-50 p-4 dark:bg-boxdark-2">
          <h4 className="mb-2 font-medium text-black dark:text-white">File Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-bodydark2">Name:</span>
              <span className="ml-2 text-black dark:text-white">{file.name}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-bodydark2">Type:</span>
              <span className="ml-2 text-black dark:text-white">
                {file.is_file ? 'File' : 'Folder'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-bodydark2">Modified:</span>
              <span className="ml-2 text-black dark:text-white">
                {new Date(Number(file.time) * 1000).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-bodydark2">URL:</span>
              <span className="ml-2 text-black dark:text-white">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3E2723] hover:underline"
                >
                  View
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleInModal {
          from { opacity: 0; transform: scale(0.95);}
          to { opacity: 1; transform: scale(1);}
        }
      `}</style>
    </div>
  );
}; 