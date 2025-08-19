'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileGrid } from './FileGrid';
import { FileList } from './FileList';
import { FileToolbar } from './FileToolbar';
import { FileUpload } from './FileUpload';
import { FilePreview } from './FilePreview';
import { FileBreadcrumb } from './FileBreadcrumb';
import { useFileManager } from '@/hooks/useFileManager';
import { FileItem, FileViewMode } from '@/types/file-manager';

interface ImageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  title?: string;
}

// Custom FileManager component for ImageSelector
const ImageFileManager: React.FC<{
  onFileClick: (file: FileItem) => void;
  onFileDoubleClick: (file: FileItem) => void;
  onFileSelect: (file: FileItem, isSelected: boolean) => void;
  onClearSelection: () => void;
  selectedFiles: FileItem[];
  selectedImage: FileItem | null;
  onCancel: () => void;
  onConfirm: () => void;
  resetPathTrigger?: any;
}> = ({ onFileClick, onFileDoubleClick, onFileSelect, onClearSelection, selectedFiles, selectedImage, onCancel, onConfirm, resetPathTrigger }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    files,
    currentPath,
    viewMode,
    isLoading,
    error,
    loadFiles,
    uploadFile,
    deleteFiles,
    createFolder,
    renameFile,
    moveFiles,
    copyFiles,
    downloadFile,
    setCurrentPath,
    setSelectedFiles,
    setViewMode,
  } = useFileManager();

  const [showUpload, setShowUpload] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const handleFileClick = (file: FileItem) => {
    onFileClick(file);
  };

  const handleFileDoubleClick = (file: FileItem) => {
    if (!file.is_file) {
      let newPath = currentPath;
      if (!newPath.endsWith('/') && newPath !== '') newPath += '/';
      newPath = newPath + file.name;
      if (!newPath.startsWith('/')) newPath = '/' + newPath;
      setCurrentPath(newPath);
    } else {
      onFileDoubleClick(file);
    }
  };

  const handleFileSelect = (file: FileItem, isSelected: boolean) => {
    onFileSelect(file, isSelected);
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    loadFiles();
  };

  const handleNewFolder = () => {
    setShowNewFolder(true);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || isCreatingFolder) return;
    setIsCreatingFolder(true);
    try {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleClearSelection = () => {
    onClearSelection();
  };

  return (
    <div ref={containerRef} className="flex h-[714px] flex-col">
      {/* Toolbar */}
      <FileToolbar
        currentPath={currentPath}
        selectedFiles={selectedFiles}
        viewMode={viewMode}
        onUpload={() => setShowUpload(true)}
        onDelete={() => deleteFiles(selectedFiles.map(f => f.name))}
        onNewFolder={handleNewFolder}
        onViewModeChange={setViewMode}
        onDownload={() => {
          if (selectedFiles.length === 1) {
            downloadFile(selectedFiles[0]);
          }
        }}
      />

      {/* Breadcrumb */}
      <FileBreadcrumb
        currentPath={currentPath}
        onPathChange={setCurrentPath}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3E2723] border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-red-500">
            {error}
          </div>
        ) : (
          <div className="h-full overflow-auto">
            {viewMode === 'grid' ? (
              <FileGrid
                files={files}
                selectedFiles={selectedFiles}
                onFileClick={handleFileClick}
                onFileDoubleClick={handleFileDoubleClick}
                onFileSelect={handleFileSelect}
                onClearSelection={handleClearSelection}
              />
            ) : (
              <FileList
                files={files}
                selectedFiles={selectedFiles}
                onFileClick={handleFileClick}
                onFileDoubleClick={handleFileDoubleClick}
                onFileSelect={handleFileSelect}
                onClearSelection={handleClearSelection}
              />
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <FileUpload
          currentPath={currentPath}
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Preview Modal */}
      {showPreview && previewFile && (
        <FilePreview
          file={previewFile}
          onClose={() => {
            setShowPreview(false);
            setPreviewFile(null);
          }}
        />
      )}

      {/* New Folder Modal */}
      {showNewFolder && (
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
                Create New Folder
              </h3>
              <button
                onClick={() => setShowNewFolder(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-black dark:hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full rounded-lg border border-stroke px-4 py-2 text-black focus:border-[#E6C67A] focus:outline-none dark:border-strokedark dark:bg-boxdark dark:text-white"
                placeholder="Enter folder name"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  }
                }}
                autoFocus
              />
            </div>

            <div className="flex gap-3 w-full mt-2">
              <button
                type="button"
                onClick={() => setShowNewFolder(false)}
                className="flex-1 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 font-medium hover:bg-gray-100 transition dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-boxdark-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || isCreatingFolder}
                className="flex-1 py-2 rounded-lg bg-[#3E2723] text-[#FAF3E0] font-medium hover:bg-[#D4AF37] transition disabled:opacity-50 flex items-center justify-center"
              >
                {isCreatingFolder ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-[#FAF3E0]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create'
                )}
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
      )}

      {/* Nút chọn ảnh và huỷ nằm trong modal cha */}
      <div className="flex gap-3 w-full mt-6">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 font-medium hover:bg-gray-100 transition dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-boxdark-2"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={!selectedImage}
          className="flex-1 py-2 rounded-lg bg-[#3E2723] text-[#FAF3E0] font-medium hover:bg-[#D4AF37] transition disabled:opacity-50"
        >
          Select Image
        </button>
      </div>
    </div>
  );
};

