import React, { useEffect, useRef, useState } from "react";
import apiClient from "@/lib/apiClient";

export type Voucher = {
  code: string;
  name: string;
  status: number;
  description?: string;
  start_date: string;
  end_date: string;
  discount_type: number;
  discount_value: number;
  min_price: number;
  created_at?: string; // Thêm trường created_at nếu cần
};

interface VoucherTableProps {
  vouchers: Voucher[];
  onEdit: (voucher: Voucher) => void;
  onView?: (voucher: Voucher) => void;
}

const statusMap: Record<number, string> = {
  0: "Chưa kích hoạt",
  1: "Đang hoạt động",
  2: "Đang hoạt động",
  3: "Đang hoạt động",
  4: "Hết hạn"
};

const discountTypeMap: Record<number, string> = {
  1: "%",
  2: "VND",
};

const VoucherTable: React.FC<VoucherTableProps> = ({ vouchers, onEdit, onView }) => {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const menuRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Đảm bảo không lỗi nếu onEdit không được truyền
  const safeOnEdit = typeof onEdit === "function" ? onEdit : () => {};

  // Call API khi mount component
  useEffect(() => {
    apiClient.put("/update-status-voucher").catch((err) => {
      console.error("Lỗi khi cập nhật trạng thái voucher:", err);
    });
  }, []);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openMenuIndex !== null &&
        menuRefs.current[openMenuIndex] &&
        !menuRefs.current[openMenuIndex]?.contains(event.target as Node)
      ) {
        setOpenMenuIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuIndex]);

  // Format date string yyyy-MM-dd to dd/MM/yyyy
  // Format ISO date string (with or without time) to dd/MM/yyyy
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    // Try to parse as Date object
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="overflow-x-auto rounded-xl shadow bg-white">
      <table className="min-w-full divide-y divide-gray-200 rounded-xl">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2">Tên</th>
            <th className="px-4 py-2">Mã</th>
            <th className="px-4 py-2">Trạng thái</th>
            <th className="px-4 py-2">Ngày bắt đầu</th>
            <th className="px-4 py-2">Ngày kết thúc</th>
            <th className="px-4 py-2">Giá trị giảm</th>
            <th className="px-4 py-2">Đơn tối thiểu</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {vouchers.map((v, index) => (
            <tr key={v.code + index}>
              <td className="px-4 py-2">
                {v.name}
              </td>
              <td className="px-4 py-2">{v.code}</td>
              <td className="px-4 py-2">
                <span
                  className={`px-2 py-1 rounded-full text-sm font-medium ${
                    v.status === 0
                      ? "bg-orange-100 text-orange-700"
                      : v.status === 1 || v.status === 2 || v.status === 3
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {statusMap[v.status] || v.status}
                </span>
              </td>
              
              <td className="px-4 py-2">{formatDate(v.start_date)}</td>
              <td className="px-4 py-2">{formatDate(v.end_date)}</td>
              <td className="px-4 py-2">
                {v.discount_value.toLocaleString("vi-VN")} {" "}
                {discountTypeMap[v.discount_type] || v.discount_type}
              </td>
              <td className="px-4 py-2">
                {v.min_price.toLocaleString("vi-VN")} VND
              </td>
              <td className="px-4 py-2 relative text-center">
                <div className="flex items-center justify-center">
                  <button
                    onClick={() =>
                      setOpenMenuIndex(openMenuIndex === index ? null : index)
                    }
                    className="text-gray-600 hover:text-gray-900 focus:outline-none p-4"
                  >
                    &#8942;
                  </button>
                </div>

                {openMenuIndex === index && (
                  <div
                    ref={el => { menuRefs.current[index] = el; }}
                    className="absolute right-2 top-full mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                  >
                    <button
                      onClick={() => {
                        if (typeof onView === "function") onView(v);
                        setOpenMenuIndex(null);
                      }}
                      className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                    >
                      Xem
                    </button>
                    <button
                      onClick={() => {
                        safeOnEdit(v);
                        setOpenMenuIndex(null);
                      }}
                      className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                    >
                      Sửa
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VoucherTable;
