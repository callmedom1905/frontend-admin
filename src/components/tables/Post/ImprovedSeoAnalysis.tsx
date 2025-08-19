'use client';

import React, { useState, useEffect } from 'react';
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

interface SeoScoreProps {
  title: string;
  content: string;
  metaDescription: string;
  metaKeywords: string;
  slug: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

interface SeoAnalysis {
  score: number;
  maxScore: number;
  grade: string;
  issues: string[];
  suggestions: string[];
  details: {
    content: any;
    title: any;
    meta_description: any;
    technical: any;
    social: any;
  };
}

export default function ImprovedSeoAnalysis({ 
  title, 
  content, 
  metaDescription, 
  metaKeywords,
  slug,
  ogTitle,
  ogDescription,
  ogImage,
  twitterTitle,
  twitterDescription,
  twitterImage
}: SeoScoreProps) {
  const [seoAnalysis, setSeoAnalysis] = useState<SeoAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Real-time SEO calculation using improved algorithm
  const calculateSeoScore = () => {
    setIsAnalyzing(true);
    
    // Simulate the improved backend algorithm
    let score = 0;
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Content Quality Analysis (35 points)
    const contentAnalysis = analyzeContent(content, metaKeywords);
    score += contentAnalysis.score;
    issues.push(...contentAnalysis.issues);
    suggestions.push(...contentAnalysis.suggestions);
    
    // Title Analysis (20 points)
    const titleAnalysis = analyzeTitle(title, metaKeywords);
    score += titleAnalysis.score;
    issues.push(...titleAnalysis.issues);
    suggestions.push(...titleAnalysis.suggestions);
    
    // Meta Description Analysis (15 points)
    const metaAnalysis = analyzeMetaDescription(metaDescription);
    score += metaAnalysis.score;
    issues.push(...metaAnalysis.issues);
    suggestions.push(...metaAnalysis.suggestions);
    
    // Technical SEO (15 points)
    const technicalAnalysis = analyzeTechnical(slug, content);
    score += technicalAnalysis.score;
    issues.push(...technicalAnalysis.issues);
    suggestions.push(...technicalAnalysis.suggestions);
    
    // Social Media (15 points)
    const socialAnalysis = analyzeSocial(
      ogTitle || '', 
      ogDescription || '', 
      ogImage || '', 
      twitterTitle || '', 
      twitterDescription || '', 
      twitterImage || ''
    );
    score += socialAnalysis.score;
    issues.push(...socialAnalysis.issues);
    suggestions.push(...socialAnalysis.suggestions);
    
    const grade = getGrade(score);
    
    setSeoAnalysis({
      score: Math.min(score, 100),
      maxScore: 100,
      grade,
      issues,
      suggestions,
      details: {
        content: contentAnalysis,
        title: titleAnalysis,
        meta_description: metaAnalysis,
        technical: technicalAnalysis,
        social: socialAnalysis
      }
    });
    
    setIsAnalyzing(false);
  };

  // Analyze content quality (stricter than before)
  const analyzeContent = (content: string, keywords: string) => {
    let score = 0;
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    const plainText = content.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
    
    // Word count analysis (15 points max)
    if (wordCount >= 800) {
      score += 15;
    } else if (wordCount >= 500) {
      score += 12;
    } else if (wordCount >= 300) {
      score += 8;
    } else if (wordCount >= 150) {
      score += 4;
    } else {
      issues.push(`Nội dung quá ngắn (${wordCount} từ)`);
      suggestions.push('Viết ít nhất 300 từ để SEO tốt. Nên có 500+ từ.');
    }
    
    // Heading analysis (10 points max)
    const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
    const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
    const h3Count = (content.match(/<h3[^>]*>/gi) || []).length;
    
    if (h1Count === 1) {
      score += 3;
    } else if (h1Count === 0) {
      issues.push('Thiếu thẻ H1');
      suggestions.push('Thêm đúng 1 thẻ H1 vào nội dung');
    } else {
      issues.push('Có nhiều thẻ H1');
      suggestions.push('Chỉ dùng 1 thẻ H1 trên mỗi trang');
    }
    
    if (h2Count >= 2) {
      score += 4;
    } else if (h2Count === 1) {
      score += 2;
    } else {
      suggestions.push('Thêm thẻ H2 để cấu trúc nội dung tốt hơn');
    }
    
    if (h3Count >= 1) {
      score += 3;
    }
    
    // Keyword analysis (5 points max)
    if (keywords) {
      const keywordList = keywords.split(',').map(k => k.trim());
      let keywordFound = false;
      
      keywordList.forEach(keyword => {
        const keywordCount = (plainText.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
        const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
        
        if (density >= 1 && density <= 3) {
          score += 2;
          keywordFound = true;
        } else if (density > 3) {
          issues.push(`Từ khóa "${keyword}" xuất hiện quá nhiều (${density.toFixed(1)}%)`);
        } else if (density > 0) {
          suggestions.push(`Cân nhắc dùng "${keyword}" nhiều hơn (hiện tại: ${density.toFixed(1)}%)`);
        }
      });
      
      if (!keywordFound && keywordList.length > 0) {
        suggestions.push('Thêm từ khóa target vào nội dung với mật độ 1-3%');
      }
    }
    
    return { score: Math.min(score, 35), issues, suggestions, wordCount };
  };

  // Analyze title (stricter)
  const analyzeTitle = (title: string, keywords: string) => {
    let score = 0;
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    const length = title.length;
    
    // Length analysis (10 points max)
    if (length >= 50 && length <= 60) {
      score += 10;
    } else if (length >= 40 && length <= 65) {
      score += 8;
    } else if (length >= 30 && length <= 70) {
      score += 5;
    } else if (length > 0) {
      score += 2;
    }
    
    if (length > 60) {
      issues.push(`Tiêu đề quá dài (${length} ký tự)`);
      suggestions.push('Giữ tiêu đề từ 50-60 ký tự để hiển thị tối ưu');
    } else if (length < 40) {
      suggestions.push('Cân nhắc làm tiêu đề dài hơn (40+ ký tự) cho SEO tốt hơn');
    }
    
    // Keyword in title (5 points max)
    if (keywords) {
      const keywordList = keywords.split(',').map(k => k.trim());
      let keywordFound = false;
      
      keywordList.forEach(keyword => {
        if (title.toLowerCase().includes(keyword.toLowerCase())) {
          score += 5;
          keywordFound = true;
        }
      });
      
      if (!keywordFound) {
        issues.push('Không tìm thấy từ khóa target trong tiêu đề');
        suggestions.push('Đưa từ khóa chính vào tiêu đề, tốt nhất là ở đầu');
      }
    }
    
    // Title case (3 points max)
    if (/^[A-Z]/.test(title)) {
      score += 2;
    }
    
    // Uniqueness (2 points max)
    score += 2;
    
    return { score: Math.min(score, 20), issues, suggestions, length };
  };

  // Analyze meta description (stricter)
  const analyzeMetaDescription = (description: string) => {
    let score = 0;
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    const length = description.length;
    
    // Length analysis (15 points max)
    if (length >= 150 && length <= 160) {
      score += 15;
    } else if (length >= 140 && length <= 165) {
      score += 12;
    } else if (length >= 120 && length <= 180) {
      score += 8;
    } else if (length > 0) {
      score += 4;
    } else {
      issues.push('Thiếu meta description');
      suggestions.push('Thêm meta description hấp dẫn từ 150-160 ký tự');
    }
    
    if (length > 160) {
      issues.push(`Meta description quá dài (${length} ký tự)`);
      suggestions.push('Giữ meta description dưới 160 ký tự để tránh bị cắt');
    } else if (length < 140 && length > 0) {
      suggestions.push('Cân nhắc làm meta description dài hơn (140+ ký tự) cho CTR tốt hơn');
    }
    
    return { score: Math.min(score, 15), issues, suggestions, length };
  };

  // Analyze technical SEO
  const analyzeTechnical = (slug: string, content: string) => {
    let score = 0;
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Slug analysis (5 points)
    const slugLength = slug.length;
    if (slugLength >= 3 && slugLength <= 50) {
      score += 3;
    } else if (slugLength > 50) {
      issues.push('URL slug quá dài');
      suggestions.push('Giữ URL slug dưới 50 ký tự');
    }
    
    if (/^[a-z0-9-]+$/.test(slug)) {
      score += 2;
    } else {
      issues.push('URL chứa ký tự không hợp lệ');
      suggestions.push('Chỉ dùng chữ thường, số và gạch ngang trong URL');
    }
    
    // Image analysis (5 points)
    const images = content.match(/<img[^>]+>/gi) || [];
    if (images.length > 0) {
      score += 2;
      
      let imagesWithAlt = 0;
      images.forEach(img => {
        const altMatch = img.match(/alt=["\']([^"\']+)["\']/i);
        if (altMatch && altMatch[1].trim()) {
          imagesWithAlt++;
        }
      });
      
      const altPercentage = (imagesWithAlt / images.length) * 100;
      if (altPercentage === 100) {
        score += 3;
      } else if (altPercentage >= 80) {
        score += 2;
      } else if (altPercentage >= 50) {
        score += 1;
      } else {
        issues.push('Nhiều hình ảnh thiếu alt text mô tả');
        suggestions.push('Thêm alt text mô tả cho tất cả hình ảnh');
      }
    }
    
    // Links analysis (5 points)
    const links = content.match(/<a[^>]+href=/gi) || [];
    if (links.length >= 2) {
      score += 5;
    } else if (links.length === 1) {
      score += 3;
    } else {
      suggestions.push('Thêm liên kết nội bộ đến nội dung liên quan');
    }
    
    return { score: Math.min(score, 15), issues, suggestions };
  };

  // Analyze social media
  const analyzeSocial = (ogTitle: string, ogDescription: string, ogImage: string, twitterTitle: string, twitterDescription: string, twitterImage: string) => {
    let score = 0;
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Open Graph (8 points)
    if (ogTitle) score += 3;
    else suggestions.push('Thêm Open Graph title cho chia sẻ mạng xã hội tốt hơn');
    
    if (ogDescription) score += 3;
    else suggestions.push('Thêm Open Graph description');
    
    if (ogImage) score += 2;
    else suggestions.push('Thêm Open Graph image (khuyến nghị 1200x630px)');
    
    // Twitter Cards (4 points)
    if (twitterTitle) score += 2;
    if (twitterDescription) score += 1;
    if (twitterImage) score += 1;
    
    // Schema markup (3 points) - always give this since it's auto-generated
    score += 3;
    
    return { score: Math.min(score, 15), issues, suggestions };
  };

  const getGrade = (score: number): string => {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 75) return 'B';
    if (score >= 65) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A+': return 'text-green-600 bg-green-100';
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateSeoScore();
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, content, metaDescription, metaKeywords, slug, ogTitle, ogDescription, ogImage, twitterTitle, twitterDescription, twitterImage]);

  if (!seoAnalysis) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Phân tích SEO</h3>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Đang phân tích...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Phân tích SEO Realtime</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{seoAnalysis.score}/100</div>
            <div className={`text-sm font-medium px-2 py-1 rounded ${getGradeColor(seoAnalysis.grade)}`}>
              Xếp hạng {seoAnalysis.grade}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Điểm SEO</span>
          <span>{seoAnalysis.score}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              seoAnalysis.score >= 85 ? 'bg-green-500' :
              seoAnalysis.score >= 70 ? 'bg-blue-500' :
              seoAnalysis.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${seoAnalysis.score}%` }}
          ></div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Nội dung
            </span>
            <span className="font-medium">{seoAnalysis.details.content.score}/35</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Tiêu đề
            </span>
            <span className="font-medium">{seoAnalysis.details.title.score}/20</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Meta Description
            </span>
            <span className="font-medium">{seoAnalysis.details.meta_description.score}/15</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Kỹ thuật
            </span>
            <span className="font-medium">{seoAnalysis.details.technical.score}/15</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Mạng xã hội
            </span>
            <span className="font-medium">{seoAnalysis.details.social.score}/15</span>
          </div>
        </div>
      </div>

      {/* Issues and Suggestions */}
      <div className="space-y-4">
        {seoAnalysis.issues.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-red-600 mb-2">
              <XCircle className="w-4 h-4" />
              Vấn đề cần sửa ({seoAnalysis.issues.length})
            </h4>
            <div className="space-y-1">
              {seoAnalysis.issues.map((issue, index) => (
                <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                  • {issue}
                </div>
              ))}
            </div>
          </div>
        )}

        {seoAnalysis.suggestions.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-yellow-600 mb-2">
              <AlertTriangle className="w-4 h-4" />
              Gợi ý cải thiện ({seoAnalysis.suggestions.length})
            </h4>
            <div className="space-y-1">
              {seoAnalysis.suggestions.map((suggestion, index) => (
                <div key={index} className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                  • {suggestion}
                </div>
              ))}
            </div>
          </div>
        )}

        {seoAnalysis.issues.length === 0 && seoAnalysis.suggestions.length === 0 && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Tuyệt vời! Không có vấn đề SEO nào được phát hiện.</span>
          </div>
        )}
      </div>

      {/* Content Stats */}
      {seoAnalysis.details.content.wordCount && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {seoAnalysis.details.content.wordCount} từ
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              ~{Math.ceil(seoAnalysis.details.content.wordCount / 200)} phút đọc
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
