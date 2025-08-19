"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PostList from "@/components/tables/Post/PostList";
import PostForm from "@/components/tables/Post/PostForm";
import PostReview from "@/components/tables/Post/PostReview";
import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import Link from "next/link";
import '@/styles/posts/post.scss'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ToastMessage from "@/components/tables/Post/ToastMessage";
import ComponentCardPost from "@/components/common/ComponentCardPost";
import { useAuth } from "@/context/AuthContext";

interface Post {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  views: number;
  image: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  outstanding: boolean;
  id_voucher?: number | null;
  voucher?: {
    id: number;
    name: string;
    code: string;
    discount_type: number;
    discount_value: number;
  };
  // SEO properties
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  structured_data?: any;
  reading_time?: number;
  word_count?: number;
  seo_score?: number;
  seo_grade?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    profile_image: string;
  };
}

// Extended Post interface for form data (without required backend fields)
interface PostFormData {
  id?: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  image: string;
  status: boolean;
  outstanding: boolean;
  id_voucher?: number | null;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  canonical_url: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image: string;
  seo_score?: number;
  seo_grade?: string;
  word_count: number;
  reading_time: number;
}

export default function PostListPage() {
  const { user, loading: authLoading } = useAuth();
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [creatingPost, setCreatingPost] = useState(false);
  const [reviewingPost, setReviewingPost] = useState<Post | null>(null);
  const [showTrashed, setShowTrashed] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [showCreateToast, setShowCreateToast] = useState(false);
  const [createdPost, setCreatedPost] = useState<Post | null>(null);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [updatedPost, setUpdatedPost] = useState<Post | null>(null);

  // Debug logs
  console.log("Current state:", {
    authLoading,
    user: !!user,
    creatingPost,
    editingPost: !!editingPost,
    showTrashed
  });

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cần đăng nhập</h2>
          <p className="text-gray-600 mb-4">Bạn cần đăng nhập để truy cập trang này.</p>
          <Link 
            href="/signin"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  const handleDeletePost = (deletedId: number) => {
    setReloadFlag(prev => prev + 1);
  };

  const handleUpdatePost = async (updatedPost: PostFormData) => {
    try {
      console.log("Updating post with data:", updatedPost);
      
      // Convert status string to boolean for backend
      const postData = {
        ...updatedPost,
        id_user: user?.id,
        status: updatedPost.status,
        outstanding: updatedPost.outstanding || false,
        // Add required fields that might be missing
        meta_title: updatedPost.meta_title || updatedPost.title,
        meta_description: updatedPost.meta_description || updatedPost.description,
        og_title: updatedPost.og_title || updatedPost.title,
        og_description: updatedPost.og_description || updatedPost.description,
        twitter_title: updatedPost.twitter_title || updatedPost.title,
        twitter_description: updatedPost.twitter_description || updatedPost.description,
      };

      // Remove seo_score and seo_grade to let backend calculate
      delete (postData as any).seo_score;
      delete (postData as any).seo_grade;

      console.log("Final post data being sent:", postData);
      console.log("Image field value:", postData.image);
      console.log("OG image field value:", (postData as any).og_image);
      console.log("Twitter image field value:", (postData as any).twitter_image);

      const response = await apiClient.put(`/posts/${updatedPost.id}`, postData);
      console.log("Update post response:", response);

      if ((response as any).success) {
        setEditingPost(null);
        setUpdatedPost((response as any).data);
        setShowUpdateToast(true);
        setReloadFlag(prev => prev + 1);
      } else {
        throw new Error((response as any).message || 'Cập nhật bài viết thất bại');
      }
    } catch (error: any) {
      console.error("Lỗi khi cập nhật bài viết:", error);
      
      // Xử lý lỗi validation slug
      if (error.response?.status === 422 && error.response?.data?.errors?.slug) {
        alert(`Lỗi: ${error.response.data.errors.slug[0]}`);
      } else if (error.response?.data?.message) {
        alert(`Lỗi: ${error.response.data.message}`);
      } else {
        alert(`Lỗi khi cập nhật bài viết: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
      }
    }
  };

  const handleCreatePost = async (newPost: PostFormData) => {
    try {
      console.log("Creating post with data:", newPost);
      
      // Convert status string to boolean for backend
      const postData = {
        ...newPost,
        id_user: user?.id,
        status: newPost.status,
        outstanding: newPost.outstanding || false,
        // Add required fields that might be missing
        meta_title: newPost.meta_title || newPost.title,
        meta_description: newPost.meta_description || newPost.description,
        og_title: newPost.og_title || newPost.title,
        og_description: newPost.og_description || newPost.description,
        twitter_title: newPost.twitter_title || newPost.title,
        twitter_description: newPost.twitter_description || newPost.description,
      };

      // Remove seo_score and seo_grade to let backend calculate
      delete (postData as any).seo_score;
      delete (postData as any).seo_grade;

      console.log("Final post data being sent:", postData);
      console.log("Image field value:", postData.image);
      console.log("OG image field value:", (postData as any).og_image);
      console.log("Twitter image field value:", (postData as any).twitter_image);

      const response = await apiClient.post('/posts', postData);
      console.log("Create post response:", response);

      if ((response as any).success) {
        setCreatingPost(false);
        setCreatedPost((response as any).data);
        setShowCreateToast(true);
        setReloadFlag(prev => prev + 1);
      } else {
        throw new Error((response as any).message || 'Tạo bài viết thất bại');
      }
    } catch (error: any) {
      console.error("Lỗi khi tạo bài viết:", error);
      
      // Xử lý lỗi validation slug
      if (error.response?.status === 422 && error.response?.data?.errors?.slug) {
        alert(`Lỗi: ${error.response.data.errors.slug[0]}`);
      } else if (error.response?.data?.message) {
        alert(`Lỗi: ${error.response.data.message}`);
      } else {
        alert(`Lỗi khi tạo bài viết: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
      }
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Quản Lý Bài Viết" />
      <div className="flex items-center justify-between px-8 pb-4">
        <h1 className="text-2xl font-bold text-[#3E2723]">Quản Lý Bài Viết</h1>
        {!creatingPost && !editingPost && (
          <button
            className="bg-[#3E2723] hover:bg-[#D4AF37] text-white font-semibold py-2 px-6 rounded-xl shadow transition"
            onClick={() => setCreatingPost(true)}
          >
            + Tạo bài viết
          </button>
        )}
      </div>

      {creatingPost && (
        <div className="mb-6">
          <PostForm
            onCancel={() => setCreatingPost(false)}
            onSubmit={handleCreatePost}
          />
        </div>
      )}

      {editingPost && (
        <div className="mb-6">
          <PostForm
            post={editingPost as any}
            onCancel={() => setEditingPost(null)}
            onSubmit={handleUpdatePost}
          />
        </div>
      )}

      {!creatingPost && !editingPost && (
        <ComponentCardPost className="container-post" title="">
          <PostList
            key={reloadFlag}
            showTrashed={showTrashed}
            onEditPost={(post) => setEditingPost(post)}
            onDeletePost={handleDeletePost}
            onReviewPost={(post) => setReviewingPost(post)}
          />
        </ComponentCardPost>
      )}

      {reviewingPost && (
        <PostReview post={reviewingPost as any} onClose={() => setReviewingPost(null)} />
      )}

      <ToastMessage
        open={showCreateToast}
        message={
          <span>
            Tạo bài viết thành công!{" "}
            {createdPost && (
              <button
                className="ml-2 underline text-blue-600 font-medium"
                style={{ fontSize: "inherit" }}
                onClick={() => {
                  window.open(`/bai-viet/${createdPost.slug || createdPost.id}`, "_blank");
                }}
                type="button"
              >
                Xem
              </button>
            )}
          </span>
        }
        onClose={() => setShowCreateToast(false)}
      />

      <ToastMessage
        open={showUpdateToast}
        message={
          <span>
            Cập nhật bài viết thành công!{" "}
            {updatedPost && (
              <button
                className="ml-2 underline text-blue-600 font-medium"
                style={{ fontSize: "inherit" }}
                onClick={() => {
                  window.open(`/bai-viet/${updatedPost.slug || updatedPost.id}`, "_blank");
                }}
                type="button"
              >
                Xem
              </button>
            )}
          </span>
        }
        onClose={() => setShowUpdateToast(false)}
      />
    </div>
  );
}
