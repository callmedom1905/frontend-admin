"use client";
import React, { useEffect, useState } from "react";
import { DashboardService, TopCustomer } from "@/services/dashboard";

export default function TopCustomersTable() {
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopCustomers = async () => {
      try {
        setLoading(true);
        const data = await DashboardService.getTopCustomers();
        setTopCustomers(data);
      } catch (error) {
        console.error('Error fetching top customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCustomers();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4 text-gray-800">Top khách hàng</h3>
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
      <h3 className="font-semibold mb-4 text-gray-800">Top khách hàng</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b">
            <th className="py-2 text-left">Khách hàng</th>
            <th className="py-2 text-right">Số đơn</th>
            <th className="py-2 text-right">Tổng chi</th>
          </tr>
        </thead>
        <tbody>
          {topCustomers.map((c) => (
            <tr key={c.name} className="border-b last:border-0">
              <td className="py-2">{c.name}</td>
              <td className="py-2 text-right">{c.total_orders}</td>
              <td className="py-2 text-right">
                {DashboardService.formatCurrency(
                  typeof c.total_spent === 'string' ? parseInt(c.total_spent) : (c.total_spent || 0)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 