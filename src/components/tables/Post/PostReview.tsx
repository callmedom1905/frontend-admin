import React from "react";

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
  user?: {
    id: number;
    name: string;
    email: string;
    profile_image?: string;
  };
}

interface PostReviewProps {
  post: Post;
  onClose?: () => void;
}

const PostReview: React.FC<PostReviewProps> = ({ post, onClose }) => {
  // Ngăn cuộn nền khi mở modal
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

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

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/40 flex items-center justify-center transition-opacity duration-200"
      style={{ animation: "fadeInModal 0.25s" }}
    >
      <div
        className="relative max-w-2xl w-full"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{ animation: "scaleInModal 0.25s" }}
      >
        {/* Nút đóng luôn nổi trên thanh trượt */}
        <button
          className="sticky top-0 right-0 z-30 float-right m-2 bg-gray-200 hover:bg-red-500 hover:text-white rounded-full p-2 transition shadow"
          style={{ position: "absolute", zIndex: 30 }}
          onClick={onClose}
          title="Đóng"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Nội dung box với border bo tròn đều các góc, không bị vuông khi trượt */}
        <div
          className="bg-white rounded-2xl shadow-xl p-8 overflow-y-auto max-h-[90vh] border border-gray-200"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Ẩn thanh trượt trên Chrome/Safari/Edge */}
          <style>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none !important;
            }
            @keyframes fadeInModal {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleInModal {
              from { opacity: 0; transform: scale(0.95);}
              to { opacity: 1; transform: scale(1);}
            }
          `}</style>
          <div className="hide-scrollbar">
            <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
            <div className="mb-4 text-gray-500 text-sm">
              <span>Slug:  {post.slug.length > 24
                ? post.slug.slice(0, 24) + "..."
                : post.slug}</span> | <span>Lượt xem: {post.views}</span> | <span>Trạng thái: {post.status ? "Đã đăng" : "Ẩn"}</span>
            </div>
            {post.image && (
              <div className="mb-4 flex justify-center">
                <img src={post.image} alt={post.title} className="max-h-64 rounded-xl shadow" />
              </div>
            )}
            <div className="mb-4 text-gray-700">
              <strong>Mô tả ngắn:</strong>
              <div className="mt-1">{post.description}</div>
            </div>
            <div className="mb-4 text-gray-700">
              <strong>Nội dung:</strong>
              <div className="prose max-w-none mt-1" dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
            <div className="text-sm text-gray-400 mt-6">
              Người tạo: {post.user?.name || "Ẩn danh"} | Ngày tạo: {formatDate(post.created_at)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostReview;
