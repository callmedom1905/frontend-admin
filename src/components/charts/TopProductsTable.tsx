"use client";
import React, { useEffect, useState } from "react";
import { DashboardService, TopProduct } from "@/services/dashboard";

export default function TopProductsTable() {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        setLoading(true);
        const data = await DashboardService.getTopProducts();
        setTopProducts(data);
      } catch (error) {
        console.error('Error fetching top products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4 text-gray-800">Top sản phẩm bán chạy</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold mb-4 text-gray-800">Top sản phẩm bán chạy</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b">
            <th className="py-2 text-left">Sản phẩm</th>
            <th className="py-2 text-right">Đã bán</th>
            <th className="py-2 text-right">Doanh thu</th>
          </tr>
        </thead>
        <tbody>
          {topProducts.map((p) => (
            <tr key={p.name} className="border-b last:border-0">
              <td className="py-2">{p.name}</td>
              <td className="py-2 text-right">{p.quantity_sold}</td>
              <td className="py-2 text-right">
                {DashboardService.formatCurrency(
                  typeof p.total_price === 'string' ? parseInt(p.total_price) : p.total_price
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 