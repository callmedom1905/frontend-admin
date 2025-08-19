"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import apiClient from "@/lib/apiClient";
import NotificationModal from "@/components/tables/NotificationModal";
import ToastMessage from "@/components/common/ToastMessage";
import { toast } from "react-toastify";
import { FiMoreVertical } from "react-icons/fi";
import ReactDOM from "react-dom";

interface Staff {
  id: number;
  name: string;
  avatar?: string;
  profile_image?: string;
  email?: string;
  phone: string;
  status: number; // 0: ngừng hoạt động (Đã nghỉ), 1: đang hoạt động (Đang làm)
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

const statusStyle: Record<number, string> = {
  1: "bg-green-100 text-green-700 border-green-300",
  0: "bg-red-100 text-red-600 border-red-300",
};

const ActionMenu: React.FC<{
  onEdit: (staff: Staff) => void;
  onDelete: (staff: Staff) => void;
  onView: (staff: Staff) => void;
  onClose: () => void;
}> = ({ onEdit, onDelete, onView, onClose }) => (
  <div
    className="absolute left-[70%] -translate-x-[70%] top-[110%] z-[99999] w-[160px] bg-white border border-gray-200 rounded-xl shadow-xl py-2 animate-fade-in
      before:content-[''] before:absolute before:-top-2 before:right-8 before:w-4 before:h-4 before:bg-white before:border-l before:border-t before:border-gray-200 before:rotate-45 before:z-[-1]"
    style={{ minWidth: 0 }}
  >
    <ul className="flex flex-col">
      <li>
        <button
          onClick={() => onView}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
        >
          Xem chi tiết
        </button>
      </li>
      <li>
        <button
          onClick={() => onEdit}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
        >
          Sửa thông tin
        </button>
      </li>
      <li>
        <button
          onClick={() => onDelete}
          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
        >
          Xóa nhân viên
        </button>
      </li>
    </ul>
  </div>
);

interface StaffListProps {
  onEditStaff?: (staff: Staff) => void;
  onViewStaff?: (staff: Staff) => void;
  onDelete?: (staff: Staff) => void;
}

const StaffList: React.FC<StaffListProps> = ({ onEditStaff, onViewStaff, onDelete }) => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [toastOpen, setToastOpen] = useState(false);

