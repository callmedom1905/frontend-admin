// src/components/ui/form/RichTextEditor.tsx
"use client";

import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { useEffect, useState } from "react";

// Load ReactQuill dynamic để tránh lỗi SSR
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="text-gray-400 text-sm">Đang tải trình soạn thảo...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 border rounded-md overflow-hidden">
      <ReactQuill
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        theme="snow"
        className="min-h-[150px]"
      />
    </div>
  );
}
