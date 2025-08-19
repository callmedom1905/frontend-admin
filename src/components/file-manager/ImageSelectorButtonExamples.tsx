'use client';

import React, { useState } from 'react';
import { ImageSelectorButton } from './ImageSelectorButton';

// Component ví dụ cho các cách sử dụng ImageSelectorButton khác nhau
export const ImageSelectorButtonExamples: React.FC = () => {
  const [selectedImage1, setSelectedImage1] = useState<string | null>(null);
  const [selectedImage2, setSelectedImage2] = useState<string | null>(null);
  const [selectedImage3, setSelectedImage3] = useState<string | null>(null);
  const [selectedImage4, setSelectedImage4] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">ImageSelectorButton Examples</h1>

      {/* Example 1: Default style */}
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">1. Default Style</h2>
        <ImageSelectorButton
          buttonText="Chọn ảnh từ thư viện"
          title="Chọn hình ảnh"
          selectedImage={selectedImage1}
          onImageSelect={setSelectedImage1}
          onImageRemove={() => setSelectedImage1(null)}
        />
      </div>

      {/* Example 2: Custom button style */}
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">2. Custom Button Style</h2>
        <ImageSelectorButton
          buttonText="Upload Image"
          buttonClassName="bg-blue-500 hover:bg-blue-600 text-white border-blue-500 px-8 py-4 rounded-lg"
          buttonIcon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
          title="Select Image"
          selectedImage={selectedImage2}
          onImageSelect={setSelectedImage2}
          onImageRemove={() => setSelectedImage2(null)}
        />
      </div>

      {/* Example 3: Horizontal layout with small preview */}
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">3. Horizontal Layout</h2>
        <ImageSelectorButton
          buttonText="Choose Photo"
          buttonClassName="bg-green-500 hover:bg-green-600 text-white border-green-500 px-6 py-3 rounded-md"
          layout="horizontal"
          previewSize="sm"
          gap={2}
          title="Choose Photo"
          selectedImage={selectedImage3}
          onImageSelect={setSelectedImage3}
          onImageRemove={() => setSelectedImage3(null)}
        />
      </div>

      {/* Example 4: Custom children */}
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">4. Custom Children</h2>
        <ImageSelectorButton
          title="Select Image"
          selectedImage={selectedImage4}
          onImageSelect={setSelectedImage4}
          onImageRemove={() => setSelectedImage4(null)}
          previewSize="lg"
        >
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-bold mb-2">Click to Select Image</h3>
              <p className="text-sm opacity-90">Choose from your media library</p>
            </div>
          </div>
        </ImageSelectorButton>
      </div>

      {/* Example 5: Disabled state */}
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">5. Disabled State</h2>
        <ImageSelectorButton
          buttonText="Disabled Button"
          buttonClassName="bg-gray-300 text-gray-500"
          disabled={true}
          title="Select Image"
          selectedImage={null}
          onImageSelect={() => {}}
        />
      </div>

      {/* Example 6: No preview */}
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">6. No Preview</h2>
        <ImageSelectorButton
          buttonText="Select Image (No Preview)"
          showPreview={false}
          title="Select Image"
          selectedImage={selectedImage1}
          onImageSelect={setSelectedImage1}
        />
      </div>
    </div>
  );
}; 