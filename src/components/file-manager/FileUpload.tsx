'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileItem } from '@/types/file-manager';
import { apiClient } from '@/lib/apiClient';

interface FileUploadProps {
  currentPath: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  currentPath,
  onClose,
  onSuccess,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    setUploadProgress({});

    try {
      for (const file of acceptedFiles) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const formData = new FormData();
        formData.append('upload', file);
        formData.append('working_dir', currentPath);
        formData.append('type', 'Files');

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min(prev[file.name] + 10, 90)
          }));
        }, 100);

        try {
          await apiClient.post('/file-manager/upload', formData);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        } catch (error) {
          console.error('Upload failed for', file.name, error);
          setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
        } finally {
          clearInterval(progressInterval);
        }
      }

      // Wait a bit to show 100% progress
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }, [currentPath, onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/30 transition-opacity duration-200"
      style={{ animation: "fadeInModal 0.25s" }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full relative transition-transform duration-200 dark:bg-boxdark"
        style={{ animation: "scaleInModal 0.25s" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black dark:text-white">
            Upload Files
          </h3>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-black dark:hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          {...getRootProps()}
          className={`mb-4 cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragActive
              ? 'border-[#E6C67A] bg-[#E6C67A]/5'
              : 'border-gray-300 hover:border-[#E6C67A] dark:border-strokedark'
          }`}
        >
          <input {...getInputProps()} />
          <svg
            className="mx-auto mb-4 h-12 w-12 text-gray-400"
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
          {isDragActive ? (
            <p className="text-lg font-medium text-[#3E2723]">Drop files here...</p>
          ) : (
            <div>
              <p className="text-lg font-medium text-black dark:text-white">
                Drag & drop files here
              </p>
              <p className="text-sm text-gray-500 dark:text-bodydark2">
                or click to select files
              </p>
            </div>
          )}
        </div>

        {Object.keys(uploadProgress).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-black dark:text-white">Upload Progress:</h4>
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-black dark:text-white">{fileName}</span>
                  <span className="text-gray-500 dark:text-bodydark2">
                    {progress === -1 ? 'Failed' : `${progress}%`}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-strokedark">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      progress === -1
                        ? 'bg-red-500'
                        : progress === 100
                        ? 'bg-green-500'
                        : 'bg-[#3E2723]'
                    }`}
                    style={{ width: `${Math.max(0, progress)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {uploading && (
          <div className="mt-4 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#3E2723] border-t-transparent"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-bodydark2">
              Uploading files...
            </p>
          </div>
        )}

        <div className="flex gap-3 w-full mt-6">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 font-medium hover:bg-gray-100 transition dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-boxdark-2"
          >
            Cancel
          </button>
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