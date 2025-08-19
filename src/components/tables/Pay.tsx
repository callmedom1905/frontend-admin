"use client"
import React, { useEffect, useState, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { FaEllipsisV, FaMoneyBillWave, FaTrash } from "react-icons/fa";
import { SiVisa, SiMastercard } from "react-icons/si";
import { BsBank2 } from "react-icons/bs";
import apiClientBase from "../../lib/apiClient";
import Cookies from 'js-cookie';
import NotificationModal from "./NotificationModal";
import { createPortal } from "react-dom";

interface PaymentMethod {
  id: number;
  id_user: number;
  payment_method: string;
  payment_status: number;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  user?: {
    id: number;
    id_role: number;
    name: string;
    email: string;
    profile_image: string;
    phone: string;
    status: any;
    active: boolean;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
  };
}

const paymentMethodOptions = [
  { value: "Tiền mặt", label: "Tiền mặt", icon: <FaMoneyBillWave /> },
  { value: "Chuyển khoản", label: "Chuyển khoản", icon: <BsBank2 /> },
  { value: "Thẻ", label: "Thẻ", icon: <SiVisa /> },
  { value: "Mono", label: "Mono", icon: <SiMastercard /> },
  { value: "VNPay", label: "VNPay", icon: <BsBank2 /> },
];
const paymentStatusMapApi: Record<number, string> = {
  1: "Hoạt động",
  2: "Ngưng hoạt động",
};

export default function Pay() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formPayment, setFormPayment] = useState<Partial<PaymentMethod>>({
    payment_method: "Tiền mặt",
    payment_status: 1,
    id_user: undefined
  });
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedPayments, setDeletedPayments] = useState<PaymentMethod[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | "all">("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const [notification, setNotification] = useState<{
    open: boolean;
    title: string;
    description?: string;
    emoji?: React.ReactNode;
    acceptText?: string;
    rejectText?: string;
    onAccept?: () => void;
    onReject?: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    emoji: <span style={{ fontSize: 28 }}>🤔</span>,
    acceptText: "Đồng ý",
    rejectText: "Hủy",
  });

  // State for portal action menu
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  // Get user ID from encrypted cookie
  const getUserIdFromCookie = () => {
    const userCookie = Cookies.get('user');
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        return userData.id;
      } catch (error) {
        console.error('Error parsing user cookie:', error);
        return null;
      }
    }
    return null;
  };

  const PaymentMethodIcon = ({ method }: { method: string }) => {
    const iconMap: Record<string, string> = {
      "Tiền mặt": "/images/payment-methods/cash.png",
      "Chuyển khoản": "/images/payment-methods/bank-transfer.png",
      "Thẻ": "/images/payment-methods/credit-card.png",
      "Mono": "/images/icons/mono.png",
      "VNPay": "/images/icons/vnpay.png",
    };

    return iconMap[method] ? (
      <img
        src={iconMap[method]}
        alt={method}
        className="w-6 h-6 inline mr-2"
      />
    ) : null;
  };
  // Fetch danh sách phương thức thanh toán
  const fetchPaymentMethods = () => {
    setLoading(true);
    apiClientBase.get("/payment-method")
      .then(res => {
        const response = res as { data: any };
        const data = Array.isArray(response.data) ? response.data : [];
        setPaymentMethods(data);
      })
      .catch(() => alert("Không thể tải dữ liệu phương thức thanh toán!"))
      .finally(() => setLoading(false));
  };

  // Fetch danh sách phương thức thanh toán đã xóa
  const fetchDeletedPayments = () => {
    setLoading(true);
    apiClientBase.get("/payment-method/trashed")
      .then(res => {
        const response = res as { data: any };
        const data = Array.isArray(response.data) ? response.data : [];
        setDeletedPayments(data);
      })
      .catch(() => alert("Không thể tải dữ liệu phương thức thanh toán đã xóa!"))
      .finally(() => setLoading(false));
  };

  // Khôi phục phương thức thanh toán
  const handleRestore = async (id: number) => {
    setNotification({
      open: true,
      title: "Xác nhận khôi phục",
      description: "Bạn có chắc chắn muốn khôi phục phương thức thanh toán này?",
      emoji: <span style={{ fontSize: 28 }}>♻️</span>,
      acceptText: "Khôi phục",
      rejectText: "Hủy",
      onAccept: async () => {
        try {
          await apiClientBase.post(`/payment-method/${id}/restore`, {});
          setNotification({
            open: true,
            title: "Thành công",
            description: "Khôi phục phương thức thanh toán thành công!",
            emoji: <span style={{ fontSize: 28 }}>✅</span>,
            acceptText: "OK",
            onAccept: () => {
              setNotification(prev => ({ ...prev, open: false }));
              fetchDeletedPayments();
              fetchPaymentMethods();
            }
          });
        } catch (err: any) {
          console.error("Error:", err);
          setNotification({
            open: true,
            title: "Lỗi",
            description: err.response?.data?.message || "Không thể khôi phục phương thức thanh toán!",
            emoji: <span style={{ fontSize: 28 }}>❌</span>,
            acceptText: "OK",
            onAccept: () => setNotification(prev => ({ ...prev, open: false }))
          });
        }
      },
      onReject: () => setNotification(prev => ({ ...prev, open: false }))
    });
  };

  useEffect(() => {
    if (showDeleted) {
      fetchDeletedPayments();
    } else {
      fetchPaymentMethods();
    }
  }, [showDeleted]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
    }
    if (statusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [statusDropdownOpen]);

  // Thêm mới hoặc sửa phương thức thanh toán
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPayment.payment_method) {
      setNotification({
        open: true,
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin!",
        emoji: <span style={{ fontSize: 28 }}>❌</span>,
        acceptText: "OK",
        onAccept: () => setNotification(prev => ({ ...prev, open: false }))
      });
      return;
    }

    const userId = getUserIdFromCookie();
    if (!userId) {
      setNotification({
        open: true,
        title: "Lỗi",
        description: "Không tìm thấy thông tin người dùng!",
        emoji: <span style={{ fontSize: 28 }}>❌</span>,
        acceptText: "OK",
        onAccept: () => setNotification(prev => ({ ...prev, open: false }))
      });
      return;
    }

    try {
      const paymentData = {
        ...formPayment,
        id_user: userId
      };

      if (editId) {
        // Sửa
        await apiClientBase.put(`/payment-method/${editId}`, paymentData);
        setNotification({
          open: true,
          title: "Thành công",
          description: "Cập nhật phương thức thanh toán thành công!",
          emoji: <span style={{ fontSize: 28 }}>✅</span>,
          acceptText: "OK",
          onAccept: () => {
            setNotification(prev => ({ ...prev, open: false }));
            fetchPaymentMethods();
            setFormVisible(false);
            setFormPayment({
              payment_method: "Tiền mặt",
              payment_status: 1,
              id_user: undefined
            });
            setEditId(null);
          }
        });
      } else {
        // Thêm mới
        await apiClientBase.post("/payment-method", paymentData);
        setNotification({
          open: true,
          title: "Thành công",
          description: "Thêm phương thức thanh toán thành công!",
          emoji: <span style={{ fontSize: 28 }}>✅</span>,
          acceptText: "OK",
          onAccept: () => {
            setNotification(prev => ({ ...prev, open: false }));
            fetchPaymentMethods();
            setFormVisible(false);
            setFormPayment({
              payment_method: "Tiền mặt",
              payment_status: 1,
              id_user: undefined
            });
            setEditId(null);
          }
        });
      }
    } catch (err: any) {
      console.error("Error:", err);
      setNotification({
        open: true,
        title: "Lỗi",
        description: err.response?.data?.message || "Có lỗi xảy ra khi lưu phương thức thanh toán!",
        emoji: <span style={{ fontSize: 28 }}>❌</span>,
        acceptText: "OK",
        onAccept: () => setNotification(prev => ({ ...prev, open: false }))
      });
    }
  };

  // Xóa phương thức thanh toán (soft delete)
  const handleDelete = async (id: number) => {
    setNotification({
      open: true,
      title: "Xác nhận xóa",
      description: "Bạn có chắc chắn muốn xóa phương thức thanh toán này?",
      emoji: <span style={{ fontSize: 28 }}>⚠️</span>,
      acceptText: "Xóa",
      rejectText: "Hủy",
      onAccept: async () => {
        try {
          await apiClientBase.delete(`/payment-method/${id}`);
          setNotification({
            open: true,
            title: "Thành công",
            description: "Xóa phương thức thanh toán thành công!",
            emoji: <span style={{ fontSize: 28 }}>✅</span>,
            acceptText: "OK",
            onAccept: () => {
              setNotification(prev => ({ ...prev, open: false }));
              fetchPaymentMethods();
            }
          });
        } catch (err: any) {
          console.error("Error:", err);
          setNotification({
            open: true,
            title: "Lỗi",
            description: err.response?.data?.message || "Không thể xóa phương thức thanh toán!",
            emoji: <span style={{ fontSize: 28 }}>❌</span>,
            acceptText: "OK",
            onAccept: () => setNotification(prev => ({ ...prev, open: false }))
          });
        }
      },
      onReject: () => setNotification(prev => ({ ...prev, open: false }))
    });
  };

  // Hiển thị form sửa
  const handleEdit = (item: PaymentMethod) => {
    setFormPayment({
      payment_method: item.payment_method,
      payment_status: item.payment_status,
      id_user: item.id_user
    });
    setEditId(item.id);
    setFormVisible(true);
  };

  // Hiển thị form thêm
  // const handleShowAdd = () => {
  //   const userId = getUserIdFromCookie();
  //   setFormPayment({
  //     payment_method: "Tiền mặt",
  //     payment_status: 1,
  //     id_user: userId
  //   });
  //   setEditId(null);
  //   setFormVisible(true);
  // };

  // Thay đổi trạng thái hoạt động/ngưng hoạt động
  const handleToggleStatus = async (item: PaymentMethod) => {
    setNotification({
      open: true,
      title: "Xác nhận thay đổi trạng thái",
      description: "Bạn có chắc chắn muốn thay đổi trạng thái phương thức thanh toán này?",
      emoji: <span style={{ fontSize: 28 }}>⚠️</span>,
      acceptText: "Đồng ý",
      rejectText: "Hủy",
      onAccept: async () => {
        try {
          const userId = getUserIdFromCookie();
          if (!userId) {
            setNotification({
              open: true,
              title: "Lỗi",
              description: "Không tìm thấy thông tin người dùng!",
              emoji: <span style={{ fontSize: 28 }}>❌</span>,
              acceptText: "OK",
              onAccept: () => setNotification(prev => ({ ...prev, open: false }))
            });
            return;
          }
          const newStatus = item.payment_status === 1 ? 2 : 1;
          await apiClientBase.put(`/payment-method/${item.id}`, {
            payment_method: item.payment_method,
            payment_status: newStatus,
            id_user: userId
          });
          setNotification({
            open: true,
            title: "Thành công",
            description: "Cập nhật trạng thái thành công!",
            emoji: <span style={{ fontSize: 28 }}>✅</span>,
            acceptText: "OK",
            onAccept: () => {
              setNotification(prev => ({ ...prev, open: false }));
              fetchPaymentMethods();
            }
          });
        } catch (err: any) {
          console.error("Error:", err);
          setNotification({
            open: true,
            title: "Lỗi",
            description: err.response?.data?.message || "Không thể thay đổi trạng thái!",
            emoji: <span style={{ fontSize: 28 }}>❌</span>,
            acceptText: "OK",
            onAccept: () => setNotification(prev => ({ ...prev, open: false }))
          });
        }
      },
      onReject: () => setNotification(prev => ({ ...prev, open: false }))
    });
  };

  // Lọc dữ liệu theo tìm kiếm và trạng thái
  const filteredPayments = (payments: PaymentMethod[]) => {
    return payments.filter(payment => {
      const matchesSearch = payment.payment_method.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || payment.payment_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  // Handle open menu
  const handleOpenMenu = (id: number, event: React.MouseEvent) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      setMenuPosition(null);
      return;
    }
    const rect = (event.target as HTMLElement).closest("button")?.getBoundingClientRect();
    if (rect) {
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right - 160 + window.scrollX,
      });
    }
    setOpenMenuId(id);
  };

  // Close menu on outside click
  useEffect(() => {
    if (openMenuId === null) return;
    const handleClick = (e: MouseEvent) => {
      const menu = document.getElementById("action-menu-portal");
      if (menu && !menu.contains(e.target as Node)) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [openMenuId]);

  return (
    <div className="p-4">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h2 className="text-xl font-bold">Quản lý Phương Thức Thanh Toán</h2>
        {/* <button
          onClick={handleShowAdd}
          className="px-4 py-2 rounded-[8px] bg-[#3E2723] text-[#FAF3E0]  hover:bg-[#D4AF37]"
        >
          Thêm mới
        </button> */}
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Tìm theo tên phương thức..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 px-2 h-8 rounded-md text-sm focus:outline-none"
        />
        <div ref={statusDropdownRef} className="relative">
          <button
            type="button"
            className="border border-gray-300 px-2 h-8 rounded-md text-sm font-normal bg-white min-w-[120px] flex items-center justify-between"
            onClick={() => setStatusDropdownOpen((open) => !open)}
          >
            {statusFilter === "all" ? "Tất cả trạng thái" : statusFilter === 1 ? "Hoạt động" : "Ngưng hoạt động"}
            <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {statusDropdownOpen && (
            <ul className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow z-20 py-1 text-sm min-w-[140px]">
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${statusFilter === "all" ? "font-bold" : "font-normal"}`}
                  onClick={() => { setStatusFilter("all"); setStatusDropdownOpen(false); }}
                >Tất cả trạng thái</button>
              </li>
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${statusFilter === 1 ? "font-bold" : "font-normal"}`}
                  onClick={() => { setStatusFilter(1); setStatusDropdownOpen(false); }}
                >Hoạt động</button>
              </li>
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${statusFilter === 2 ? "font-bold" : "font-normal"}`}
                  onClick={() => { setStatusFilter(2); setStatusDropdownOpen(false); }}
                >Ngưng hoạt động</button>
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* Form thêm/sửa */}
      {formVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-99999">
          <div className="bg-white p-6 rounded-xl shadow max-w-lg w-full">
            <h3 className="font-bold mb-4">{editId ? "Sửa" : "Thêm"} phương thức thanh toán</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block mb-1">Phương thức</label>
                <select
                  className="border px-3 py-2 rounded w-full "
                  value={formPayment.payment_method}
                  onChange={e => setFormPayment(f => ({ ...f, payment_method: e.target.value }))}
                >
                  {!paymentMethodOptions.some(opt => opt.value === formPayment.payment_method) && formPayment.payment_method && (
                    <option value={formPayment.payment_method}>{formPayment.payment_method}</option>
                  )}
                  {paymentMethodOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1">Trạng thái</label>
                <ul className="flex gap-2">
                  <li>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded ${formPayment.payment_status === 1 ? 'bg-amber-700 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-amber-600 transition`}
                      onClick={() => setFormPayment(f => ({ ...f, payment_status: 1 }))}
                    >
                      Hoạt động
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded ${formPayment.payment_status === 2 ? 'bg-amber-700 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-amber-600 transition`}
                      onClick={() => setFormPayment(f => ({ ...f, payment_status: 2 }))}
                    >
                      Ngưng hoạt động
                    </button>
                  </li>
                </ul>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-amber-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-amber-700 transition"
                >
                  {editId ? "Lưu thay đổi" : "Thêm mới"}
                </button>
                <button
                  type="button"
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-gray-600 transition"
                  onClick={() => setFormVisible(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">ID</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Icon</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Phương Thức</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Trạng Thái</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">
                    {showDeleted ? "Ngày Xóa" : "Ngày Cập Nhật"}
                  </TableCell>
                  {/* <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-center">Actions</TableCell> */}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <TableRow>
                    <td className="text-center py-6" colSpan={6}>
                      Đang tải dữ liệu...
                    </td>
                  </TableRow>
                ) : showDeleted ? (
                  filteredPayments(deletedPayments).length === 0 ? (
                    <TableRow>
                      <td className="text-center py-6" colSpan={6}>
                        Không có phương thức thanh toán đã xóa.
                      </td>
                    </TableRow>
                  ) : (
                    filteredPayments(deletedPayments).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="px-4 py-3">{item.id}</TableCell>
                        <TableCell className="px-4 py-3  flex items-center gap-2">
                          <PaymentMethodIcon method={item.payment_method} />
                        </TableCell>
                        <TableCell className="px-4 py-3">{item.payment_method}</TableCell>
                        <TableCell className="px-4 py-3">
                          <span className={item.payment_status === 1 ? "text-green-600" : "text-red-600"}>
                            {paymentStatusMapApi[item.payment_status] || `#${item.payment_status}`}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {item.deleted_at ? new Date(item.deleted_at).toLocaleString() : "N/A"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRestore(item.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Khôi phục
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )
                ) : (
                  filteredPayments(paymentMethods).length === 0 ? (
                    <TableRow>
                      <td className="text-center py-6" colSpan={6}>
                        Không có dữ liệu phương thức thanh toán.
                      </td>
                    </TableRow>
                  ) : (
                    filteredPayments(paymentMethods).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="px-4 py-3">{item.id}</TableCell>
                        <TableCell className="px-4 py-3  flex items-center gap-2">
                          <PaymentMethodIcon method={item.payment_method} />
                        </TableCell>
                        <TableCell className="px-4 py-3">{item.payment_method}</TableCell>
                        <TableCell className="px-4 py-3">
                          <span className={item.payment_status === 1 ? "text-green-600" : "text-red-600"}>
                            {paymentStatusMapApi[item.payment_status] || `#${item.payment_status}`}
                          </span>
                          <button
                            className={`ml-2 px-2 py-1 rounded border text-xs`}
                            onClick={() => handleToggleStatus(item)}
                          >
                            {item.payment_status === 1 ? "Ngưng hoạt động" : "Kích hoạt"}
                          </button>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {item.updated_at ? new Date(item.updated_at).toLocaleString() : "N/A"}
                        </TableCell>
                        {/* <TableCell className="px-4 py-3 text-center">
                          <div className="relative flex justify-center">
                            <button
                              className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-100 transition"
                              onClick={e => handleOpenMenu(item.id, e)}
                              type="button"
                            >
                              <span className="sr-only">Mở menu</span>
                              <FaEllipsisV />
                            </button>
                          </div>
                        </TableCell> */}
                      </TableRow>
                    ))
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <NotificationModal
        open={notification.open}
        title={notification.title}
        description={notification.description}
        emoji={notification.emoji}
        acceptText={notification.acceptText}
        rejectText={notification.rejectText}
        onAccept={() => {
          notification.onAccept?.();
          setNotification(prev => ({ ...prev, open: false }));
        }}
        onReject={() => {
          notification.onReject?.();
          setNotification(prev => ({ ...prev, open: false }));
        }}
      />
      {/* {openMenuId !== null && menuPosition &&
        createPortal(
          (() => {
            const item = paymentMethods.find(p => p.id === openMenuId);
            if (!item) return null;
            return (
              <div
                id="action-menu-portal"
                className="z-[99999] w-40 bg-white border border-gray-200 rounded shadow-lg dark:bg-gray-800 dark:border-gray-700 origin-top-right"
                style={{
                  position: "fixed",
                  top: menuPosition.top,
                  left: menuPosition.left,
                }}
                onMouseLeave={() => {
                  setOpenMenuId(null);
                  setMenuPosition(null);
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    right: 20,
                    width: 0,
                    height: 0,
                    borderLeft: "10px solid transparent",
                    borderRight: "10px solid transparent",
                    borderBottom: "10px solid #fff",
                    zIndex: 1,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    right: 19,
                    width: 0,
                    height: 0,
                    borderLeft: "11px solid transparent",
                    borderRight: "11px solid transparent",
                    borderBottom: "11px solid #e5e7eb",
                    zIndex: 0,
                  }}
                />
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    handleEdit(item);
                    setOpenMenuId(null);
                    setMenuPosition(null);
                  }}
                >
                  Sửa
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
                  onClick={() => {
                    handleDelete(item.id);
                    setOpenMenuId(null);
                    setMenuPosition(null);
                  }}
                >
                  Xóa
                </button>
              </div>
            );
          })(),
          document.body
        )
      } */}
    </div>
  );
}
