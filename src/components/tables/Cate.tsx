"use client"
import React, { useEffect, useState, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Modal } from "../ui/modal";
import apiClientBase from "@/lib/apiClient";
import NotificationModal from "./NotificationModal";
import ReactDOM from "react-dom";

interface Category {
  id: number | string;
  name: string;
  slug?: string;
  status: number;
  deleted_at?: string | null;
}

export default function Cate() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [deletedCategories, setDeletedCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTrash, setShowTrash] = useState(false);

  // State cho form thêm/sửa
  const [formCate, setFormCate] = useState<Partial<Category>>({
    name: "",
    slug: "",
    status: 1,
  });
  const [editId, setEditId] = useState<number | string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  // Bộ lọc
  const [statusFilter, setStatusFilter] = useState<'' | 1 | 0>(''); // '' là tất cả, 1 là hoạt động, 0 là ẩn
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // State for portal action menu
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  // Lấy danh sách danh mục
  useEffect(() => {
    fetchCategories();
    fetchDeletedCategories();
  }, []);

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

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiClientBase.get("/categories/all");
      const cats = Array.isArray(res.data) ? res.data : [];
      // Xét trạng thái: nếu boolean thì true là hoạt động, nếu number thì 1 là hoạt động
      setCategories(
        cats.map((item: Category) => {
          let statusValue = 0;
          if (typeof item.status === "boolean") {
            statusValue = item.status ? 1 : 0;
          } else if (typeof item.status === "number") {
            statusValue = item.status;
          }
          return { ...item, status: statusValue };
        })
      );
    } catch {
      setNotification({
        open: true,
        title: "Lỗi",
        description: "Không thể tải danh mục. Vui lòng thử lại sau.",
        emoji: <span style={{ fontSize: 28 }}>❌</span>,
        acceptText: "Đóng",
        onAccept: () => setNotification(prev => ({ ...prev, open: false }))
      });
    }
    setLoading(false);
  };

  const fetchDeletedCategories = async () => {
    try {
      const res = await apiClientBase.get("/categories/trashed");
      const deletedCats = Array.isArray(res.data) ? res.data : [];
      // Xét trạng thái: nếu boolean thì true là hoạt động, nếu number thì 1 là hoạt động
      setDeletedCategories(
        deletedCats.map((item: Category) => {
          let statusValue = 0;
          if (typeof item.status === "boolean") {
            statusValue = item.status ? 1 : 0;
          } else if (typeof item.status === "number") {
            statusValue = item.status;
          }
          return { ...item, status: statusValue };
        })
      );
    } catch {
      console.error("Không thể tải danh mục đã xóa");
    }
  };

  // Xóa danh mục (chuyển vào thùng rác)
  const handleDelete = async (id: number | string, status?: number) => {
    if (status === 1) {
      setNotification({
        open: true,
        title: "Không thể xóa danh mục hoạt động",
        description: "Bạn cần ẩn danh mục trước khi xóa!",
        emoji: <span style={{ fontSize: 28 }}>⚠️</span>,
        acceptText: "Đóng",
        onAccept: () => setNotification(prev => ({ ...prev, open: false }))
      });
      return;
    }
    setNotification({
      open: true,
      title: "Xác nhận xóa",
      description: "Bạn có chắc chắn muốn xóa danh mục này?",
      emoji: <span style={{ fontSize: 28 }}>⚠️</span>,
      acceptText: "Xóa",
      rejectText: "Hủy",
      onAccept: async () => {
        try {
          await apiClientBase.delete(`/category/${id}`);
          const deletedItem = categories.find(item => String(item.id) === String(id));
          if (deletedItem) {
            const newDeletedCategory: Category = {
              ...deletedItem,
              status: deletedItem.status,
              deleted_at: new Date().toISOString()
            };
            setDeletedCategories(prev => [...prev, newDeletedCategory]);
          }
          setCategories(categories.filter((item) => String(item.id) !== String(id)));
          setNotification({
            open: true,
            title: "Thành công",
            description: "Đã xóa danh mục thành công!",
            emoji: <span style={{ fontSize: 28 }}>✅</span>,
            acceptText: "Đóng",
            onAccept: () => setNotification(prev => ({ ...prev, open: false }))
          });
        } catch {
          setNotification({
            open: true,
            title: "Lỗi",
            description: "Xóa danh mục thất bại!",
            emoji: <span style={{ fontSize: 28 }}>❌</span>,
            acceptText: "Đóng",
            onAccept: () => setNotification(prev => ({ ...prev, open: false }))
          });
        }
      },
      onReject: () => setNotification(prev => ({ ...prev, open: false }))
    });
  };

  // Khôi phục danh mục từ thùng rác
  const handleRestore = async (id: number | string) => {
    setNotification({
      open: true,
      title: "Xác nhận khôi phục",
      description: "Bạn có chắc chắn muốn khôi phục danh mục này?",
      emoji: <span style={{ fontSize: 28 }}>⚠️</span>,
      acceptText: "Khôi phục",
      rejectText: "Hủy",
      onAccept: async () => {
        try {
          const res = await apiClientBase.post(`/category/${id}/restore`, {});
          const rawApiData = res.data as Category;
          const convertedStatus = typeof rawApiData.status === "boolean" ? (rawApiData.status ? 1 : 0) : (rawApiData.status ?? 0);
          
          const restoredItemData: Category = {
            ...rawApiData,
            status: convertedStatus,
            deleted_at: undefined
          };

          setCategories(prev => [...prev, restoredItemData]);
          setDeletedCategories(deletedCategories.filter((item) => item.id !== id));
          setNotification({
            open: true,
            title: "Thành công",
            description: "Đã khôi phục danh mục thành công!",
            emoji: <span style={{ fontSize: 28 }}>✅</span>,
            acceptText: "Đóng",
            onAccept: () => setNotification(prev => ({ ...prev, open: false }))
          });
        } catch {
          setNotification({
            open: true,
            title: "Lỗi",
            description: "Khôi phục danh mục thất bại!",
            emoji: <span style={{ fontSize: 28 }}>❌</span>,
            acceptText: "Đóng",
            onAccept: () => setNotification(prev => ({ ...prev, open: false }))
          });
        }
      },
      onReject: () => setNotification(prev => ({ ...prev, open: false }))
    });
  };


  // Hiển thị form sửa
  const handleEdit = (item: Category) => {
    setFormCate(item);
    setEditId(item.id);
    setFormVisible(true);
  };

  // Hiển thị form thêm
  const handleShowAdd = () => {
    setFormCate({
      name: "",
      slug: "",
      status: 1,
    });
    setEditId(null);
    setFormVisible(true);
  };

  // Đóng modal form
  const handleCloseForm = () => {
    setFormVisible(false);
    setFormCate({
      name: "",
      slug: "",
      status: 1,
    });
    setEditId(null);
  };

  // Xử lý submit form thêm/sửa
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCate.name) {
      setNotification({
        open: true,
        title: "Lỗi",
        description: "Vui lòng nhập tên danh mục!",
        emoji: <span style={{ fontSize: 28 }}>❌</span>,
        acceptText: "Đóng",
        onAccept: () => setNotification(prev => ({ ...prev, open: false }))
      });
      return;
    }
    try {
      if (editId) {
        // Sửa
        const res = await apiClientBase.put(`/category/${editId}`, formCate);
        const rawApiData = res.data as Category;

        const convertedStatus = typeof rawApiData.status === "boolean" ? (rawApiData.status ? 1 : 0) : (rawApiData.status ?? 0);
        const updatedCategory: Category = {
          id: rawApiData.id,
          name: rawApiData.name,
          slug: rawApiData.slug,
          status: convertedStatus,
          deleted_at: rawApiData.deleted_at,
        };
        setCategories((prev) =>
          prev.map((item) => (item.id === editId ? updatedCategory : item))
        );
        setNotification({
          open: true,
          title: "Thành công",
          description: "Đã cập nhật danh mục thành công!",
          emoji: <span style={{ fontSize: 28 }}>✅</span>,
          acceptText: "Đóng",
          onAccept: () => setNotification(prev => ({ ...prev, open: false }))
        });
      } else {
        // Thêm
        const res = await apiClientBase.post("/category", formCate);
        const rawApiData = res.data as Category;

        const convertedStatus = typeof rawApiData.status === "boolean" ? (rawApiData.status ? 1 : 0) : (rawApiData.status ?? 0);
        const addedCategory: Category = {
          id: rawApiData.id,
          name: rawApiData.name,
          slug: rawApiData.slug,
          status: convertedStatus,
          deleted_at: rawApiData.deleted_at,
        };
        setCategories((prev) => [...prev, addedCategory]);
        setNotification({
          open: true,
          title: "Thành công",
          description: "Đã thêm danh mục mới thành công!",
          emoji: <span style={{ fontSize: 28 }}>✅</span>,
          acceptText: "Đóng",
          onAccept: () => setNotification(prev => ({ ...prev, open: false }))
        });
      }
      setFormVisible(false);
      setFormCate({
        name: "",
        slug: "",
        status: 1,
      });
      setEditId(null);
    } catch {
      setNotification({
        open: true,
        title: "Lỗi",
        description: "Lưu thất bại!",
        emoji: <span style={{ fontSize: 28 }}>❌</span>,
        acceptText: "Đóng",
        onAccept: () => setNotification(prev => ({ ...prev, open: false }))
      });
    }
  };

  // Thay đổi trạng thái danh mục
  const handleToggleStatus = async (id: number | string, currentStatus: number) => {
    try {
      const newStatusValue = currentStatus === 1 ? 0 : 1;
      const res = await apiClientBase.put(`/category/${id}`, { status: newStatusValue });
      const rawApiData = res.data as Category;

      const convertedStatus = typeof rawApiData.status === "boolean" ? (rawApiData.status ? 1 : 0) : (rawApiData.status ?? 0);
      const toggledCategory: Category = {
        id: rawApiData.id,
        name: rawApiData.name,
        slug: rawApiData.slug,
        status: convertedStatus,
        deleted_at: rawApiData.deleted_at,
      };

      setCategories((prev) =>
        prev.map((item) => (item.id === id ? toggledCategory : item))
      );
    } catch {
      alert("Cập nhật trạng thái thất bại!");
    }
  };


  const handleOpenMenu = (id: number | string, event: React.MouseEvent) => {
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

  // Lọc danh mục theo từ khóa tìm kiếm
const filteredCates = categories.filter(cate =>
  cate.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
  (statusFilter === '' ? true : cate.status === statusFilter)
);

  const filteredDeletedCates = deletedCategories.filter(cate =>
    cate.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Refactor CateActions to only render the action button, not the dropdown
  function CateActions({ id }: { id: number | string }) {
    return (
      <div className="relative flex justify-center">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-100 transition"
          onClick={e => handleOpenMenu(id, e)}
          type="button"
        >
          <span className="sr-only">Mở menu</span>
          <svg width={24} height={24} fill="none" viewBox="0 0 24 24">
            <circle cx={12} cy={6} r={1.5} fill="#333" />
            <circle cx={12} cy={12} r={1.5} fill="#333" />
            <circle cx={12} cy={18} r={1.5} fill="#333" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Quản lý Danh Mục</h2>

        </div>
        <button
          onClick={handleShowAdd}
          className="px-4 py-2 rounded-[8px] bg-[#3E2723] text-[#FAF3E0]  hover:bg-[#D4AF37]"
        >
          Thêm danh mục mới
        </button>
        
      </div>

      {/* Thanh tìm kiếm */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Tìm theo tiêu đề..."
          className="border border-gray-300 px-2 h-8 rounded-md text-sm focus:outline-none min-w-[120px]"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div ref={statusDropdownRef} className="relative">
          <button
            type="button"
            className="border border-gray-300 px-2 h-8 rounded-md text-sm font-normal bg-white min-w-[120px] flex items-center justify-between"
            onClick={() => setStatusDropdownOpen((open) => !open)}
            disabled={showTrash}
          >
            {statusFilter === '' ? 'Tất cả trạng thái' : statusFilter === 1 ? 'Hoạt động' : 'Ẩn'}
            <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {statusDropdownOpen && !showTrash && (
            <ul className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow z-20 py-1 text-sm min-w-[140px]">
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${statusFilter === '' ? 'font-bold' : 'font-normal'}`}
                  onClick={() => { setStatusFilter(''); setStatusDropdownOpen(false); }}
                >Tất cả trạng thái</button>
              </li>
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${statusFilter === 1 ? 'font-bold' : 'font-normal'}`}
                  onClick={() => { setStatusFilter(1); setStatusDropdownOpen(false); }}
                >Hoạt động</button>
              </li>
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${statusFilter === 0 ? 'font-bold' : 'font-normal'}`}
                  onClick={() => { setStatusFilter(0); setStatusDropdownOpen(false); }}
                >Ẩn</button>
              </li>
            </ul>
          )}
        </div>
        <button
          onClick={() => setShowTrash(!showTrash)}
          className={`border border-gray-300 px-2 h-8 rounded-md text-sm font-normal bg-white ${showTrash ? 'bg-amber-100 border-amber-400' : ''}`}
        >
          {showTrash ? 'Quay lại' : 'Thùng rác'}
        </button>
      </div>

      {/* Form thêm/sửa dùng modal */}
      {formVisible && (
        <Modal isOpen={formVisible} onClose={handleCloseForm} className="max-w-xl">
          <div className="dark:bg-gray-800 bg-white rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700 max-w-xl mx-auto">
            <h3 className="font-bold mb-4">{editId ? "Sửa danh mục" : "Thêm danh mục"}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên danh mục</label>
                <input
                  type="text"
                  className="border px-3 py-2 rounded w-full"
                  value={formCate.name ?? ""}
                  onChange={e => setFormCate(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  className="border px-3 py-2 rounded w-full"
                  value={formCate.slug ?? ""}
                  onChange={e => setFormCate(f => ({ ...f, slug: e.target.value }))}
                  placeholder="Tự động tạo nếu để trống"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <select
                  className="border px-3 py-2 rounded w-full"
                  value={formCate.status ?? 1}
                  onChange={e => setFormCate(f => ({ ...f, status: Number(e.target.value) }))}
                >
                  <option value={1}>Hoạt động</option>
                  <option value={0}>Ẩn</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-[#3E2723] text-[#FAF3E0] hover:bg-[#D4AF37] px-6 py-2 rounded-[8xp] font-semibold shadow transition"
                >
                  {editId ? "Lưu thay đổi" : "Thêm mới"}
                </button>
                <button
                  type="button"
                  className="bg-gray-400 text-white px-6 py-2 rounded-[8px] font-semibold shadow hover:bg-gray-600 transition"
                  onClick={handleCloseForm}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[600px]">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">ID</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Tên danh mục</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Slug</TableCell>
                  {!showTrash && (
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Trạng thái</TableCell>
                  )}
                  {showTrash && (
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Ngày xóa</TableCell>
                  )}
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-center">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] ">
                {loading ? (
                  <TableRow>
                    <TableCell  className="text-center py-6">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : showTrash ? (
                  filteredDeletedCates.length === 0 ? (
                    <TableRow>
                      <TableCell  className="text-center py-6">
                        Thùng rác trống.
                      </TableCell>
                    </TableRow>
                  ) : (
                    [...filteredDeletedCates].sort((a, b) => 
                      new Date(b.deleted_at || 0).getTime() - new Date(a.deleted_at || 0).getTime()
                    ).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="px-4 py-3">{item.id}</TableCell>
                        <TableCell className="px-4 py-3">{item.name}</TableCell>
                        <TableCell className="px-4 py-3">{item.slug}</TableCell>
                        <TableCell className="px-4 py-3">
                          {item.deleted_at ? new Date(item.deleted_at).toLocaleString() : 'N/A'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <CateActions
                            id={item.id}
                            isDeleted
                            onRestore={() => handleRestore(item.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )
                ) : filteredCates.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-center py-6">
                      Không có danh mục nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  [...filteredCates].sort((a, b) => Number(b.id) - Number(a.id)).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="px-4 py-3">{item.id}</TableCell>
                      <TableCell className="px-4 py-3">{item.name}</TableCell>
                      <TableCell className="px-4 py-3">{item.slug}</TableCell>
                      <TableCell className="px-4 py-3">
                        {item.status === 1 ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Hoạt động</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded">Ẩn</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <CateActions
                          id={item.id}
                          onEdit={() => handleEdit(item)}
                          onDelete={() => handleDelete(item.id, item.status)}
                          onToggleStatus={() => handleToggleStatus(item.id, item.status)}
                          status={item.status}
                        />
                      </TableCell>
                    </TableRow>
                  ))
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

      {openMenuId !== null && menuPosition &&
        ReactDOM.createPortal(
          (() => {
            // Find the item (category) by id
            const item = showTrash
              ? deletedCategories.find(c => c.id === openMenuId)
              : categories.find(c => c.id === openMenuId);
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
                {showTrash ? (
                  <>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600"
                      onClick={() => {
                        handleRestore(item.id);
                        setOpenMenuId(null);
                        setMenuPosition(null);
                      }}
                    >
                      Khôi phục
                    </button>
                  </>
                ) : (
                  <>
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
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        handleToggleStatus(item.id, item.status);
                        setOpenMenuId(null);
                        setMenuPosition(null);
                      }}
                    >
                      {item.status === 1 ? "Ẩn" : "Kích hoạt"}
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
                  </>
                )}
              </div>
            );
          })(),
          document.body
        )
      }
    </div>
  );
}