  // Bộ lọc dạng dropdown UI
  const [dropdown, setDropdown] = useState<{ type: null | "deleted" | "status"; open: boolean; anchor: any }>({
    type: null,
    open: false,
    anchor: null,
  });
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Bộ lọc
  const [deletedFilter, setDeletedFilter] = useState<"all" | "deleted">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Dữ liệu từ API
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewStaff, setViewStaff] = useState<Staff | null>(null);

  // Thêm state cho xác nhận ẩn và thông báo
  const [confirmHide, setConfirmHide] = useState<{ open: boolean; staff?: Staff }>({ open: false });
  const [hideLoading, setHideLoading] = useState(false);
  const [hideToast, setHideToast] = useState(false);

  // Thêm state cho xác nhận khôi phục và thông báo
  const [confirmRestore, setConfirmRestore] = useState<{ open: boolean; staff?: Staff }>({ open: false });
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreToast, setRestoreToast] = useState(false);

  // Thêm state cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);

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

  const [isPageLoading, setIsPageLoading] = useState(false);

  const debouncedPageChange = useRef(
    debounce((page: number) => {
      setCurrentPage(page);
    }, 400)
  ).current;

  // Fetch staff list từ API
  const fetchStaffs = React.useCallback(() => {
    let url = deletedFilter === "deleted"
      ? `/staff/trashed?page=${currentPage}&per_page=${perPage}`
      : `/staff?page=${currentPage}&per_page=${perPage}`;
    setLoading(true);
    setError(null);
    apiClient
      .get(url)
      .then((res) => {
        // Nếu trả về dạng Laravel paginator
        if (res.data && res.data.data && typeof res.data.current_page !== 'undefined') {
          setStaffs(res.data.data);
          setTotalPages(res.data.last_page || 1);
        } else {
          setStaffs(res.data.data || res.data);
          setTotalPages(1);
        }
      })
      .catch(() => {
        setError("Không thể tải danh sách nhân viên");
      })
      .finally(() => setLoading(false));
  }, [deletedFilter, currentPage, perPage]);

  useEffect(() => {
    setIsPageLoading(true);
    fetchStaffs();
    setIsPageLoading(false);
  }, [fetchStaffs]);

  // Đóng dropdown khi click ngoài
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdown.open &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(dropdown.anchor && dropdown.anchor.contains(event.target as Node))
      ) {
        setDropdown({ type: null, open: false, anchor: null });
      }
    }
    if (dropdown.open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdown]);

  const handleEdit = (staff: Staff) => {
    if (onEditStaff) {
      onEditStaff(staff);
    } else {
      alert(`Sửa: ${staff.name}`);
    }
  };

  const handleDelete = (staff: Staff) => {
    setDeleteConfirm({ id: staff.id, name: staff.name });
  };

  const handleView = (staff: Staff) => {
    setViewStaff(staff);
    onViewStaff?.(staff);
  };

  const handleRestore = (staff: Staff) => {
    setConfirmRestore({ open: true, staff });
  };

  // Áp dụng bộ lọc search và status phía client
  const filteredStaffs = staffs.filter((staff) => {
    const statusStr = staff.status === 1 ? "active" : "inactive";
    if (
      search &&
      !staff.name?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (statusFilter !== "all" && statusStr !== statusFilter) return false;
    return true;
  });

  // Thêm hàm format ngày giờ VN
  function formatDateVN(dateStr?: string) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("vi-VN", {
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  const handleOpenMenu = (staffId: number, event?: React.MouseEvent) => {
    if (openMenuId === staffId) {
      setOpenMenuId(null);
      setMenuPosition(null);
      return;
    }
    if (event) {
      const rect = (event.target as HTMLElement).closest("button")?.getBoundingClientRect();
      if (rect) {
        setMenuPosition({
          top: rect.bottom + window.scrollY,
          left: rect.right - 160 + window.scrollX,
        });
      }
    }
    setOpenMenuId(staffId);
  };

  // Đóng menu khi click ngoài
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

  const confirmDeleteStaff = async () => {
    if (!deleteConfirm) return;
    try {
      await apiClient.delete(`/staff/${deleteConfirm.id}`);
      setStaffs((prev) => prev.filter((s) => s.id !== deleteConfirm.id));
      if (onDelete) {
        const staff = staffs.find(s => s.id === deleteConfirm.id);
        if (staff) {
          onDelete(staff);
        }
      }
      setToastOpen(true);
    } catch (error) {
      alert("Xóa nhân viên thất bại!");
      console.error(error);
    }
    setDeleteConfirm(null);
  };

  const handlePageChange = (page: number) => {
    if (isPageLoading) return;
    setIsPageLoading(true);
    debouncedPageChange(page);
  };

  return (
    <div className="p-2">
      <div className="flex gap-4 mb-4 text-[14px] relative z-10">
        {/* Input tìm kiếm */}
        <input
          type="text"
          className="border px-2 py-1 rounded bg-white dark:bg-[#23272f] text-gray-900 dark:text-gray-100"
          placeholder="Tìm kiếm tên..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {/* Dropdown trạng thái */}
        <div className="relative">
          <button
            className="border px-2 py-1 rounded bg-white dark:bg-[#23272f] min-w-[140px] text-left truncate text-gray-900 dark:text-gray-100"
            onClick={e =>
              setDropdown({
                type: "status",
                open: dropdown.type !== "status" || !dropdown.open,
                anchor: e.currentTarget,
              })
            }
            type="button"
          >
            <span className="block truncate">
              {statusFilter === "all"
                ? "Tất cả trạng thái"
                : statusFilter === "active"
                ? "Đang hoạt động"
                : "Ngừng hoạt động"}
            </span>
          </button>
          {dropdown.open && dropdown.type === "status" && (
            <div
              ref={dropdownRef}
              className="absolute left-0 mt-1 w-full bg-white dark:bg-[#23272f] border border-gray-200 dark:border-[#444] rounded shadow-lg"
            >
              <ul>
                <li
                  className={`px-4 py-2 cursor-pointer hover:bg-[#F8F5F0] dark:hover:bg-[#333] ${statusFilter === "all" ? "text-[#3E2723] dark:text-[#FFD700] font-semibold" : "dark:text-gray-100"} truncate`}
                  style={{ whiteSpace: "nowrap" }}
                  onClick={() => {
                    setStatusFilter("all");
                    setDropdown({ type: null, open: false, anchor: null });
                  }}
                >
                  Tất cả trạng thái
                </li>
                <li
                  className={`px-4 py-2 cursor-pointer hover:bg-[#F8F5F0] dark:hover:bg-[#333] ${statusFilter === "active" ? "text-[#3E2723] dark:text-[#FFD700] font-semibold" : "dark:text-gray-100"} truncate`}
                  style={{ whiteSpace: "nowrap" }}
                  onClick={() => {
                    setStatusFilter("active");
                    setDropdown({ type: null, open: false, anchor: null });
                  }}
                >
                  Đang hoạt động
                </li>
                <li
                  className={`px-4 py-2 cursor-pointer hover:bg-[#F8F5F0] dark:hover:bg-[#333] ${statusFilter === "inactive" ? "text-[#3E2723] dark:text-[#FFD700] font-semibold" : "dark:text-gray-100"} truncate`}
                  style={{ whiteSpace: "nowrap" }}
                  onClick={() => {
                    setStatusFilter("inactive");
                    setDropdown({ type: null, open: false, anchor: null });
                  }}
                >
                  Ngừng hoạt động
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="overflow-Block rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1102px]">
            {loading ? (
              <div className="text-center py-10 text-gray-400">Đang tải dữ liệu...</div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">{error}</div>
            ) : (
              <Table className="min-w-full">
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="text-[14px] px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Hình ảnh
                    </TableCell>
                    <TableCell isHeader className="text-[14px] px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Tên nhân viên
                    </TableCell>
                    <TableCell isHeader className="text-[14px] px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Số điện thoại
                    </TableCell>
                    <TableCell isHeader className="text-[14px] px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Trạng thái
                    </TableCell>
                    <TableCell isHeader className="text-[14px] px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Ngày tạo
                    </TableCell>
                    <TableCell isHeader className="text-[14px] px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaffs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400 bg-white">
                        Không có dữ liệu phù hợp
                      </td>
                    </tr>
                  )}
                  {filteredStaffs.map((staff) => (
                    <TableRow
                      key={staff.id}
                      className="group hover:bg-gray-50 transition rounded-xl"
                    >
                      <TableCell className="px-5 py-3 bg-white group-hover:bg-gray-50">
                        <img
                          src={staff.avatar || staff.profile_image}
                          alt={staff.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                        />
                      </TableCell>
                      <TableCell className="px-5 py-3 font-semibold text-gray-900 bg-white group-hover:bg-gray-50">
                        {staff.name}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-700 bg-white group-hover:bg-gray-50">
                        {staff.phone}
                      </TableCell>
                      <TableCell className="px-5 py-3 bg-white group-hover:bg-gray-50">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle[staff.status]}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              staff.status === 1 ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></span>
                          {staff.status === 1 ? "Đang làm" : "Đã nghỉ"}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-700 bg-white group-hover:bg-gray-50">
                        {formatDateVN(staff.created_at)}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-center relative bg-white group-hover:bg-gray-50">
                        {deletedFilter === "deleted" ? (
                          <button
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3E2723] hover:bg-[#D4AF37] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            onClick={() => handleRestore(staff)}
                          >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                              <path d="M3 12s4-7 11-7 11 7 11 7-4 7-11 7S3 12 3 12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Khôi phục
                          </button>
                        ) : (
                          <div className="inline-block relative">
                            <button
                              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={e => handleOpenMenu(staff.id, e)}
                              type="button"
                              aria-label="Actions"
                            >
                              <FiMoreVertical size={20} />
                            </button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
       
      </div>
       {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-4">
          {totalPages > 0 ? (
            <>
              <button
                className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className={`px-3 py-1 rounded border ${
                      currentPage === pageNumber
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
                className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
      {viewStaff && (
        <NotificationModal
          open={confirmHide.open}
          title="Bạn có chắc chắn muốn ẨN nhân viên này?"
          description="Nhân viên sẽ bị ẩn khỏi danh sách hoạt động."
          acceptText={hideLoading ? "Đang ẩn..." : "Ẩn"}
          rejectText="Hủy"
          onAccept={async () => {
            if (!confirmHide.staff) return;
            setHideLoading(true);
            try {
              await apiClient.delete(`/staff/${confirmHide.staff.id}`);
              setHideToast(true);
              setConfirmHide({ open: false });
              // Xóa khỏi danh sách hiển thị
              setStaffs(prev => prev.filter(s => s.id !== confirmHide.staff?.id));
            } catch (err: any) {
              alert("Ẩn nhân viên thất bại");
            } finally {
              setHideLoading(false);
            }
          }}
          onReject={() => setConfirmHide({ open: false })}
          onClose={() => setConfirmHide({ open: false })}
        />
      )}
      {/* Toast thông báo ẩn thành công */}
      <ToastMessage
        open={hideToast}
        message="Ẩn nhân viên thành công!"
        onClose={() => setHideToast(false)}
      />

      {/* Modal xác nhận khôi phục nhân viên */}
      <NotificationModal
        open={confirmRestore.open}
        title="Bạn có chắc chắn muốn khôi phục nhân viên này?"
        description="Nhân viên sẽ được khôi phục và hiển thị lại trong danh sách hoạt động."
        acceptText={restoreLoading ? "Đang khôi phục..." : "Khôi phục"}
        rejectText="Hủy"
        onAccept={async () => {
          if (!confirmRestore.staff) return;
          setRestoreLoading(true);
          try {
            await apiClient.put(`/staff/${confirmRestore.staff.id}/restore`, { status: 1 });
            setRestoreToast(true);
            setConfirmRestore({ open: false });
            // Xóa khỏi danh sách hiển thị
            setStaffs(prev => prev.filter(s => s.id !== confirmRestore.staff?.id));
          } catch (err: any) {
            alert("Khôi phục nhân viên thất bại");
          } finally {
            setRestoreLoading(false);
          }
        }}
        onReject={() => setConfirmRestore({ open: false })}
        onClose={() => setConfirmRestore({ open: false })}
      />

      {/* Toast thông báo khôi phục thành công */}
      <ToastMessage
        open={restoreToast}
        message="Khôi phục nhân viên thành công!"
        onClose={() => setRestoreToast(false)}
      />

      {/* Portal action menu */}
      {openMenuId !== null && menuPosition &&
        ReactDOM.createPortal(
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
                const staff = staffs.find(s => s.id === openMenuId);
                if (staff && onViewStaff) onViewStaff(staff);
                setOpenMenuId(null);
                setMenuPosition(null);
              }}
            >
              Xem chi tiết
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                const staff = staffs.find(s => s.id === openMenuId);
                if (staff && onEditStaff) onEditStaff(staff);
                setOpenMenuId(null);
                setMenuPosition(null);
              }}
            >
              Sửa thông tin
            </button>
          </div>,
          document.body
        )
      }

      {/* NotificationModal xác nhận xóa */}
      <NotificationModal
        open={!!deleteConfirm}
        title="Xác nhận xóa nhân viên"
        description={
          deleteConfirm
            ? `Bạn có chắc chắn muốn xóa nhân viên "${deleteConfirm.name}"?`
            : ""
        }
        emoji={<span style={{ fontSize: 32 }}>🗑️</span>}
        acceptText="Xóa"
        rejectText="Hủy"
        onAccept={confirmDeleteStaff}
        onReject={() => setDeleteConfirm(null)}
        onClose={() => setDeleteConfirm(null)}
      />

      {/* ToastMessage xóa */}
      <ToastMessage
        open={toastOpen}
        message="Xóa nhân viên thành công!"
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
};

export default StaffList;