export const ImageSelector: React.FC<ImageSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = "Chọn hình ảnh"
}) => {
  const [selectedImage, setSelectedImage] = useState<FileItem | null>(null);
  const {
    setSelectedFiles,
  } = useFileManager();

  useEffect(() => {
    if (isOpen) {
      setSelectedImage(null);
      setSelectedFiles([]);
    }
  }, [isOpen]);

  const handleFileClick = (file: FileItem) => {
    if (file.is_image) {
      setSelectedImage(file);
      setSelectedFiles([file]);
    }
  };

  const handleFileDoubleClick = (file: FileItem) => {
    if (file.is_file && file.is_image) {
      // Nếu là ảnh thì chọn luôn
      setSelectedImage(file);
      setSelectedFiles([file]);
    } else if (!file.is_file) {
      // Nếu là folder thì mở folder
      // FileManager sẽ tự xử lý việc này
    }
  };

  const handleFileSelect = (file: FileItem, isSelected: boolean) => {
    if (file.is_image) {
      if (isSelected) {
        setSelectedImage(file);
        setSelectedFiles([file]);
      } else {
        setSelectedImage(null);
        setSelectedFiles([]);
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedImage(null);
    setSelectedFiles([]);
  };

  const handleConfirmSelection = () => {
    if (selectedImage) {
      onSelect(selectedImage.url);
      onClose();
      setSelectedImage(null);
      setSelectedFiles([]);
    }
  };

  const handleCancel = () => {
    onClose();
    setSelectedImage(null);
    setSelectedFiles([]);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/30 transition-opacity duration-200"
      style={{ animation: "fadeInModal 0.25s" }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-8 max-w-6xl w-full h-[90vh] relative transition-transform duration-200 dark:bg-boxdark"
        style={{ animation: "scaleInModal 0.25s" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black dark:text-white">
            {title}
          </h3>
          <button
            onClick={handleCancel}
            className="absolute top-3 right-3 text-gray-400 hover:text-black dark:hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 h-full">
          <ImageFileManager
            onFileClick={handleFileClick}
            onFileDoubleClick={handleFileDoubleClick}
            onFileSelect={handleFileSelect}
            onClearSelection={handleClearSelection}
            selectedFiles={selectedImage ? [selectedImage] : []}
            selectedImage={selectedImage}
            onCancel={handleCancel}
            onConfirm={handleConfirmSelection}
            resetPathTrigger={isOpen}
          />
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