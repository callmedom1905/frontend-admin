import React, { useEffect, useState } from "react";
import { Voucher } from "@/components/tables/VoucherTable";
import apiClientBase from "@/lib/apiClient";

// Extend the Voucher interface to include id
interface VoucherWithId extends Voucher {
  id: number;
}

interface VoucherDetailProps {
  voucher: VoucherWithId;
  onBack: () => void;
  formatDate?: (date: string) => string;
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



interface VoucherUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

const VoucherDetail: React.FC<VoucherDetailProps> = ({ voucher, onBack, formatDate }) => {
  const [users, setUsers] = useState<VoucherUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClientBase.get(`/vouchers/${voucher.id}/users`);
        const data = res.data.data || res.data;
        // console.log('API data:', data);
        const mappedUsers = data.map((u: { id_user: number; name_user: string; email_user: string; phone_user: string | null }) => ({
          id: u.id_user,
          name: u.name_user,
          email: u.email_user,
          phone: u.phone_user,
        }));
        console.log('Mapped users:', mappedUsers);
        setUsers(mappedUsers);
      } catch (error: unknown) {
        console.error('Error fetching users:', error);
        setError("Không thể tải danh sách user sử dụng voucher.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [voucher.id]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow">
      <div className="flex items-center mb-6">
        <button
          className="flex items-center gap-2 text-[#3E2723] hover:text-[#D4AF37] font-semibold px-2 py-1 transition bg-transparent"
          onClick={onBack}
          aria-label="Quay lại"
          type="button"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path
              d="M15 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Quay lại</span>
        </button>
        <div className="flex-1 text-center pr-8">
          <span className="text-xl font-bold text-[#3E2723]">Chi tiết mã giảm giá</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="mb-2"><span className="font-semibold">Mã:</span> {voucher.code}</div>
          <div className="mb-2"><span className="font-semibold">Tên:</span> {voucher.name}</div>
          <div className="mb-2"><span className="font-semibold">Trạng thái:</span> 
          <span
                  className={`px-2 py-1 rounded-full text-sm font-medium ${
                    voucher.status === 0
                      ? "bg-orange-100 text-orange-700"
                      : voucher.status === 1 || voucher.status === 2 || voucher.status === 3
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {statusMap[voucher.status] || voucher.status}
                </span>
          </div>
          <div className="mb-2"><span className="font-semibold">Mô tả:</span> {voucher.description || "Không có mô tả"}</div>
        </div>
        <div>
          <div className="mb-2"><span className="font-semibold">Ngày bắt đầu:</span> {formatDate ? formatDate(voucher.start_date) : voucher.start_date}</div>
          <div className="mb-2"><span className="font-semibold">Ngày kết thúc:</span> {formatDate ? formatDate(voucher.end_date) : voucher.end_date}</div>
          <div className="mb-2"><span className="font-semibold">Giá trị giảm:</span> {voucher.discount_value.toLocaleString("vi-VN")} {discountTypeMap[voucher.discount_type] || voucher.discount_type}</div>
          <div className="mb-2"><span className="font-semibold">Đơn tối thiểu:</span> {voucher.min_price.toLocaleString("vi-VN")} VND</div>
        </div>
      </div>

      {/* Danh sách user sử dụng voucher */}
      <div className="mt-10">
        <h2 className="text-lg font-bold mb-4 text-[#3E2723]">Danh sách user đã sử dụng voucher này</h2>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : error ? (
            <div className="text-red-500 py-4">{error}</div>
          ) : users.length === 0 ? (
            <div className="text-gray-500 py-4">Chưa có user sử dụng voucher này.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 rounded-xl">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">STT</th>
                  <th className="px-4 py-2">Tên</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Số điện thoại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user, idx) => (
                  <tr key={user.id}>
                    <td className="px-4 py-2 text-center">{idx + 1}</td>
                    <td className="px-4 py-2 text-center">{user.name}</td>
                    <td className="px-4 py-2 text-center">{user.email}</td>
                    <td className="px-4 py-2 text-center">{user.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoucherDetail;
