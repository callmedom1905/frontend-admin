'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Search,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  FileText,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe
} from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface SeoMetric {
  label: string;
  value: number;
  change: number | string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'stable';
}

interface TopPost {
  id: number;
  title: string;
  slug: string;
  seo_score: number;
  seo_grade: string;
  views?: number;
  clicks?: number;
  impressions?: number;
  ctr?: number;
}

interface SeoIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  count: number;
  posts: string[];
}

export default function SeoDashboard() {
  const [metrics, setMetrics] = useState<SeoMetric[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [lowScoringPosts, setLowScoringPosts] = useState<TopPost[]>([]);
  const [seoIssues, setSeoIssues] = useState<SeoIssue[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch SEO dashboard stats from API
      const response = await apiClient.get('/seo/dashboard-stats');
      console.log('API Response:', response.data); // Debug log
      const data = response.data.data || response.data;

      // Set metrics from API response with proper mapping
      setMetrics([
        {
          label: 'Tổng bài viết',
          value: data.total_posts || 0,
          change: data.published_posts > 0 ? ((data.published_posts / data.total_posts) * 100).toFixed(1) : '0',
          icon: <FileText className="w-5 h-5" />,
          trend: data.total_posts > 0 ? 'up' : 'stable'
        },
        {
          label: 'Điểm SEO trung bình',
          value: Math.round(data.average_seo_score || 0),
          change: (data.average_seo_score || 0) >= 70 ? 'Tốt' : (data.average_seo_score || 0) >= 50 ? 'Khá' : 'Yếu',
          icon: <TrendingUp className="w-5 h-5" />,
          trend: (data.average_seo_score || 0) >= 70 ? 'up' : (data.average_seo_score || 0) >= 50 ? 'stable' : 'down'
        },
        {
          label: 'Bài viết tốt (≥80đ)',
          value: data.high_scoring_posts || 0,
          change: (data.total_posts || 0) > 0 ? (((data.high_scoring_posts || 0) / (data.total_posts || 1)) * 100).toFixed(1) : '0',
          icon: <Star className="w-5 h-5" />,
          trend: (data.high_scoring_posts || 0) > 0 ? 'up' : 'stable'
        },
        {
          label: 'Cần cải thiện (<50đ)',
          value: data.low_scoring_posts || 0,
          change: (data.total_posts || 0) > 0 ? (((data.low_scoring_posts || 0) / (data.total_posts || 1)) * 100).toFixed(1) : '0',
          icon: <AlertTriangle className="w-5 h-5" />,
          trend: (data.low_scoring_posts || 0) > 0 ? 'down' : 'up'
        }
      ]);

      // Set top performing posts
      setTopPosts(data.top_posts || []);

      // Set low scoring posts
      setLowScoringPosts(data.worst_posts || []);

      // Set grade distribution from API
      const gradeData = data.grade_distribution || {};
      setGradeDistribution([
        { label: 'Xuất sắc (90-100)', count: (gradeData['A+'] || 0), color: 'bg-green-500' },
        { label: 'Tốt (80-89)', count: (gradeData['A'] || 0), color: 'bg-blue-500' },
        { label: 'Khá (60-79)', count: (gradeData['B'] || 0) + (gradeData['C'] || 0), color: 'bg-yellow-500' },
        { label: 'Yếu (40-59)', count: (gradeData['D'] || 0), color: 'bg-orange-500' },
        { label: 'Kém (<40)', count: (gradeData['F'] || 0), color: 'bg-red-500' }
      ]);

      // Set SEO issues
      setSeoIssues((data.seo_issues || []).map((issue: any) => ({
        type: issue.type,
        message: issue.title,
        count: issue.count,
        posts: issue.affected_posts || []
      })));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to empty data
      setMetrics([
        {
          label: 'Tổng bài viết',
          value: 0,
          change: '0',
          icon: <FileText className="w-5 h-5" />,
          trend: 'stable'
        },
        {
          label: 'Điểm SEO trung bình',
          value: 0,
          change: 'N/A',
          icon: <TrendingUp className="w-5 h-5" />,
          trend: 'stable'
        },
        {
          label: 'Bài viết tốt (≥80đ)',
          value: 0,
          change: '0',
          icon: <Star className="w-5 h-5" />,
          trend: 'stable'
        },
        {
          label: 'Cần cải thiện (<50đ)',
          value: 0,
          change: '0',
          icon: <AlertTriangle className="w-5 h-5" />,
          trend: 'stable'
        }
      ]);
      setTopPosts([]);
      setLowScoringPosts([]);
      setGradeDistribution([]);
      setSeoIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const recalculateAllScores = async () => {
    setRecalculating(true);
    try {
      const response = await apiClient.post('/admin/seo/recalculate-all');
      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        // Refresh data after recalculation
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error recalculating SEO scores:', error);
      alert('❌ Có lỗi xảy ra khi tính lại điểm SEO');
    } finally {
      setRecalculating(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getIssueIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO Dashboard</h1>
              <p className="text-gray-600">Tổng quan hiệu suất SEO và phân tích bài viết</p>
            </div>

          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    {metric.icon}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{metric.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : 
                   metric.trend === 'down' ? <TrendingDown className="w-4 h-4" /> : 
                   <Activity className="w-4 h-4" />}
                  {typeof metric.change === 'number' ? `${Math.abs(metric.change)}%` : metric.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Tổng quan', icon: <BarChart3 className="w-4 h-4" /> },
                { id: 'top-posts', label: 'Bài viết tốt nhất', icon: <Star className="w-4 h-4" /> },
                { id: 'issues', label: 'Vấn đề cần sửa', icon: <AlertTriangle className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Distribution */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Phân bố điểm SEO</h3>
                  <div className="space-y-3">
                    {gradeDistribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${item.color}`}></div>
                          <span className="text-sm text-gray-600">{item.label}</span>
                        </div>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Hoạt động gần đây</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">SEO algorithm updated</p>
                        <p className="text-xs text-green-600">Thuật toán SEO được cập nhật với tiêu chí nghiêm ngặt hơn</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Realtime analysis enabled</p>
                        <p className="text-xs text-blue-600">Phân tích SEO realtime đã được kích hoạt</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Globe className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Structured data added</p>
                        <p className="text-xs text-yellow-600">Schema.org structured data được thêm vào tất cả bài viết</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Posts Tab */}
            {activeTab === 'top-posts' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Bài viết có điểm SEO cao nhất</h3>
                <div className="space-y-3">
                  {topPosts.map((post, index) => (
                    <div key={post.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-sm font-medium text-blue-600">
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 truncate max-w-md">{post.title}</h4>
                          <p className="text-sm text-gray-500">/{post.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getScoreColor(post.seo_score || 0)}`}>
                            {post.seo_score || 0}/100
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${getGradeColor(post.seo_grade || 'F')}`}>
                            {post.seo_grade || 'F'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issues Tab */}
            {activeTab === 'issues' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Vấn đề SEO cần khắc phục</h3>
                
                {seoIssues.length > 0 ? (
                  <div className="space-y-4">
                    {seoIssues.map((issue, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getIssueIcon(issue.type)}
                            <span className="font-medium">{issue.message}</span>
                          </div>
                          <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
                            {issue.count} bài viết
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="mb-2">Bài viết bị ảnh hưởng:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {issue.posts.map((postTitle, idx) => (
                              <li key={idx} className="truncate">{postTitle}</li>
                            ))}
                            {issue.count > issue.posts.length && (
                              <li className="text-gray-500">... và {issue.count - issue.posts.length} bài viết khác</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Tuyệt vời!</h4>
                    <p className="text-gray-600">Không có vấn đề SEO nào được phát hiện.</p>
                  </div>
                )}

                {/* Low Scoring Posts */}
                {lowScoringPosts.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4">Bài viết cần cải thiện điểm SEO</h4>
                    <div className="space-y-3">
                      {lowScoringPosts.map((post, index) => (
                        <div key={post.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                          <div>
                            <h5 className="font-medium text-gray-900 truncate max-w-md">{post.title}</h5>
                            <p className="text-sm text-gray-500">/{post.slug}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">
                              {post.seo_score || 0}/100
                            </div>
                            <div className="text-xs px-2 py-1 rounded bg-red-100 text-red-600">
                              {post.seo_grade || 'F'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
