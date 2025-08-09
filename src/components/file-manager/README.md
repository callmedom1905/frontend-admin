# ImageSelectorButton Component

Component tùy biến để chọn ảnh từ quản lý file với nhiều style khác nhau.

## Cách sử dụng cơ bản

```tsx
import { ImageSelectorButton } from '@/components/file-manager';

const MyComponent = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <ImageSelectorButton
      buttonText="Chọn ảnh từ thư viện"
      title="Chọn hình ảnh"
      selectedImage={selectedImage}
      onImageSelect={setSelectedImage}
      onImageRemove={() => setSelectedImage(null)}
    />
  );
};
```

## Props

### Button Props
- `buttonText?: string` - Text hiển thị trên button (mặc định: "Chọn ảnh từ thư viện")
- `buttonIcon?: React.ReactNode` - Icon tùy chỉnh cho button
- `buttonClassName?: string` - CSS classes tùy chỉnh cho button
- `buttonStyle?: React.CSSProperties` - Inline styles cho button

### Preview Props
- `showPreview?: boolean` - Hiển thị preview ảnh (mặc định: true)
- `previewClassName?: string` - CSS classes tùy chỉnh cho preview
- `previewStyle?: React.CSSProperties` - Inline styles cho preview
- `previewSize?: 'sm' | 'md' | 'lg' | 'xl'` - Kích thước preview (mặc định: 'md')

### ImageSelector Props
- `title?: string` - Tiêu đề modal ImageSelector (mặc định: "Chọn hình ảnh")
- `onImageSelect: (imageUrl: string) => void` - Callback khi chọn ảnh
- `onImageRemove?: () => void` - Callback khi xóa ảnh

### State Props
- `selectedImage?: string | null` - URL ảnh đã chọn
- `disabled?: boolean` - Vô hiệu hóa button (mặc định: false)

### Layout Props
- `layout?: 'vertical' | 'horizontal'` - Layout của button và preview (mặc định: 'vertical')
- `gap?: number` - Khoảng cách giữa button và preview (mặc định: 4)
- `responsive?: boolean` - Responsive layout (mặc định: true)

### Children Props
- `children?: React.ReactNode` - Nội dung tùy chỉnh thay thế button mặc định

## Ví dụ sử dụng

### 1. Style mặc định
```tsx
<ImageSelectorButton
  buttonText="Chọn ảnh từ thư viện"
  title="Chọn hình ảnh"
  selectedImage={selectedImage}
  onImageSelect={setSelectedImage}
  onImageRemove={() => setSelectedImage(null)}
/>
```

### 2. Custom button style
```tsx
<ImageSelectorButton
  buttonText="Upload Image"
  buttonClassName="bg-blue-500 hover:bg-blue-600 text-white border-blue-500 px-8 py-4 rounded-lg"
  buttonIcon={<PlusIcon className="w-8 h-8" />}
  title="Select Image"
  selectedImage={selectedImage}
  onImageSelect={setSelectedImage}
  onImageRemove={() => setSelectedImage(null)}
/>
```

### 3. Horizontal layout
```tsx
<ImageSelectorButton
  buttonText="Choose Photo"
  buttonClassName="bg-green-500 hover:bg-green-600 text-white border-green-500 px-6 py-3 rounded-md"
  layout="horizontal"
  previewSize="sm"
  gap={2}
  title="Choose Photo"
  selectedImage={selectedImage}
  onImageSelect={setSelectedImage}
  onImageRemove={() => setSelectedImage(null)}
/>
```

### 4. Custom children
```tsx
<ImageSelectorButton
  title="Select Image"
  selectedImage={selectedImage}
  onImageSelect={setSelectedImage}
  onImageRemove={() => setSelectedImage(null)}
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
```

### 5. Disabled state
```tsx
<ImageSelectorButton
  buttonText="Disabled Button"
  buttonClassName="bg-gray-300 text-gray-500"
  disabled={true}
  title="Select Image"
  selectedImage={null}
  onImageSelect={() => {}}
/>
```

### 6. No preview
```tsx
<ImageSelectorButton
  buttonText="Select Image (No Preview)"
  showPreview={false}
  title="Select Image"
  selectedImage={selectedImage}
  onImageSelect={setSelectedImage}
/>
```

## Preview Sizes

- `sm`: 64x64px (w-16 h-16)
- `md`: 128x128px (w-32 h-32) - mặc định
- `lg`: 192x192px (w-48 h-48)
- `xl`: 256x256px (w-64 h-64)

## Layout Options

- `vertical`: Button và preview xếp theo chiều dọc (mặc định)
- `horizontal`: Button và preview xếp theo chiều ngang

## Responsive

Khi `responsive={true}` (mặc định), component sẽ tự động chuyển từ horizontal sang vertical trên màn hình nhỏ (sm breakpoint). 