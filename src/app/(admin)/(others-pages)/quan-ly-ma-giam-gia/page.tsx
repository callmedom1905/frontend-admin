"use client";

import React, { useState, useEffect } from "react";
import VoucherTable, { Voucher } from "@/components/tables/VoucherTable";
import VoucherDetail from "@/components/tables/vouchers/VoucherDetail";
import VoucherForm from "@/components/tables/vouchers/VoucherForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ToastMessage from "@/components/common/ToastMessage";
import apiClientBase from "@/lib/apiClient";

// import { format, isValid } from "date-fns";

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "1", label: "Đang hoạt động" },
  { value: "0", label: "Chưa kích hoạt" },
  { value: "2", label: "Hết hạn" },
];

const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
];

const QuanLyMaGiamGiaPage = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editVoucher, setEditVoucher] = useState<Voucher | null>(null);
  const [viewVoucher, setViewVoucher] = useState<Voucher | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Hàm định dạng ngày thành dd/MM/yyyy
  //   const formatDate = (dateString: string): string => {
  //     const date = new Date(dateString);
  //     return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid Date";
  //   };
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const fetchVouchers = async () => {
    try {
      const response = await apiClientBase.get("/vouchers");
      const fetchedVouchers = (response.data.data || response.data).map(
        (voucher: Voucher) => ({
          ...voucher,
          // Trả về kiểu dữ liệu gốc, không formatDate để giữ đúng kiểu cho edit
          start_date: voucher.start_date,
          end_date: voucher.end_date,
          created_at: voucher.created_at,
        })
      );
      setVouchers(fetchedVouchers);
      console.log("Vouchers fetched:", fetchedVouchers);
    } catch (error) {
      console.error("Failed to fetch vouchers:", error);
      setError("Không thể tải danh sách voucher. Vui lòng thử lại.");
    }
  };

  // Fetch vouchers từ API
  useEffect(() => {
    fetchVouchers();
  }, []);

  // Lọc và sắp xếp vouchers
  const filtered = vouchers
    .filter(
      (v) =>
        (v.name.toLowerCase().includes(search.toLowerCase()) ||
          v.code.toLowerCase().includes(search.toLowerCase())) &&
        (status === "" || String(v.status) === status)
    )
    .sort((a, b) =>
      sort === "newest"
        ? new Date(a.created_at).getTime() < new Date(b.created_at).getTime() ? 1 : -1
        : new Date(a.created_at).getTime() > new Date(b.created_at).getTime() ? 1 : -1
    );

  const handleBackToList = () => {
    setShowForm(false);
    setEditVoucher(null);
  };

  const handleCreateVoucher = () => {
    setEditVoucher(null);
    setShowForm(true);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Quản voucher" />
      <div
        className="w-full bg-white rounded-2xl border border-gray-200 px-0 py-0 relative"
        style={{
          maxWidth: "1488px",
          marginLeft: "auto",
          marginRight: "auto",
          marginTop: "1rem",
          minHeight: "844px",
        }}
      >
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <h1 className="text-2xl font-bold text-[#3E2723]">Quản Lý Mã Giảm Giá</h1>
          {!showForm && !viewVoucher && (
            <button 
              className="bg-[#3E2723] hover:bg-[#D4AF37] text-white font-semibold py-2 px-6 rounded-xl shadow transition"
              onClick={handleCreateVoucher}
            >
              + Tạo mã giảm giá
            </button>
          )}
        </div>
        <div className="px-8 pb-8">
          {showForm ? (
            <div className="w-full bg-white rounded-2xl border border-gray-200 p-0">
              <div className="flex items-center px-6 py-4 relative">
                <button
                  className="flex items-center gap-2 text-[#3E2723] hover:text-[#D4AF37] font-semibold px-2 py-1 transition bg-transparent"
                  onClick={handleBackToList}
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
                </button>
                <div className="flex-1 text-center pr-8">
                  <span className="text-xl font-bold text-[#3E2723]">
                    {editVoucher ? "Cập Nhật Mã Giảm Giá" : "Tạo Mã Giảm Giá Mới"}
                  </span>
                </div>
              </div>
              <div className="px-8 py-8">
                <VoucherForm
                  voucher={editVoucher ? {
                    ...editVoucher,
                    start_date: editVoucher.start_date ? new Date(editVoucher.start_date) : null,
                    end_date: editVoucher.end_date ? new Date(editVoucher.end_date) : null,
                    description: editVoucher.description || '',
                  } : undefined}
                  onSubmit={async () => {
                    await fetchVouchers(); // Reload lại danh sách
                    setShowForm(false);
                    setEditVoucher(null);
                    setToastMessage(editVoucher ? "Cập nhật voucher thành công!" : "Tạo voucher thành công!");
                    setShowToast(true);
                  }}
                  onCancel={handleBackToList}
                />
              </div>
            </div>
          ) : viewVoucher ? (
            <div className="w-full bg-white rounded-2xl border border-gray-200 p-0">
              <div className="px-8 py-8">
                <VoucherDetail
                  voucher={viewVoucher}
                  onBack={() => setViewVoucher(null)}
                  formatDate={formatDate}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && <p className="text-red-500 mb-4">{error}</p>}
              {/* Filter/Search */}
              <div className="flex gap-2 mb-4">
                <input
                  className="border rounded px-3 py-2 w-64 outline-none focus:ring-2 focus:ring-[#422006]"
                  placeholder="Tìm theo mã hoặc tên voucher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="border rounded px-3 py-2"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  className="border rounded px-3 py-2"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Table + Empty State */}
              <div className="bg-white rounded-xl shadow p-0">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="mb-4">
                      <svg
                        width="64"
                        height="64"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10" fill="#F3F4F6" />
                        <path
                          d="M9.5 10.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Zm2.5 5c-2.485 0-4.5-2.015-4.5-4.5S9.515 6.5 12 6.5s4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5Z"
                          fill="#A3A3A3"
                        />
                      </svg>
                    </div>
                    <div className="font-semibold text-lg text-gray-500 mb-1">
                      Không tìm thấy mã giảm giá nào
                    </div>
                    <div className="text-gray-400">
                      Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                    </div>
                  </div>
                ) : (
                  <VoucherTable 
                    vouchers={filtered}
                    onEdit={voucher => {
                      setEditVoucher(voucher);
                      setShowForm(true);
                    }}
                    onView={voucher => {
                      setViewVoucher(voucher);
                    }}
                  />
                )}
              </div>
              {/* Pagination (demo) */}
              <div className="flex justify-center items-center gap-2 mt-6">
                <button className="px-4 py-1 rounded border bg-gray-100 text-gray-400 cursor-not-allowed">
                  Trước
                </button>
                <span className="px-3 py-1 rounded bg-[#422006] text-white font-semibold">
                  1
                </span>
                <button className="px-4 py-1 rounded border bg-gray-100 text-gray-400 cursor-not-allowed">
                  Tiếp Theo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <ToastMessage
        open={showToast}
        message={toastMessage}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default QuanLyMaGiamGiaPage;