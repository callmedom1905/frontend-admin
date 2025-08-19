import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';

export default function AiPostGenerator({ onGenerated }: { onGenerated: (content: string) => void }) {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [description, setDescription] = useState('');
  const [length, setLength] = useState(500);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult('');
    try {
      const res = await apiClient.post('/ai/generate-post', {
        topic, keywords, description, length,
      });
      console.log(res);
      
      setResult(res.data.content);
      onGenerated && onGenerated(res.data.content);
    } catch (err) {
      setResult('Có lỗi xảy ra khi gọi AI!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleGenerate} className="space-y-4 p-4 border rounded bg-white">
      <div>
        <label className="block font-medium">Chủ đề bài viết *</label>
        <input value={topic} onChange={e => setTopic(e.target.value)} required className="input" />
      </div>
      <div>
        <label className="block font-medium">Từ khóa (phân cách bằng dấu phẩy)</label>
        <input value={keywords} onChange={e => setKeywords(e.target.value)} className="input" />
      </div>
      <div>
        <label className="block font-medium">Mô tả ngắn</label>
        <input value={description} onChange={e => setDescription(e.target.value)} className="input" />
      </div>
      <div>
        <label className="block font-medium">Độ dài mong muốn (số từ)</label>
        <input type="number" value={length} onChange={e => setLength(Number(e.target.value))} min={100} max={2000} className="input" />
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? 'Đang tạo...' : 'Tạo bài viết bằng AI'}
      </button>
      {result && (
        <div className="mt-4">
          <label className="block font-medium">Kết quả AI:</label>
          <textarea value={result} readOnly rows={10} className="w-full border rounded p-2" />
        </div>
      )}
    </form>
  );
}
