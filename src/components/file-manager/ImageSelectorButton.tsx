'use client';

import React, { useState } from 'react';
import { ImageSelector } from './ImageSelector';

interface ImageSelectorButtonProps {
  // Props cho button
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  
  // Props cho preview
  showPreview?: boolean;
  previewClassName?: string;
  previewStyle?: React.CSSProperties;
  previewSize?: 'sm' | 'md' | 'lg' | 'xl';
  
  // Props cho ImageSelector
  title?: string;
  onImageSelect: (imageUrl: string) => void;
  onImageRemove?: () => void;
  
  // Props cho trạng thái
  selectedImage?: string | null;
  disabled?: boolean;
  
  // Props cho layout
  layout?: 'vertical' | 'horizontal';
  gap?: number;
  
  // Props cho responsive
  responsive?: boolean;
  
  // Props cho children (custom content)
  children?: React.ReactNode;
}

export const ImageSelectorButton: React.FC<ImageSelectorButtonProps> = ({
  buttonText = "Chọn ảnh từ thư viện",
  buttonIcon,
  buttonClassName = "",
  buttonStyle = {},
  
  showPreview = true,
  previewClassName = "",
  previewStyle = {},
  previewSize = 'md',
  
  title = "Chọn hình ảnh",
  onImageSelect,
  onImageRemove,
  
  selectedImage,
  disabled = false,
  
  layout = 'vertical',
  gap = 4,
  
  responsive = true,
  
  children
}) => {
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);

  const handleOpenImageSelector = () => {
    if (!disabled) {
      setIsImageSelectorOpen(true);
    }
  };

  const handleCloseImageSelector = () => {
    setIsImageSelectorOpen(false);
  };

  const handleImageSelect = (imageUrl: string) => {
    onImageSelect(imageUrl);
    setIsImageSelectorOpen(false);
  };

  const handleRemoveImage = () => {
    if (onImageRemove) {
      onImageRemove();
    }
  };

  // Default button icon nếu không có
  const defaultIcon = (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
      />
    </svg>
  );

  // Preview size classes
  const previewSizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64'
  };

  // Layout classes
  const layoutClasses = {
    vertical: 'flex flex-col',
    horizontal: 'flex flex-row items-center'
  };

  // Responsive classes
  const responsiveClasses = responsive ? 'flex-col sm:flex-row' : '';

  return (
    <div 
      className={`${layoutClasses[layout]} ${responsiveClasses} gap-${gap}`}
      style={{ gap: `${gap * 0.25}rem` }}
    >
      {/* Custom children hoặc default button */}
      {children ? (
        <div onClick={handleOpenImageSelector} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpenImageSelector}
          disabled={disabled}
          className={`flex items-center justify-center px-6 py-8 bg-[#FAF3E0] dark:bg-[#23272f] text-[#3E2723] rounded-xl shadow-md tracking-wide border-2 border-dashed border-[#D4AF37] cursor-pointer hover:bg-[#D4AF37]/10 dark:hover:bg-[#23272f]/80 transition disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
          style={buttonStyle}
        >
          {buttonIcon || defaultIcon}
          <span className="text-[#3E2723] ml-2 text-base leading-normal">
            {buttonText}
          </span>
        </button>
      )}

      {/* Image Preview */}
      {showPreview && selectedImage && (
        <div className={`relative group w-full ${previewClassName}`} style={previewStyle}>
          <img
            src={selectedImage}
            alt="Preview"
            className={`w-full h-16 object-cover rounded-md border border-gray-200 shadow`}
          />
          {onImageRemove && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-1 shadow hover:bg-red-500 hover:text-white transition"
              title="Xoá ảnh"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Image Selector Modal */}
      <ImageSelector
        isOpen={isImageSelectorOpen}
        onClose={handleCloseImageSelector}
        onSelect={handleImageSelect}
        title={title}
      />
    </div>
  );
}; 