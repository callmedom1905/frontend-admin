"use client"
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Modal } from "../ui/modal";
import Badge from "../ui/badge/Badge";
import { toast } from "react-toastify";
import apiClientBase from "@/lib/apiClient";
import { FiUser, FiMail, FiPhone, FiCalendar, FiShield } from "react-icons/fi";
import UserFilter from "./users/UserFilter";
import NotificationModal from "./NotificationModal";

interface IUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  id_role: number;
  profile_image?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  role?: {
    id: number;
    name: string;
    guard_name: string;
  };
  status: number | string;
}

interface BasicTableOneProps {
  onEditUser?: (user: IUser) => void;
  onViewUser?: (user: IUser) => void;
}

// UserFormModal Component
function UserFormModal({ isOpen, onClose, userId, initialData, onSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
  initialData?: IUser;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    id_role: 3,
  });
  const [modalState, setModalState] = useState<{
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
    acceptText: "OK",
    rejectText: "Đóng",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        password: "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        id_role: 3,
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (userId) {
        await apiClientBase.patch(`/users/${userId}`, formData);
        // toast.success("Cập nhật người dùng thành công");
        setModalState({
          open: true,
          title: "Cập nhật thành công!",
          description: "Người dùng đã được cập nhật thành công.",
          emoji: <span style={{ fontSize: 28 }}>✅</span>,
          acceptText: "OK",
          onAccept: () => {
            setModalState(prev => ({ ...prev, open: false }));
            onSuccess();
            onClose();
          },
        });
      } else {
        await apiClientBase.post("/users", formData);
        // toast.success("Thêm người dùng thành công");
        setModalState({
          open: true,
          title: "Thêm thành công!",
          description: "Người dùng mới đã được thêm thành công.",
          emoji: <span style={{ fontSize: 28 }}>🎉</span>,
          acceptText: "OK",
          onAccept: () => {
            setModalState(prev => ({ ...prev, open: false }));
            onSuccess();
            onClose();
          },
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra";
      // toast.error(errorMessage);
      setModalState({
        open: true,
        title: "Lỗi!",
        description: errorMessage,
        emoji: <span style={{ fontSize: 28 }}>❌</span>,
        acceptText: "OK",
        onAccept: () => setModalState(prev => ({ ...prev, open: false })),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="p-4 max-w-md w-full bg-white rounded-xl shadow-lg mx-auto">
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {userId ? "Sửa người dùng" : "Thêm người dùng mới"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full focus:outline-none"
              aria-label="Đóng"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nhập tên người dùng"
                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập email"
                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Nhập số điện thoại"
                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu {!userId && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={userId ? "Để trống nếu không đổi" : "Nhập mật khẩu"}
                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                required={!userId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò <span className="text-red-500">*</span>
              </label>
              <select
                name="id_role"
                value={formData.id_role}
                onChange={handleChange}
                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value={1}>Admin</option>
                <option value={2}>Staff</option>
                <option value={3}>User</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-primary text-white rounded hover:bg-opacity-90 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Đang xử lý...</span>
                ) : userId ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
      <NotificationModal
        open={modalState.open}
        title={modalState.title}
        description={modalState.description}
        emoji={modalState.emoji}
        acceptText={modalState.acceptText}
        rejectText={modalState.rejectText}
        onAccept={modalState.onAccept ?? (() => setModalState(prev => ({ ...prev, open: false })))}
        onReject={modalState.onReject}
        onClose={() => setModalState(prev => ({ ...prev, open: false }))}
      />
    </>
  );
}

// Add UserDetailModal component after UserFormModal
function UserDetailModal({ isOpen, onClose, user }: {
  isOpen: boolean;
  onClose: () => void;
  user: IUser | null;
}) {
  if (!user) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        onClick={handleBackdropClick}
      >
        <div className="p-6 max-w-2xl w-full bg-white rounded-xl shadow-lg mx-auto relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full focus:outline-none"
            aria-label="Đóng"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Chi tiết người dùng
            </h3>
          </div>

          <div className="space-y-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                {user.profile_image ? (
                  <img
                    width={96}
                    height={96}
                    src={
                      user.profile_image.startsWith("http") || user.profile_image.startsWith("/")
                        ? user.profile_image
                        : `/images/user/${user.profile_image}`
                    }
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-1">{user.name}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiShield className="w-4 h-4" />
                  <span>
                    {user.id_role === 1 ? "Admin" : user.id_role === 2 ? "Staff" : "User"}
                  </span>
                </div>
                <div className="mt-2">
                  <Badge
                    color={user.status === "1" ? "success" : "error"}
                  >
                    {user.status === "1" ? "Đang hoạt động" : "Ngừng hoạt động"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FiMail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FiPhone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="text-gray-900">{user.phone}</p>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h5 className="font-semibold text-gray-900">Thông tin tài khoản</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiCalendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Ngày tạo</p>
                    <p className="text-gray-900">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiCalendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                    <p className="text-gray-900">
                      {user.updated_at ? new Date(user.updated_at).toLocaleDateString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Debounce function tự viết
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export default function BasicTableOne({ onEditUser, onViewUser }: BasicTableOneProps) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<IUser | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [modalState, setModalState] = useState<{
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
    acceptText: "OK",
    rejectText: "Đóng",
  });

  const debouncedPageChange = React.useRef(
    debounce((page: number) => {
      setCurrentPage(page);
    }, 400)
  ).current;

  useEffect(() => {
    setIsPageLoading(true);
    fetchUsers();
    setIsPageLoading(false);
  }, [currentPage, perPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClientBase.get(`/users?page=${currentPage}&per_page=${perPage}`);
      setUsers(res.data.data || []);
      setTotalPages(res.data.last_page || 1);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách người dùng");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (isPageLoading) return;
    setIsPageLoading(true);
    debouncedPageChange(page);
  };

  const filteredUsers = users.filter(u => {
    const searchValue = filters.search?.trim().toLowerCase() || "";
    const matchesSearch =
      !searchValue ||
      u.name.toLowerCase().includes(searchValue) ||
      u.email.toLowerCase().includes(searchValue);
    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "active" && u.status === 1) ||
      (filters.status === "inactive" && u.status === 0);
    return matchesSearch && matchesStatus;
  });

  const handleOpenEdit = async (userId: number | string) => {
    setEditLoading(true);
    setEditUser(null);
    try {
      const res = await apiClientBase.get(`/users/${userId}`);
      setEditUser(res.data);
      setIsEditModalOpen(true);
    } catch (error) {
      toast.error("Lỗi khi tải thông tin người dùng");
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddSuccess = () => {
    fetchUsers();
  };

  const handleEditSuccess = () => {
    fetchUsers();
    setEditUser(null);
  };

  // Ẩn (soft delete) user
  const handleHide = async (id: number | string) => {
    if (!window.confirm("Bạn có chắc muốn ẩn người dùng này?")) return;
    try {
      await apiClientBase.delete(`/users/${id}`);
      setUsers(users => users.filter(u => u.id !== id));
      // toast.success("Ẩn người dùng thành công");
      setModalState({
        open: true,
        title: "Ẩn thành công!",
        description: "Người dùng đã được ẩn thành công.",
        emoji: <span style={{ fontSize: 28 }}>✅</span>,
        acceptText: "OK",
        onAccept: () => setModalState(prev => ({ ...prev, open: false })),
      });
    } catch (error) {
      // toast.error("Ẩn người dùng thất bại");
      setModalState({
        open: true,
        title: "Ẩn thất bại!",
        description: "Ẩn người dùng thất bại.",
        emoji: <span style={{ fontSize: 28 }}>❌</span>,
        acceptText: "OK",
        onAccept: () => setModalState(prev => ({ ...prev, open: false })),
      });
      console.error(error);
    }
  };

  // Thay đổi trạng thái hoạt động/ngừng hoạt động
  const handleToggleActive = async (user: IUser) => {
    try {
      const updatedUser = { ...user, active: !user.active };
      await apiClientBase.patch(`/users/${user.id}`, { active: updatedUser.active });

      setUsers(users =>
        users.map(u => u.id === user.id ? { ...u, active: updatedUser.active } : u)
      );

      // toast.success(
      //   updatedUser.active
      //     ? "Đã chuyển sang Đang hoạt động"
      //     : "Đã chuyển sang Ngừng hoạt động"
      // );
      setModalState({
        open: true,
        title: "Cập nhật trạng thái thành công!",
        description: updatedUser.active
          ? "Đã chuyển sang Đang hoạt động"
          : "Đã chuyển sang Ngừng hoạt động",
        emoji: <span style={{ fontSize: 28 }}>✅</span>,
        acceptText: "OK",
        onAccept: () => setModalState(prev => ({ ...prev, open: false })),
      });
    } catch (error) {
      // toast.error("Thay đổi trạng thái thất bại");
      setModalState({
        open: true,
        title: "Cập nhật trạng thái thất bại!",
        description: "Thay đổi trạng thái thất bại.",
        emoji: <span style={{ fontSize: 28 }}>❌</span>,
        acceptText: "OK",
        onAccept: () => setModalState(prev => ({ ...prev, open: false })),
      });
      console.error(error);
    }
  };

  const handleToggleStatus = async (user: IUser) => {
    try {
      const newStatus = user.status === "1" ? 0 : 1;
      await apiClientBase.put(`/users/${user.id}`, { status: newStatus });
      setIsPageLoading(true);
      // toast.success("Đã đổi trạng thái thành công");
      setModalState({
        open: true,
        title: "Đổi trạng thái thành công!",
        description: `Trạng thái người dùng đã được đổi thành ${newStatus === 1 ? "Đang hoạt động" : "Ngừng hoạt động"}.`,
        emoji: <span style={{ fontSize: 28 }}>✅</span>,
        acceptText: "OK",
        onAccept: () => setModalState(prev => ({ ...prev, open: false })),
      });
      setUsers(users =>
        users.map(u => u.id === user.id ? { ...u, status: newStatus } : u)
      );
    } catch (error) {
      // toast.error("Đổi trạng thái thất bại");
      setModalState({
        open: true,
        title: "Đổi trạng thái thất bại!",
        description: "Đổi trạng thái thất bại.",
        emoji: <span style={{ fontSize: 28 }}>❌</span>,
        acceptText: "OK",
        onAccept: () => setModalState(prev => ({ ...prev, open: false })),
      });
    }
  };

  // Add this function to handle viewing user details
  const handleViewUser = (user: IUser) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="p-2">
      <UserFilter onFilterChange={setFilters} />
      <div className="overflow-Block rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="w-full">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start hidden [@media(min-width:400px)]:table-cell">Ảnh</TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Tên</TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start hidden sm:table-cell">Email</TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start hidden md:table-cell">Số điện thoại</TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Trạng thái</TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Hành động</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <td className="text-center py-6" colSpan={6}>
                    Đang tải dữ liệu...
                  </td>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <td className="text-center py-6" colSpan={6}>
                    Không có người dùng nào.
                  </td>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className={user.deleted_at ? "bg-gray-50" : ""}>
                    <TableCell className="px-4 py-3 hidden [@media(min-width:400px)]:table-cell">
                      <div className="w-12 h-12 rounded-full overflow-Block bg-gray-100 flex items-center justify-center">
                        {user.profile_image ? (
                          <img
                            width={48}
                            height={48}
                            src={
                              user.profile_image.startsWith("http") || user.profile_image.startsWith("/")
                                ? user.profile_image
                                : `/images/user/${user.profile_image}`
                            }
                            alt={user.name}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">No Image</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <button
                        onClick={() => onViewUser?.(user)}
                        className="hover:text-blue-600 text-left"
                      >
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {user.name}
                        </span>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          User
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="px-4 py-3 dark:text-white/90 hidden sm:table-cell">{user.email ? user.email : '-'}</TableCell>
                    <TableCell className="px-4 py-3 dark:text-white/90 hidden md:table-cell">{user.phone}</TableCell>
                    <TableCell className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors duration-150 ${user.status === "1" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-400 hover:bg-gray-500 text-white"}`}
                      >
                        {user.status === "1" ? "Đang hoạt động" : "Ngừng hoạt động"}
                      </button>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onViewUser?.(user)}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-100 transition"
                          title="Xem chi tiết"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-4">
        {totalPages > 0 ? (
          <>
            <button
              className={`px-3 py-1 rounded border bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || isPageLoading}
            >
              Trước
            </button>
            {[...Array(totalPages)].map((_, idx) => {
              const pageNumber = idx + 1;
              const isNearCurrentPage =
                Math.abs(pageNumber - currentPage) <= 1 ||
                pageNumber === 1 ||
                pageNumber === totalPages;

              if (!isNearCurrentPage) {
                if (pageNumber === 2 || pageNumber === totalPages - 1) {
                  return <span key={idx} className="px-2">...</span>;
                }
                return null;
              }

              return (
                <button
                  key={idx}
                  className={`px-3 py-1 rounded border ${currentPage === pageNumber
                      ? "bg-[#3E2723] text-[#FAF3E0]"
                      : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={isPageLoading}
                >
                  {pageNumber}
                </button>
              );
            })}
            <button
              className={`px-3 py-1 rounded border bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || isPageLoading}
            >
              Tiếp Theo
            </button>
          </>
        ) : (
          <div className="text-center py-4 text-gray-500">
            Không có dữ liệu để hiển thị
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <UserFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit User Modal */}
      {editUser && (
        <UserFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditUser(null);
          }}
          userId={editUser.id}
          initialData={editUser}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Add UserDetailModal */}
      <UserDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <NotificationModal
        open={modalState.open}
        title={modalState.title}
        description={modalState.description}
        emoji={modalState.emoji}
        acceptText={modalState.acceptText}
        rejectText={modalState.rejectText}
        onAccept={() => setModalState(prev => ({ ...prev, open: false }))}
        onReject={() => setModalState(prev => ({ ...prev, open: false }))}
        onClose={() => setModalState(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}