"use client";
import React, { useEffect, useState } from "react";
import { DashboardService } from "@/services/dashboard";

export default function MonthlySalesBarChart() {
  const [salesData, setSalesData] = useState<{labels: string[], values: number[]}>({
    labels: [],
    values: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        const data = await DashboardService.getRevenue12Months();
        console.log('Revenue data received:', data);
        
        // Sắp xếp dữ liệu theo thời gian và đảo ngược để có thứ tự từ cũ đến mới
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(parseInt(a.year), parseInt(a.month) - 1);
          const dateB = new Date(parseInt(b.year), parseInt(b.month) - 1);
          return dateA.getTime() - dateB.getTime();
        });

        const labels = sortedData.map(item => `Th${item.month}`);
        const values = sortedData.map(item => {
          const revenue = typeof item.revenue === 'string' ? parseInt(item.revenue) : item.revenue;
          // Chuyển về nghìn VND thay vì triệu để tránh số quá nhỏ
          return Math.round(revenue / 1000); // Chuyển về nghìn VND
        });

        console.log('Processed data:', { labels, values });
        setSalesData({ labels, values });
      } catch (error) {
        console.error('Error fetching revenue data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4 text-gray-800">Doanh thu theo tháng</h3>
        <div className="w-full h-56 animate-pulse bg-gray-200 rounded"></div>
      </div>
    );
  }

  const maxValue = Math.max(...salesData.values) || 1;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold mb-4 text-gray-800">Doanh thu theo tháng (12 tháng gần nhất)</h3>
      <div className="w-full overflow-x-auto custom-scrollbar">
        <div className="h-56 flex items-end gap-2 min-w-[520px] sm:min-w-0">
          {salesData.values.map((v, i) => (
            <div key={i} className="flex flex-col items-center flex-1 min-w-[32px]">
              <div
                className="bg-blue-500 rounded-t w-6 min-h-[4px]"
                style={{ height: `${(v / maxValue) * 200}px` }}
                title={`${v} nghìn VND`}
              ></div>
              <span className="text-xs text-gray-400 mt-1">{salesData.labels[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500 text-center">
        Đơn vị: Nghìn VND
      </div>
    </div>
  );
} 