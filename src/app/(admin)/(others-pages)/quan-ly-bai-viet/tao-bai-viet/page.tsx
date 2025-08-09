"use client";
import AiPostGenerator from "@/components/posts/AiPostGenerator";
import { useState } from "react";
import PostForm from "@/components/tables/Post/PostForm";
// Import Post type from PostForm file
type Post = {
  id?: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  image: string;
  status: boolean;
  outstanding: boolean;
  id_voucher?: number | null;
  voucher?: {
    id: number;
    name: string;
    code: string;
    discount_type: number;
    discount_value: number;
  };
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image: string;
  canonical_url: string;
  seo_score?: number;
  seo_grade?: string;
  word_count: number;
  reading_time: number;
};


export default function CreatePostPage() {
  const [aiContent, setAiContent] = useState("");

  const handleSubmit = (data: Post) => {
    // TODO: Gửi dữ liệu lên API lưu bài viết
    console.log("Submit data:", data);
    alert("Đã gửi dữ liệu bài viết lên server!");
  };

  const handleCancel = () => {
    window.history.back();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Tạo bài viết mới</h2>
      <AiPostGenerator onGenerated={setAiContent} />
      <PostForm
        post={{ content: aiContent, title: "", slug: "", description: "", image: "", status: false, outstanding: false, id_voucher: null, meta_title: "", meta_description: "", meta_keywords: "", og_title: "", og_description: "", og_image: "", twitter_title: "", twitter_description: "", twitter_image: "", canonical_url: "", word_count: 0, reading_time: 0 }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
