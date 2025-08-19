'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  TrendingUp,
  Eye,
  Clock,
  FileText,
  Image as ImageIcon,
  Link,
  Share2
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface SeoAnalysisProps {
  postId: string;
  onClose?: () => void;
}

interface SeoAnalysisData {
  score: number;
  maxScore: number;
  grade: string;
  issues: string[];
  suggestions: string[];
  details: {
    title: any;
    meta_description: any;
    content: any;
    images: any;
    url: any;
    social_media: any;
  };
}

interface KeywordAnalysis {
  keyword: string;
  count: number;
  density: number;
  total_words: number;
  optimal_range: string;
  status: 'optimal' | 'low' | 'high';
}

const SeoAnalysis: React.FC<SeoAnalysisProps> = ({ postId, onClose }) => {
  const [seoData, setSeoData] = useState<SeoAnalysisData | null>(null);
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSeoAnalysis();
  }, [postId]);

  const fetchSeoAnalysis = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`/posts/${postId}/seo-analysis`);
      if (data.status === 'success') {
        setSeoData(data.data.seo_analysis);
        setKeywordAnalysis(data.data.keyword_analysis || []);
      } else {
        setError(data.message || 'Có lỗi xảy ra khi tải phân tích SEO');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải phân tích SEO');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'A+' || grade === 'A') return 'bg-green-100 text-green-800';
    if (grade === 'B') return 'bg-yellow-100 text-yellow-800';
    if (grade === 'C') return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'low':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'high':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Đang phân tích SEO...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!seoData) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Phân tích SEO
            </h3>
            {onClose && (
              <Button onClick={onClose} variant="outline" size="sm">
                Đóng
              </Button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Tổng quan
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'details' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('details')}
            >
              Chi tiết
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'keywords' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('keywords')}
            >
              Từ khóa
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'suggestions' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('suggestions')}
            >
              Đề xuất
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* SEO Score */}
              <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div className="text-4xl font-bold mb-2">
                  <span className={getScoreColor(seoData.score)}>
                    {seoData.score}/{seoData.maxScore}
                  </span>
                </div>
                <Badge variant="solid" color="success">
                  {seoData.grade}
                </Badge>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${seoData.score}%` }}
                  ></div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border">
                  <FileText className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{seoData.details.content.word_count}</div>
                  <div className="text-sm text-gray-600">Từ</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{seoData.details.content.word_count > 0 ? Math.ceil(seoData.details.content.word_count / 200) : 0}</div>
                  <div className="text-sm text-gray-600">Phút đọc</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <ImageIcon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">{seoData.details.images.image_count}</div>
                  <div className="text-sm text-gray-600">Hình ảnh</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <Link className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold">{seoData.details.url.length}</div>
                  <div className="text-sm text-gray-600">Ký tự URL</div>
                </div>
              </div>

              {/* Issues and Suggestions */}
              {seoData.issues.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <XCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Vấn đề cần khắc phục:</h3>
                      <ul className="mt-2 list-disc list-inside text-sm text-red-700">
                        {seoData.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Title Analysis */}
              <div className="bg-white rounded-lg border p-4">
                <h4 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5" />
                  Phân tích tiêu đề
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Điểm số:</span>
                    <span className="font-semibold">{seoData.details.title.score}/25</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Độ dài:</span>
                    <span>{seoData.details.title.length} ký tự</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(seoData.details.title.score / 25) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Meta Description Analysis */}
              <div className="bg-white rounded-lg border p-4">
                <h4 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5" />
                  Phân tích meta description
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Điểm số:</span>
                    <span className="font-semibold">{seoData.details.meta_description.score}/20</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Độ dài:</span>
                    <span>{seoData.details.meta_description.length} ký tự</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(seoData.details.meta_description.score / 20) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Content Analysis */}
              <div className="bg-white rounded-lg border p-4">
                <h4 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5" />
                  Phân tích nội dung
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Điểm số:</span>
                    <span className="font-semibold">{seoData.details.content.score}/25</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số từ:</span>
                    <span>{seoData.details.content.word_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số đoạn:</span>
                    <span>{seoData.details.content.paragraphs}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(seoData.details.content.score / 25) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Image Analysis */}
              <div className="bg-white rounded-lg border p-4">
                <h4 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <ImageIcon className="w-5 h-5" />
                  Phân tích hình ảnh
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Điểm số:</span>
                    <span className="font-semibold">{seoData.details.images.score}/15</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số hình ảnh:</span>
                    <span>{seoData.details.images.image_count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(seoData.details.images.score / 15) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Keywords Tab */}
          {activeTab === 'keywords' && (
            <div className="space-y-4">
              {keywordAnalysis.length > 0 ? (
                keywordAnalysis.map((keyword, index) => (
                  <div key={index} className="bg-white rounded-lg border p-4">
                    <h4 className="text-lg font-semibold flex items-center gap-2 mb-3">
                      {getStatusIcon(keyword.status)}
                      Từ khóa: {keyword.keyword}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Số lần xuất hiện</div>
                        <div className="text-lg font-semibold">{keyword.count}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Mật độ</div>
                        <div className="text-lg font-semibold">{keyword.density}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Tổng từ</div>
                        <div className="text-lg font-semibold">{keyword.total_words}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Trạng thái</div>
                        <Badge 
                          variant="solid"
                          color={keyword.status === 'optimal' ? 'success' : 
                                 keyword.status === 'low' ? 'warning' : 'error'}
                        >
                          {keyword.status === 'optimal' ? 'Tối ưu' :
                           keyword.status === 'low' ? 'Thấp' : 'Cao'}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      Khoảng tối ưu: {keyword.optimal_range}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <Info className="h-5 w-5 text-blue-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Thông báo</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        Chưa có từ khóa nào được phân tích. Hãy thêm meta keywords vào bài viết.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Suggestions Tab */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              {seoData.suggestions.length > 0 ? (
                seoData.suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      <div className="ml-3">
                        <div className="text-sm text-yellow-700">{suggestion}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Tuyệt vời!</h3>
                      <div className="mt-2 text-sm text-green-700">
                        Bài viết của bạn đã được tối ưu SEO tốt.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeoAnalysis; 