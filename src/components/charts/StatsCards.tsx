"use client";
import React, { useEffect, useState } from "react";
import { DashboardService, DashboardStats } from "@/services/dashboard";

interface StatsCardsProps {
  period?: '1' | '3' | '6' | '9' | '12' | '24';
}

export default function StatsCards({ period = '1' }: StatsCardsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [statsData, productsData] = await Promise.all([
          DashboardService.getStatsByPeriod(period),
          DashboardService.getTotalProducts()
        ]);
        setStats(statsData);
        setTotalProducts(productsData);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-5 shadow-sm flex flex-col gap-2">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    { 
      label: "Doanh thu", 
      value: DashboardService.formatCurrency(
        typeof stats?.totalMoney === 'string' ? parseInt(stats.totalMoney) : (stats?.totalMoney || 0)
      )
    },
    { 
      label: "Đơn hàng", 
      value: (
        typeof stats?.totalOrders === 'string' ? parseInt(stats.totalOrders) : (stats?.totalOrders || 0)
      ).toLocaleString('vi-VN')
    },
    { 
      label: "Khách hàng", 
      value: (
        typeof stats?.totalCustomers === 'string' ? parseInt(stats.totalCustomers) : (stats?.totalCustomers || 0)
      ).toLocaleString('vi-VN')
    },
    { 
      label: "Sản phẩm", 
      value: (
        typeof totalProducts === 'string' ? parseInt(totalProducts) : totalProducts
      ).toLocaleString('vi-VN')
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((m) => (
        <div key={m.label} className="rounded-xl border bg-white p-5 shadow-sm flex flex-col gap-2">
          <span className="text-gray-500 text-sm">{m.label}</span>
          <span className="text-2xl font-bold text-gray-800">{m.value}</span>
        </div>
      ))}
    </div>
  );
} 