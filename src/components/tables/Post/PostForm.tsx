// Interface cho response từ AI SEO API
interface AiSeoResponse {
  success: boolean;
  content: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  description: string;
  slug: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image: string;
  canonical_url: string;
}

"use client";
import React, { useState, useEffect, useRef } from "react";
// import React, { useState, useEffect, useRef } from "react";
import LabelProps from "@/components/form/Label";
import TextArea from "@/components/form/input/TextAreaPost";
import { Fancybox as NativeFancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import apiClient from "@/lib/apiClient";
import "@/styles/posts/post.scss";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import NotificationModal from "./NotificationModal";
import { ImageSelector } from "@/components/file-manager";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import {
  Save,
  X,
  TrendingUp,
  Eye,
  FileText,
  Image as ImageIcon,
  Share2,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowLeft
} from 'lucide-react';
import ImprovedSeoAnalysis from './ImprovedSeoAnalysis';


interface Post {
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
}

// Interface cho Voucher
interface Voucher {
  id: number;
  name: string;
  code: string;
  discount_type: number;
  discount_value: number;
  status: boolean;
  start_date: string;
  end_date: string;
  description?: string;
}

interface PostFormProps {
  post?: Post;
  onSubmit: (data: Post) => void;
  onCancel: () => void;
  loading?: boolean;
}

const PostForm: React.FC<PostFormProps> = ({
  post,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<Post>({
    title: post?.title || '',
    slug: post?.slug || '',
    description: post?.description || '',
    content: post?.content || '',
    image: post?.image || '',
    status: post?.status || false,
    outstanding: post?.outstanding || false,
    id_voucher: post?.id_voucher || null,
    meta_title: post?.meta_title || '',
    meta_description: post?.meta_description || '',
    meta_keywords: post?.meta_keywords || '',
    og_title: post?.og_title || '',
    og_description: post?.og_description || '',
    og_image: post?.og_image || '',
    twitter_title: post?.twitter_title || '',
    twitter_description: post?.twitter_description || '',
    twitter_image: post?.twitter_image || '',
    canonical_url: post?.canonical_url || '',
    seo_score: post?.seo_score || 0,
    seo_grade: post?.seo_grade || '',
    word_count: post?.word_count || 0,
    reading_time: post?.reading_time || 0,
  });

  // Loading toàn màn hình khi tạo nội dung AI
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const isEditMode = !!post;

  const [showSeoAnalysis, setShowSeoAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [activeImageField, setActiveImageField] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Voucher states
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [voucherDropdownOpen, setVoucherDropdownOpen] = useState(false);
  const voucherDropdownRef = useRef<HTMLDivElement>(null);

  // Khi post thay đổi (ví dụ vừa fetch xong), cập nhật lại form data và SEO metrics
  useEffect(() => {
    if (isEditMode && post) {
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        description: post.description || '',
        content: post.content || '',
        image: post.image || '',
        status: post.status || false,
        outstanding: post.outstanding || false,
        id_voucher: post.id_voucher || null,
        meta_title: post.meta_title || '',
        meta_description: post.meta_description || '',
        meta_keywords: post.meta_keywords || '',
        og_title: post.og_title || '',
        og_description: post.og_description || '',
        og_image: post.og_image || '',
        twitter_title: post.twitter_title || '',
        twitter_description: post.twitter_description || '',
        twitter_image: post.twitter_image || '',
        canonical_url: post.canonical_url || '',
        seo_score: post.seo_score || 0,
        seo_grade: post.seo_grade || '',
        word_count: post.word_count || 0,
        reading_time: post.reading_time || 0,
      });
      setHasChanges(false);
    }
  }, [isEditMode, post]);

  // Close dropdown on outside click
  useEffect(() => {
    // ...existing code...
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
    }
    if (statusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [statusDropdownOpen]);

  // Fetch vouchers
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoadingVouchers(true);
        const response = await apiClient.get('/vouchers');
        if (response && (response as any).data) {
          setVouchers((response as any).data);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách voucher:', error);
      } finally {
        setLoadingVouchers(false);
      }
    };

    fetchVouchers();
  }, []);

  // Close voucher dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (voucherDropdownRef.current && !voucherDropdownRef.current.contains(event.target as Node)) {
        setVoucherDropdownOpen(false);
      }
    }
    if (voucherDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [voucherDropdownOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation chỉ cho những field bắt buộc cơ bản
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề bài viết!');
      return;
    }

    if (!formData.content.trim()) {
      alert('Vui lòng nhập nội dung bài viết!');
      return;
    }

    // Không tự động tạo slug ở frontend nữa, để backend xử lý
    // Backend sẽ tạo slug từ title nếu slug trống

    const { seo_score, seo_grade, ...submitData } = formData;
    const finalData = {
      ...submitData,
    };

    // Đảm bảo ID được truyền khi edit mode
    if (isEditMode && post?.id) {
      finalData.id = post.id;
    }

    console.log("PostForm submitting data:", finalData);
    console.log("PostForm ID:", finalData.id);
    onSubmit(finalData);
  };

  const handleInputChange = (field: keyof Post, value: string | boolean | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Đánh dấu có thay đổi để bắt đầu tính toán realtime
    if (isEditMode) {
      setHasChanges(true);
    }
  };

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setFormData(prev => ({ ...prev, slug }));
  };
  useEffect(() => {
    if (aiLoading) {
      document.body.style.overflow = "hidden"; // chặn cuộn
    } else {
      document.body.style.overflow = ""; // trả lại bình thường
    }
  }, [aiLoading]);
  // Get selected voucher
  const selectedVoucher = vouchers.find(v => v.id === formData.id_voucher);

  return (
    <div className="space-y-6">
      {/* Nút quay lại */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 text-[#3E2723] hover:text-[#D4AF37] font-medium px-3 py-2 rounded-lg transition border border-transparent hover:border-[#E6C67A] bg-white shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center font-medium gap-2 rounded-[8px] transition  px-3 py-2 text-sm bg-[#3E2723] text-[#FAF3E0] shadow-theme-xs hover:bg-[#D4AF37] "
            onClick={async () => {
              const topic = formData.title;
              const description = formData.description;
              const keywords = formData.meta_keywords;
              if (!topic) {
                alert('Vui lòng nhập tiêu đề trước khi tạo nội dung bằng AI!');
                return;
              }
              setAiLoading(true);
              try {
                const res = await apiClient.post('/ai/generate-post', {
                  topic,
                  description,
                  keywords,
                });
                const aiRes = (res && (res as any).data ? (res as any).data : res) as AiSeoResponse;
                console.log('AI response:', aiRes);
                if (aiRes && aiRes.success) {
                  setFormData(prev => ({
                    ...prev,
                    content: typeof aiRes.content === 'string' ? aiRes.content.trim() : '',
                    description: aiRes.description || prev.description || '',
                    meta_title: aiRes.meta_title || prev.meta_title || topic,
                    meta_description: aiRes.meta_description || prev.meta_description || description || topic,
                    meta_keywords: aiRes.meta_keywords || prev.meta_keywords || keywords || topic,
                    slug: aiRes.slug || prev.slug || '',
                    og_title: aiRes.og_title || prev.og_title || aiRes.meta_title || topic,
                    og_description: aiRes.og_description || prev.og_description || aiRes.meta_description || description || topic,
                    og_image: aiRes.og_image || prev.og_image || '',
                    twitter_title: aiRes.twitter_title || prev.twitter_title || aiRes.meta_title || topic,
                    twitter_description: aiRes.twitter_description || prev.twitter_description || aiRes.meta_description || description || topic,
                    twitter_image: aiRes.twitter_image || prev.twitter_image || '',
                    canonical_url: aiRes.canonical_url || prev.canonical_url || '',
                  }));
                  setActiveTab('seo');
                } else {
                  console.error('AI không trả về nội dung hợp lệ!', aiRes);
                }
              } catch (err) {
                console.error('AI error:', err);
                alert('Có lỗi khi gọi AI!');
              } finally {
                setAiLoading(false);
              }
            }}
          >
            Tạo nội dung bằng AI
          </button>
        </div>

      </div>
      <form onSubmit={handleSubmit}>
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'content'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
            onClick={() => setActiveTab('content')}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Nội dung
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'seo'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
            onClick={() => setActiveTab('seo')}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            SEO
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'social'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
            onClick={() => setActiveTab('social')}
          >
            <Share2 className="w-4 h-4 inline mr-2" />
            Mạng xã hội
          </button>
        </div>

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6 relative">
            {/* Loading toàn màn hình khi tạo nội dung AI */}
            {aiLoading && (
              <div
                className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                style={{
                  zIndex: 99999999,
                  pointerEvents: "auto",
                }}
                tabIndex={-1}
                aria-hidden="true"
              >
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#D4AF37] mb-4"></div>
                  <span className="text-white text-lg font-semibold">
                    Đang tạo nội dung bằng AI...
                  </span>
                </div>
              </div>
            )}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Thông tin cơ bản</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <LabelProps htmlFor="title">Tiêu đề *</LabelProps>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E6C67A] focus:border-[#E6C67A]"
                    placeholder="Nhập tiêu đề bài viết"
                    required
                  />
                </div>
                <div>
                  <LabelProps htmlFor="slug">URL Slug</LabelProps>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E6C67A] focus:border-[#E6C67A]"
                      placeholder="url-slug (để trống để tự động tạo từ tiêu đề)"
                    />
                    <Button
                      type="button"
                      onClick={generateSlug}
                      variant="outline"
                      size="sm"
                    >
                      Tạo
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formData.slug ? (
                      <span>URL: /posts/{formData.slug}</span>
                    ) : (
                      <span>Để trống để tự động tạo từ tiêu đề</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <LabelProps htmlFor="description">Mô tả ngắn</LabelProps>
                <TextArea
                  value={formData.description}
                  onChange={(value) => handleInputChange('description', value)}
                  placeholder="Mô tả ngắn về bài viết"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <LabelProps htmlFor="status">Trạng thái</LabelProps>
                  <div ref={statusDropdownRef} className="relative">
                    <button
                      type="button"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-left focus:outline-none focus:border-[#E6C67A] focus:ring-2 focus:ring-[#E6C67A] bg-white flex items-center justify-between"
                      onClick={() => setStatusDropdownOpen((open) => !open)}
                    >
                      {formData.status ? "Xuất bản" : "Bản nháp"}
                      <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {statusDropdownOpen && (
                      <ul className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow z-20 py-1 text-sm min-w-[140px]">
                        <li>
                          <button
                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${!formData.status ? "font-bold" : "font-normal"}`}
                            onClick={() => { handleInputChange('status', false); setStatusDropdownOpen(false); }}
                          >
                            Bản nháp
                          </button>
                        </li>
                        <li>
                          <button
                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${formData.status ? "font-bold" : "font-normal"}`}
                            onClick={() => { handleInputChange('status', true); setStatusDropdownOpen(false); }}
                          >
                            Xuất bản
                          </button>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
                <div>
                  <LabelProps htmlFor="outstanding">Ghim</LabelProps>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="outstanding"
                      checked={formData.outstanding}
                      onChange={(e) => handleInputChange('outstanding', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="outstanding" className="ml-2 text-sm text-gray-700">
                      Ghim bài viết lên đầu
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <LabelProps htmlFor="image">Hình ảnh chính</LabelProps>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowImageSelector(true);
                      setActiveImageField('image');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Chọn ảnh
                  </Button>
                </div>
                {formData.image && (
                  <div className="mt-2">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded border"
                    />
                  </div>
                )}
              </div>

              {/* Voucher Selection */}
              <div className="mt-4">
                <LabelProps htmlFor="voucher">Voucher liên kết (tùy chọn)</LabelProps>
                <div ref={voucherDropdownRef} className="relative">
                  <button
                    type="button"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-left focus:outline-none focus:border-[#E6C67A] focus:ring-2 focus:ring-[#E6C67A] bg-white flex items-center justify-between"
                    onClick={() => setVoucherDropdownOpen(!voucherDropdownOpen)}
                    disabled={loadingVouchers}
                  >
                    <span className="flex items-center">
                      {selectedVoucher ? (
                        <>
                          <Badge variant="light">
                            {selectedVoucher.code}
                          </Badge>
                          {selectedVoucher.name}
                        </>
                      ) : (
                        "Chọn voucher (không bắt buộc)"
                      )}
                    </span>
                    <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {voucherDropdownOpen && (
                    <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                      <div className="py-1">
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                          onClick={() => {
                            handleInputChange('id_voucher', null);
                            setVoucherDropdownOpen(false);
                          }}
                        >
                          <span className="text-gray-500">Không chọn voucher</span>
                        </button>
                        {vouchers.map((voucher) => (
                          <button
                            key={voucher.id}
                            type="button"
                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${formData.id_voucher === voucher.id ? "bg-blue-50 font-medium" : ""
                              }`}
                            onClick={() => {
                              handleInputChange('id_voucher', voucher.id);
                              setVoucherDropdownOpen(false);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <Badge
                                  variant={voucher.status ? "solid" : "light"}
                                >
                                  {voucher.code}
                                </Badge>
                                <span className="text-sm">{voucher.name}</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {voucher.discount_type === 1 ? 'Cố định' : 'Phần trăm'}
                              </div>
                            </div>
                            {voucher.description && (
                              <p className="text-xs text-gray-400 mt-1 ml-14">{voucher.description}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {selectedVoucher && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-md border">
                    <div className="text-sm">
                      <div className="font-medium text-blue-800">Thông tin voucher đã chọn:</div>
                      <div className="text-blue-700 mt-1">
                        • Mã: <strong>{selectedVoucher.code}</strong><br />
                        • Trạng thái: <Badge variant={selectedVoucher.status ? "solid" : "light"}>
                          {selectedVoucher.status ? 'Hoạt động' : 'Tạm dừng'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Nội dung bài viết</h3>
              <CKEditor
                editor={ClassicEditor as any}
                data={formData.content}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  handleInputChange('content', data);
                }}
                config={{
                  toolbar: [
                    'heading',
                    '|',
                    'bold',
                    'italic',
                    'link',
                    'bulletedList',
                    'numberedList',
                    '|',
                    'outdent',
                    'indent',
                    '|',
                    'imageUpload',
                    'blockQuote',
                    'insertTable',
                    'mediaEmbed',
                    'undo',
                    'redo'
                  ]
                }}
              />
            </div>
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            {/* SEO Section Header */}
            {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">Công cụ phân tích SEO</h3>
                  <p className="text-sm text-blue-700">
                    Tất cả các field SEO bên dưới đều <strong>không bắt buộc</strong>.
                    Đây chỉ là công cụ hỗ trợ tối ưu để cải thiện khả năng hiển thị trên search engines và social media.
                  </p>
                </div>
              </div>
            </div> */}

            {/* Real-time SEO Analysis */}
            <ImprovedSeoAnalysis
              title={formData.title}
              content={formData.content}
              metaDescription={formData.meta_description}
              metaKeywords={formData.meta_keywords}
              slug={formData.slug}
              ogTitle={formData.og_title}
              ogDescription={formData.og_description}
              ogImage={formData.og_image}
              twitterTitle={formData.twitter_title}
              twitterDescription={formData.twitter_description}
              twitterImage={formData.twitter_image}
            />

            {/* SEO Meta Tags */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Meta Tags
              </h3>
              <div className="space-y-4">
                <div>
                  <LabelProps htmlFor="meta_title">Meta Title</LabelProps>
                  <input
                    type="text"
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => handleInputChange('meta_title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E6C67A] focus:border-[#E6C67A]"
                    placeholder="Tiêu đề hiển thị trên Google (30-60 ký tự)"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {formData.meta_title.length}/60 ký tự
                  </div>
                </div>

                <div>
                  <LabelProps htmlFor="meta_description">Meta Description</LabelProps>
                  <TextArea
                    value={formData.meta_description}
                    onChange={(value) => handleInputChange('meta_description', value)}
                    placeholder="Mô tả hiển thị trên Google (120-160 ký tự)"
                    rows={3}
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {formData.meta_description.length}/160 ký tự
                  </div>
                </div>

                <div>
                  <LabelProps htmlFor="meta_keywords">Meta Keywords</LabelProps>
                  <input
                    type="text"
                    id="meta_keywords"
                    value={formData.meta_keywords}
                    onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E6C67A] focus:border-[#E6C67A]"
                    placeholder="Từ khóa, phân cách bằng dấu phẩy"
                  />
                </div>

                <div>
                  <LabelProps htmlFor="canonical_url">Canonical URL</LabelProps>
                  <input
                    type="text"
                    id="canonical_url"
                    value={formData.canonical_url}
                    onChange={(e) => handleInputChange('canonical_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E6C67A] focus:border-[#E6C67A]"
                    placeholder="URL chính thức của bài viết"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Social Media Tab */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            {/* Open Graph */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Open Graph (Facebook, LinkedIn)
              </h3>
              <div className="space-y-4">
                <div>
                  <LabelProps htmlFor="og_title">OG Title</LabelProps>
                  <input
                    type="text"
                    id="og_title"
                    value={formData.og_title}
                    onChange={(e) => handleInputChange('og_title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E6C67A] focus:border-[#E6C67A]"
                    placeholder="Tiêu đề hiển thị khi chia sẻ trên mạng xã hội"
                  />
                </div>

                <div>
                  <LabelProps htmlFor="og_description">OG Description</LabelProps>
                  <TextArea
                    value={formData.og_description}
                    onChange={(value) => handleInputChange('og_description', value)}
                    placeholder="Mô tả hiển thị khi chia sẻ trên mạng xã hội"
                    rows={3}
                  />
                </div>

                <div>
                  <LabelProps htmlFor="og_image">OG Image</LabelProps>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        setShowImageSelector(true);
                        setActiveImageField('og_image');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Chọn ảnh
                    </Button>
                  </div>
                  {formData.og_image && (
                    <div className="mt-2">
                      <img
                        src={formData.og_image}
                        alt="OG Preview"
                        className="w-32 h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Twitter Card */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Twitter Card
              </h3>
              <div className="space-y-4">
                <div>
                  <LabelProps htmlFor="twitter_title">Twitter Title</LabelProps>
                  <input
                    type="text"
                    id="twitter_title"
                    value={formData.twitter_title}
                    onChange={(e) => handleInputChange('twitter_title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E6C67A] focus:border-[#E6C67A]"
                    placeholder="Tiêu đề hiển thị trên Twitter"
                  />
                </div>

                <div>
                  <LabelProps htmlFor="twitter_description">Twitter Description</LabelProps>
                  <TextArea
                    value={formData.twitter_description}
                    onChange={(value) => handleInputChange('twitter_description', value)}
                    placeholder="Mô tả hiển thị trên Twitter"
                    rows={3}
                  />
                </div>

                <div>
                  <LabelProps htmlFor="twitter_image">Twitter Image</LabelProps>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        setShowImageSelector(true);
                        setActiveImageField('twitter_image');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Chọn ảnh
                    </Button>
                  </div>
                  {formData.twitter_image && (
                    <div className="mt-2">
                      <img
                        src={formData.twitter_image}
                        alt="Twitter Preview"
                        className="w-32 h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEO Analysis */}
        {/* {post?.id && (
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Phân tích SEO legacy (chỉ cho bài viết đã lưu)
              </h3>
              <Button
                onClick={() => setShowSeoAnalysis(!showSeoAnalysis)}
                variant="outline"
                size="sm"
              >
                {showSeoAnalysis ? 'Ẩn' : 'Xem'} phân tích legacy
              </Button>
            </div>
            {showSeoAnalysis && (
              <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded">
                Legacy SEO analysis đã được thay thế bằng Real-time analysis ở tab SEO
              </div>
            )}
          </div>
        )} */}

        {/* Validation Policy Notice */}
        {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Chính sách validation</h4>
              <p className="text-sm text-blue-700">
                • <strong>Bắt buộc:</strong> Tiêu đề và nội dung bài viết<br />
                • <strong>Tùy chọn:</strong> Tất cả các field SEO, mô tả, hình ảnh<br />
                • <strong>SEO Analysis:</strong> Chỉ là công cụ hỗ trợ tối ưu, không ảnh hưởng đến việc lưu bài viết
              </p>
            </div>
          </div>
        </div> */}

        {/* Form Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Đang lưu...' : 'Lưu bài viết'}
          </Button>
        </div>
      </form>

      {/* Image Selector Modal */}
      <ImageSelector
        isOpen={showImageSelector}
        onClose={() => {
          setShowImageSelector(false);
          setActiveImageField(null);
        }}
        onSelect={(imageUrl: string) => {
          if (activeImageField) {
            handleInputChange(activeImageField as keyof Post, imageUrl);
          } else {
            handleInputChange('image', imageUrl);
          }
          setShowImageSelector(false);
          setActiveImageField(null);
        }}
        title="Chọn hình ảnh cho bài viết"
      />
    </div>
  );
};

export default PostForm;