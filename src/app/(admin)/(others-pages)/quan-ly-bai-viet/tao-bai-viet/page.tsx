"use client";

import PostForm from "@/components/tables/Post/PostForm";
import AiPostGenerator from "@/components/posts/AiPostGenerator";
import { useState } from "react";

export default function CreatePostPage() {
  const [aiContent, setAiContent] = useState("");

  const handleSubmit = (data: any) => {
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
