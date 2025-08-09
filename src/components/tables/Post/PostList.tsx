"use client";

import NextImage from "next/image";
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { FiMoreVertical, FiSearch, FiEye, FiEdit, FiRotateCcw } from "react-icons/fi";
import apiClient from "@/lib/apiClient";

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
  deleted_at?: string | null;
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
  structured_data?: object;
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

interface PostListProps {
  showTrashed: boolean;
  onEditPost?: (post: Post) => void;
  onDeletePost?: (id: number) => void;
  onReviewPost?: (post: Post) => void;
}

const PostActionMenu: React.FC<{
  post: Post;
  isTrashed: boolean;
  onView?: (post: Post) => void;
  onEdit?: (post: Post) => void;
  onRestore?: (id: number) => void;
  onClose: () => void;
}> = ({ post, isTrashed, onView, onEdit, onRestore, onClose }) => {
  return (
    <div
      className="z-50 w-[170px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 animate-fade-in
        before:content-[''] before:absolute before:-top-2 before:right-4 before:w-4 before:h-4 before:bg-white dark:before:bg-gray-800 before:border-l before:border-t before:border-gray-200 dark:before:border-gray-700 before:rotate-45"
    >
      <ul className="flex flex-col">
        {!isTrashed ? (
          <>
            {onView && (
              <li>
                <button
                  onClick={() => { onView(post); onClose(); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                >
                  <FiEye className="w-4 h-4" /> Xem chi tiết
                </button>
              </li>
            )}
            {onEdit && (
               <li>
                <button
                  onClick={() => { onEdit(post); onClose(); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                >
                  <FiEdit className="w-4 h-4" /> Chỉnh sửa
                </button>
              </li>
            )}
          </>
        ) : (
          <>
            {onView && (
              <li>
                <button
                  onClick={() => { onView(post); onClose(); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                >
                  <FiEye className="w-4 h-4" /> Xem chi tiết
                </button>
              </li>
            )}
            {onRestore && (
               <li>
                <button
                  onClick={() => { onRestore(post.id); onClose(); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-3 transition-colors"
                >
                  <FiRotateCcw className="w-4 h-4" /> Khôi phục
                </button>
              </li>
            )}
          </>
        )}
      </ul>
    </div>
  );
};

const PostList: React.FC<PostListProps> = ({ 
  showTrashed,
  onEditPost, 
  onReviewPost
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; } | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // State cho bộ lọc và phân trang
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("created_at_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Fallback: trả về nguyên chuỗi nếu không parse được
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString);
      return dateString || 'N/A';
    }
  };

  const getStatusText = (status: boolean) => {
    return status ? "Đã đăng" : "Ẩn";
  };

  const getStatusColor = (status: boolean) => {
    return status ? "success" : "error";
  };

  const toggleDropdown = (postId: number, event: React.MouseEvent) => {
    if (openDropdown === postId) {
      setOpenDropdown(null);
      setMenuPosition(null);
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 5, // Position below the button with a 5px gap
      left: rect.right - 170, // Align menu's right edge with button's right edge
    });
    setOpenDropdown(postId);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close status dropdown
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      // Close sort dropdown
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
      
      // Close action menu if click is outside of it and its toggle button
      if (openDropdown !== null) {
        const portal = document.getElementById('action-menu-portal');
        const toggle = document.querySelector(`[data-post-id="${openDropdown}"]`);
        if (portal && !portal.contains(event.target as Node) && toggle && !toggle.contains(event.target as Node)) {
          setOpenDropdown(null);
          setMenuPosition(null);
        }
      }
    }

    // Add listener if any dropdown is open
    if (statusDropdownOpen || sortDropdownOpen || openDropdown !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [statusDropdownOpen, sortDropdownOpen, openDropdown]);

  // Hàm fetch posts để tái sử dụng
  const fetchPosts = React.useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = showTrashed ? "/posts/trashed" : "/posts";
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      
      if (debouncedSearchQuery) {
        params.append('filter[title]', debouncedSearchQuery);
      }
      
      if (statusFilter !== 'all') {
        params.append('filter[status]', statusFilter === 'published' ? '1' : '0');
      }
      
      if (sortField) {
        // Fix: Handle fields with underscores correctly
        let field, direction;
        if (sortField.includes('_desc')) {
          field = sortField.replace('_desc', '');
          direction = 'desc';
        } else if (sortField.includes('_asc')) {
          field = sortField.replace('_asc', '');
          direction = 'asc';
        } else {
          // Fallback to old logic
          [field, direction] = sortField.split('_');
        }
        
        if (field === 'created') field = 'created_at';
        if (field === 'seo') field = 'seo_score';
        
        console.log("Original sortField:", sortField);
        console.log("Parsed field:", field, "Direction:", direction);
        const sortParam = direction === 'desc' ? `-${field}` : field;
        console.log("Final sort parameter:", sortParam);
        params.append('sort', sortParam);
      }
      
      const url = `${endpoint}?${params.toString()}`;
      console.log("Fetching posts from:", url);
      
      const response = await apiClient.get(url);
      console.log("%c[DEBUG] Full API Response:", "color: #ff00ff; font-weight: bold;", response);
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log("Raw posts data (nested):", response.data.data);
        console.log("Pagination meta:", response.data.meta);
        
        const formattedPosts = response.data.data.map((post: Post) => ({
          ...post,
          title: post.title,
          status: typeof post.status === "number" 
            ? post.status === 1 
              ? true 
              : false
            : Boolean(post.status),
          outstanding: Boolean(post.outstanding)
        }));
        
        console.log("Formatted posts:", formattedPosts);
        setPosts(formattedPosts);
        
        // CẬP NHẬT LOGIC LẤY DỮ LIỆU PHÂN TRANG
        if (response.data.meta) {
          console.log(`Setting pagination: currentPage=${response.data.meta.current_page}, totalPages=${response.data.meta.last_page}`);
          setCurrentPage(response.data.meta.current_page);
          setTotalPages(response.data.meta.last_page);
        } else if (response.data.current_page) { // Giữ lại fallback phòng trường hợp API thay đổi
          console.log(`Setting pagination (fallback): currentPage=${response.data.current_page}, totalPages=${response.data.last_page}`);
          setCurrentPage(response.data.current_page);
          setTotalPages(response.data.last_page);
        }
      } else if (response.data && Array.isArray(response.data)) {
        console.log("Raw posts data (direct array):", response.data);
        const formattedPosts = response.data.map((post: Post) => ({
          ...post,
          title: post.title,
          status: typeof post.status === "number" 
            ? post.status === 1 
              ? true 
              : false
            : Boolean(post.status),
          outstanding: Boolean(post.outstanding)
        }));
        console.log("Formatted posts:", formattedPosts);
        setPosts(formattedPosts);
        setTotalPages(1); // Mặc định là 1 trang nếu không có thông tin phân trang
      } else {
        console.log("No posts data or invalid format:", response.data);
        setPosts([]);
        setTotalPages(1); // Mặc định là 1 trang
      }
    } catch (error) {
      console.error("Lỗi khi lấy bài viết:", error);
      setPosts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [showTrashed, currentPage, debouncedSearchQuery, statusFilter, sortField]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Thêm useEffect để reset về trang 1 khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, sortField, showTrashed]);

  // Debounced search effect - chỉ gửi request sau khi người dùng ngừng gõ 500ms
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const handleSort = (sort: string) => {
    console.log("handleSort called with:", sort);
    setSortField(sort);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm("Khôi phục bài viết này?")) return;
    try {
      await apiClient.post(`/posts/${id}/restore`, {});
      // Tải lại dữ liệu sau khi khôi phục
      fetchPosts();
    } catch (err) {
      console.error("Khôi phục thất bại:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bộ lọc theo cấu trúc Menu */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Tìm theo tiêu đề bài viết..."
          className="border border-gray-300 px-2 h-8 rounded text-sm focus:outline-none focus:border-[#E6C67A] focus:ring-1 focus:ring-[#E6C67A] min-w-[200px]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        {/* Bộ lọc trạng thái */}
        <div ref={statusDropdownRef} className="relative">
          <button
            type="button"
            className="border border-gray-300 px-2 h-8 rounded text-sm font-normal bg-white min-w-[140px] flex items-center justify-between"
            onClick={() => setStatusDropdownOpen((open) => !open)}
          >
            {statusFilter === "all" ? "Tất cả trạng thái" : statusFilter === "published" ? "Đã đăng" : "Ẩn"}
            <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {statusDropdownOpen && (
            <ul className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow z-20 py-1 text-sm min-w-[140px]">
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${statusFilter === "all" ? "font-bold" : "font-normal"}`}
                  onClick={() => { handleStatusFilter("all"); setStatusDropdownOpen(false); }}
                >
                  Tất cả trạng thái
                </button>
              </li>
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${statusFilter === "published" ? "font-bold" : "font-normal"}`}
                  onClick={() => { handleStatusFilter("published"); setStatusDropdownOpen(false); }}
                >
                  Đã đăng
                </button>
              </li>
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${statusFilter === "hidden" ? "font-bold" : "font-normal"}`}
                  onClick={() => { handleStatusFilter("hidden"); setStatusDropdownOpen(false); }}
                >
                  Ẩn
                </button>
              </li>
            </ul>
          )}
        </div>

        {/* Bộ lọc sắp xếp */}
        <div ref={sortDropdownRef} className="relative">
          <button
            type="button"
            className="border border-gray-300 px-2 h-8 rounded text-sm font-normal bg-white min-w-[160px] flex items-center justify-between"
            onClick={() => setSortDropdownOpen((open) => !open)}
          >
            {sortField === "created_at_desc" ? "Mới nhất" :
             sortField === "created_at_asc" ? "Cũ nhất" :
             sortField === "title_asc" ? "Tiêu đề A-Z" :
             sortField === "title_desc" ? "Tiêu đề Z-A" :
             sortField === "views_desc" ? "Lượt xem cao nhất" :
             sortField === "seo_score_desc" ? "SEO Score cao nhất" : "Sắp xếp"}
            <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {sortDropdownOpen && (
            <ul className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow z-20 py-1 text-sm min-w-[160px]">
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${sortField === "created_at_desc" ? "font-bold" : "font-normal"}`}
                  onClick={() => { handleSort("created_at_desc"); setSortDropdownOpen(false); }}
                >
                  Mới nhất
                </button>
              </li>
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${sortField === "created_at_asc" ? "font-bold" : "font-normal"}`}
                  onClick={() => { handleSort("created_at_asc"); setSortDropdownOpen(false); }}
                >
                  Cũ nhất
                </button>
              </li>
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${sortField === "title_asc" ? "font-bold" : "font-normal"}`}
                  onClick={() => { handleSort("title_asc"); setSortDropdownOpen(false); }}
                >
                  Tiêu đề A-Z
                </button>
              </li>
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${sortField === "title_desc" ? "font-bold" : "font-normal"}`}
                  onClick={() => { handleSort("title_desc"); setSortDropdownOpen(false); }}
                >
                  Tiêu đề Z-A
                </button>
              </li>
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${sortField === "views_desc" ? "font-bold" : "font-normal"}`}
                  onClick={() => { handleSort("views_desc"); setSortDropdownOpen(false); }}
                >
                  Lượt xem cao nhất
                </button>
              </li>
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${sortField === "seo_score_desc" ? "font-bold" : "font-normal"}`}
                  onClick={() => { handleSort("seo_score_desc"); setSortDropdownOpen(false); }}
                >
                  SEO Score cao nhất
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-700">
              <TableRow className="border-b border-gray-200 dark:border-gray-600">
                <TableCell isHeader className="w-20 px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hình ảnh</TableCell>
                <TableCell isHeader className="min-w-[280px] px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tiêu đề</TableCell>
                <TableCell isHeader className="min-w-[140px] px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Slug</TableCell>
                <TableCell isHeader className="w-28 px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</TableCell>
                <TableCell isHeader className="w-24 px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lượt xem</TableCell>
                <TableCell isHeader className="w-28 px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Điểm SEO</TableCell>
                <TableCell isHeader className="w-36 px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Người tạo</TableCell>
                <TableCell isHeader className="w-36 px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{showTrashed ? "Ngày xóa" : "Ngày tạo"}</TableCell>
                <TableCell isHeader className="w-24 px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      <p className="ml-2 text-gray-600">Đang tải bài viết...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : posts && posts.length > 0 ? (
                posts.map((post) => (
                  <TableRow key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <TableCell className="px-6 py-5">
                      {post.image ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm">
                          <NextImage
                            src={post.image}
                            alt={post.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.dataset.fallback) {
                                target.src = '/images/placeholder.jpg';
                                target.dataset.fallback = 'true';
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600 shadow-sm">
                          <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">No Image</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="max-w-[280px]">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-5 mb-2 line-clamp-1" title={post.title}>
                          {post.title}
                        </h3>
                        {post.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-5 line-clamp-2" title={post.description}>
                            {post.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                        {post.slug.length > 18 ? post.slug.slice(0, 18) + "..." : post.slug}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <Badge size="sm" color={getStatusColor(post.status)}>
                        {getStatusText(post.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{post.views || 0}</span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${post.seo_score || 0}%`,
                              backgroundColor: (post.seo_score || 0) >= 80 ? '#10B981' : (post.seo_score || 0) >= 60 ? '#F59E0B' : '#EF4444'
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold" style={{
                          color: (post.seo_score || 0) >= 80 ? '#10B981' : (post.seo_score || 0) >= 60 ? '#F59E0B' : '#EF4444'
                        }}>
                          {post.seo_score || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {post.user?.name || "Ẩn danh"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(showTrashed ? post.deleted_at! : post.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="relative">
                        <button
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors dropdown-toggle"
                          data-post-id={post.id}
                          onClick={(e) => toggleDropdown(post.id, e)}
                        >
                          <FiMoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <FiSearch className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg font-semibold mb-2">Không tìm thấy bài viết nào</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm">
                        Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {openDropdown !== null && menuPosition &&
        ReactDOM.createPortal(
          <div
            id="action-menu-portal"
            style={{
              position: 'fixed',
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              zIndex: 9999,
            }}
          >
            <PostActionMenu
              post={posts.find(p => p.id === openDropdown)!}
              isTrashed={showTrashed}
              onView={onReviewPost}
              onEdit={onEditPost}
              onRestore={handleRestore}
              onClose={() => {
                setOpenDropdown(null);
                setMenuPosition(null);
              }}
            />
          </div>,
          document.body
        )}

      {/* Phân trang theo cấu trúc Menu */}
      {totalPages > 0 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
          >
            Trước
          </button>
          {[...Array(totalPages)].map((_, idx) => {
            const pageNumber = idx + 1;
            const isNearCurrentPage =
              Math.abs(pageNumber - currentPage) <= 1 ||
              pageNumber === 1 ||
              pageNumber === totalPages;

            if (!isNearCurrentPage) {
              if (pageNumber === 2 || pageNumber === totalPages - 1) {
                return <span key={idx} className="px-2">...</span>;
              }
              return null;
            }

            return (
              <button
                key={idx}
                className={`px-3 py-1 rounded border ${
                  currentPage === pageNumber
                    ? "bg-[#3E2723] text-[#FAF3E0]"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => handlePageChange(pageNumber)}
                disabled={loading}
              >
                {pageNumber}
              </button>
            );
          })}
          <button
            className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
          >
            Tiếp Theo
          </button>
        </div>
      )}
    </div>
  );
};

export default PostList;