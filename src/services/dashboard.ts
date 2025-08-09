// services/dashboard.ts
import { apiClient } from '@/lib/apiClient';

export interface DashboardStats {
  totalMoney: string | number; // API Laravel thường trả về string cho số lớn
  totalOrders: string | number;
  totalCustomers: string | number;
}

export interface TopProduct {
  name: string;
  quantity_sold: number;
  total_price: string | number; // API có thể trả về string
}

export interface TopCustomer {
  name: string;
  total_orders: number;
  total_spent: string | number; // API có thể trả về string
}

export interface MonthlyRevenue {
  month: string;
  year: string;
  revenue: string | number; // API trả về string nhưng có thể xử lý thành number
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class DashboardService {
  // Lấy thống kê theo thời gian
  static async getStatsByPeriod(period: '1' | '3' | '6' | '9' | '12' | '24'): Promise<DashboardStats> {
    let endpoint = '';
    switch (period) {
      case '1':
        endpoint = '/dashboard/byonemonth';
        break;
      case '3':
        endpoint = '/dashboard/bythreemonth';
        break;
      case '6':
        endpoint = '/dashboard/bysixmonth';
        break;
      case '9':
        endpoint = '/dashboard/byninemonth';
        break;
      case '12':
        endpoint = '/dashboard/bytwelvemonth';
        break;
      case '24':
        endpoint = '/dashboard/bytwentyfourmonth';
        break;
    }
    const response = await apiClient.get<ApiResponse<DashboardStats>>(endpoint);
    return response.data;
  }

  // Lấy tổng số sản phẩm
  static async getTotalProducts(): Promise<number> {
    const response = await apiClient.get<ApiResponse<number>>('/dashboard/allproducts');
    return response.data;
  }

  // Lấy top 3 sản phẩm bán chạy
  static async getTopProducts(): Promise<TopProduct[]> {
    const response = await apiClient.get<ApiResponse<TopProduct[]>>('/dashboard/topsellproducts');
    return response.data;
  }

  // Lấy top 3 khách hàng
  static async getTopCustomers(): Promise<TopCustomer[]> {
    const response = await apiClient.get<ApiResponse<TopCustomer[]>>('/dashboard/topcustomers');
    return response.data;
  }

  // Lấy doanh thu 12 tháng gần nhất
  static async getRevenue12Months(): Promise<MonthlyRevenue[]> {
    const response = await apiClient.get<ApiResponse<MonthlyRevenue[]>>('/dashboard/revenue12months');
    return response.data;
  }

  // Helper function để format tiền VND
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }
}
