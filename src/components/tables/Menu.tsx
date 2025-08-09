"use client"
import React, { useEffect, useState, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Image from "next/image";
import { IProduct } from "../../model/type";
import { Modal } from "../ui/modal";
import apiClientBase from "@/lib/apiClient";
import { FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import NotificationModal from "./NotificationModal";
import ReactDOM from "react-dom";
import { ImageSelectorButton } from "@/components/file-manager";

export default function Menu() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  

  // State cho form thêm/sửa
  const [formProduct, setFormProduct] = useState<Partial<IProduct>>({
    name: "",
    image: "",
    price: undefined,
    status: 1,
    meta_description: "",
    detail_description: "",
    quantity_sold: undefined,
    id_category: "",
    id_user: "1", // Mặc định là 1
  });
  const [editId, setEditId] = useState<number | string | null>(null);
  const [formVisible, setFormVisible] = useState(false);

  // State cho danh sách loại món ăn
  const [categories, setCategories] = useState<{ id: string | number; name: string }[]>([]);

  // State cho bộ lọc
  const [filterName, setFilterName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // const perPage = 10;

  // State cho hiển thị sản phẩm đã xóa
  const [showTrashed, setShowTrashed] = useState(false);
  const [trashedProducts, setTrashedProducts] = useState<IProduct[]>([]);
  const [loadingTrashed, setLoadingTrashed] = useState(false);

  // State cho danh mục đã xóa mềm
  // const [trashedCategories, setTrashedCategories] = useState<{ id: string | number; name: string }[]>([]);
  // const [loadingTrashedCategories, setLoadingTrashedCategories] = useState(false);

  // State cho modal thông báo khi submit form
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

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // State for portal action menu
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  // State cho image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Hàm xử lý chọn ảnh từ ImageSelector
  const handleImageSelect = (url: string) => {
    setFormProduct(prev => ({ ...prev, image: url }));
    setImagePreview(url);
  };

  // Hàm xử lý xóa ảnh
  const handleRemoveImage = () => {
    setFormProduct(prev => ({ ...prev, image: "" }));
    setImagePreview(null);
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClientBase.get(`/category`);
      if (res.data && res.data) {
        setCategories(res.data.map((cat: { id: string | number; name: string }) => ({
          id: cat.id,
          name: cat.name,
        })));
      }
    } catch {
      toast.error("Không thể tải danh mục!");
    }
  };

  useEffect(() => {
    fetchCategories();
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

  // Thêm hàm fetchProducts để tái sử dụng
  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClientBase.get(`/pagination/products?page=${currentPage}`);
      console.log('API Response:', res.data);
      const products = Array.isArray(res.data?.data) ? res.data.data : [];
      console.log('Processed Products:', products);
      setProducts(products.map((item: IProduct) => {
        let is_active = false;
        if (typeof item.status === "boolean") {
          is_active = item.status === true;
        } else if (typeof item.status === "number") {
          is_active = item.status === 1;
        }
        return {
          ...item,
          id_category: item.id_category ?? item.id_category,
          is_active,
        };
      }));
      setTotalPages(res.data?.last_page || 1);
    } catch {
      toast.error("Không thể tải danh sách sản phẩm!");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  // Cập nhật useEffect để sử dụng fetchProducts
  useEffect(() => {
    fetchProducts();
  }, [currentPage, fetchProducts]);

  // Lấy danh sách sản phẩm đã xóa mềm
  const fetchTrashedProducts = async () => {
    setLoadingTrashed(true);
    try {
      const res = await apiClientBase.get("/products/trashed");
      const data = Array.isArray(res.data) ? res.data : [];
      setTrashedProducts(data);
    } catch {
      alert("Không thể tải danh sách sản phẩm đã xóa!");
    }
    setLoadingTrashed(false);
  };

  // Cập nhật handleSubmit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct.name || !formProduct.price || !formProduct.id_category) {
      setModalState({
        open: true,
        title: "Thiếu thông tin!",
        description: "Vui lòng nhập đầy đủ thông tin bắt buộc (Tên, Giá, Loại)!",
        emoji: <span style={{ fontSize: 28 }}>⚠️</span>,
        acceptText: "OK",
        onAccept: () => setModalState((prev) => ({ ...prev, open: false })),
      });
      return;
    }

    const submitData = {
      name: formProduct.name,
      slug: formProduct.slug || null, // Let backend handle slug generation
      image: formProduct.image || null,
      price: Number(formProduct.price || 0),
      status: formProduct.status === undefined ? 1 : Number(formProduct.status),
      meta_description: formProduct.meta_description || null,
      detail_description: formProduct.detail_description || null,
      quantity_sold: Number(formProduct.quantity_sold || 0),
      id_category: String(formProduct.id_category),
      id_user: String(formProduct.id_user || "1")
    };

    try {
      if (editId) {
        await apiClientBase.put(`/product/${editId}`, submitData);
        setModalState({
          open: true,
          title: "Cập nhật thành công!",
          description: "Món ăn đã được cập nhật thành công.",
          emoji: <span style={{ fontSize: 28 }}>✅</span>,
          acceptText: "OK",
          onAccept: () => setModalState((prev) => ({ ...prev, open: false })),
        });
      } else {
        await apiClientBase.post("/product", submitData);
        setCurrentPage(1);
        setModalState({
          open: true,
          title: "Thêm thành công!",
          description: "Món ăn mới đã được thêm thành công.",
          emoji: <span style={{ fontSize: 28 }}>🎉</span>,
          acceptText: "OK",
          onAccept: () => setModalState((prev) => ({ ...prev, open: false })),
        });
      }
      setFormVisible(false);
      setFormProduct({
        name: "",
        image: "",
        price: undefined,
        status: 1,
        meta_description: "",
        detail_description: "",
        quantity_sold: undefined,
        id_category: "",
        id_user: "1"
      });
      setImagePreview(null);
      setEditId(null);
      fetchProducts();
    } catch {
      setModalState({
        open: true,
        title: "Lưu thất bại!",
        description: "Có lỗi xảy ra khi lưu sản phẩm.",
        emoji: <span style={{ fontSize: 28 }}>❌</span>,
        acceptText: "OK",
        onAccept: () => setModalState((prev) => ({ ...prev, open: false })),
      });
    }
  };

  // Cập nhật handleDelete
  const handleDelete = async (id: number | string) => {
     // if (!window.confirm("Bạn có chắc chắn muốn xóa món này?")) return;
    try {
      await apiClientBase.delete(`/product/${id}`);
      toast.success("Đã xóa món ăn thành công!");
      // Tải lại dữ liệu sau khi xóa
      fetchProducts();
    } catch {
      toast.error("Xóa thất bại!");
    }
  };

  // Cập nhật handleRestore
  const handleRestore = async (id: number | string) => {
    if (!window.confirm("Khôi phục sản phẩm này?")) return;
    try {
      await apiClientBase.post(`/product/${id}/restore`, {});
      toast.success("Khôi phục sản phẩm thành công!");
      // Tải lại cả danh sách đã xóa và danh sách chính
      fetchTrashedProducts();
      fetchProducts();
    } catch {
      toast.error("Khôi phục thất bại!");
    }
  };


  // Hiển thị form sửa
  const handleEdit = (item: IProduct) => {
    setFormProduct(item);
    setImagePreview(item.image || null);
    setEditId(item.id);
    setFormVisible(true);
  };

  // Hiển thị form thêm
  const handleShowAdd = () => {
    setFormProduct({
      name: "",
      price: undefined,
      id_category: "",
      is_active: true,
      image: "",
      quantity_sold: undefined,
    });
    setImagePreview(null);
    setEditId(null);
    setFormVisible(true);
  };

  // Đóng modal form
  const handleCloseForm = () => {
    setFormVisible(false);
    setFormProduct({
      name: "",
      image: "",
      price: undefined,
      status: 1,
      meta_description: "",
      detail_description: "",
      quantity_sold: undefined,
      id_category: "",
      id_user: "1"
    });
    setImagePreview(null);
    setEditId(null);
  };

  // Bộ lọc sản phẩm theo tên và trạng thái
  const filteredProducts = products.filter(item => {
    const matchName = filterName.trim() === "" || item.name.toLowerCase().includes(filterName.trim().toLowerCase());
    const matchStatus = filterStatus === "" || (filterStatus === "1" ? item.is_active : !item.is_active);
    return matchName && matchStatus;
  });

  // Thêm useEffect để reset về trang 1 khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [filterName, filterStatus]);

  // Cập nhật handleDeleteCategory

  // Thêm hàm xử lý xem chi tiết
  const handleViewDetail = (product: IProduct) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  // Handle open menu
  const handleOpenMenu = (id: number | string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (openMenuId === id) {
      setOpenMenuId(null);
      setMenuPosition(null);
      return;
    }
    const buttonRect = (event.target as HTMLElement).closest("button")?.getBoundingClientRect();
    if (buttonRect) {
      setMenuPosition({
        top: buttonRect.bottom + 8, // 8px cách nút, bỏ window.scrollY
        left: buttonRect.left + buttonRect.width / 2 - 120, // bỏ window.scrollX
      });
    } else {
      setMenuPosition({
        top: event.clientY,
        left: event.clientX,
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
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Quản lý Menu Món Ăn</h2>

        </div>
        <button
          onClick={handleShowAdd}
          className="px-4 py-2 rounded-[8px] bg-[#3E2723] text-[#FAF3E0]  hover:bg-[#D4AF37]"
        >
          Thêm món mới
        </button>
        
      </div>
      {/* Bộ lọc */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Tìm theo tên món..."
          className="border border-gray-300 px-2 h-8 rounded-md text-sm focus:outline-none min-w-[120px]"
          value={filterName}
          onChange={e => setFilterName(e.target.value)}
        />
        <div ref={statusDropdownRef} className="relative">
          <button
            type="button"
            className="border border-gray-300 px-2 h-8 rounded-md text-sm font-normal bg-white min-w-[120px] flex items-center justify-between"
            onClick={() => setStatusDropdownOpen((open) => !open)}
          >
            {filterStatus === "" ? "Tất cả trạng thái" : filterStatus === "1" ? "Đang bán" : "Ngừng bán"}
            <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {statusDropdownOpen && (
            <ul className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow z-20 py-1 text-sm min-w-[140px]">
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${filterStatus === "" ? "font-bold" : "font-normal"}`}
                  onClick={() => { setFilterStatus(""); setStatusDropdownOpen(false); }}
                >Tất cả trạng thái</button>
              </li>
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${filterStatus === "1" ? "font-bold" : "font-normal"}`}
                  onClick={() => { setFilterStatus("1"); setStatusDropdownOpen(false); }}
                >Đang bán</button>
              </li>
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded ${filterStatus === "0" ? "font-bold" : "font-normal"}`}
                  onClick={() => { setFilterStatus("0"); setStatusDropdownOpen(false); }}
                >Ngừng bán</button>
              </li>
            </ul>
          )}
        </div>
        <button
          className={`border border-gray-300 px-2 h-8 rounded-md text-sm font-normal bg-white ${!showTrashed ? 'bg-amber-100 border-amber-400' : ''}`}
          onClick={() => setShowTrashed(false)}
        >
          Danh sách
        </button>
        <button
          className={`border border-gray-300 px-2 h-8 rounded-md text-sm font-normal bg-white flex items-center gap-1 ${showTrashed ? 'bg-amber-100 border-amber-400' : ''}`}
          onClick={() => {
            setShowTrashed(true);
            fetchTrashedProducts();
          }}
          title="Đã xóa"
        >
          <FaTrash className="mr-1" />
          Đã xóa
        </button>
      </div>
      {/* Form thêm/sửa dùng modal */}
        {formVisible && (
          <Modal isOpen={formVisible} onClose={handleCloseForm} className="max-w-3xl top-0 left-0 right-0 mx-auto mt-4">
            <div className="dark:bg-gray-800 bg-white rounded-xl shadow p-6 mx-auto">
              <h3 className="font-bold mb-4 text-xl">{editId ? "Sửa món ăn" : "Thêm món ăn"}</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                {/* Tên món */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-1">Tên món <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full"
                    value={formProduct.name ?? ""}
                    onChange={e => setFormProduct(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>

                {/* Giá */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-1">Giá <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className="border px-3 py-2 rounded w-full"
                    value={formProduct.price || ""}
                    onChange={e => setFormProduct(f => ({ ...f, price: Number(e.target.value) }))}
                    required
                    min={0}
                  />
                </div>

                {/* Loại */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-1">Loại <span className="text-red-500">*</span></label>
                  <select
                    className="border px-3 py-2 rounded w-full"
                    value={formProduct.id_category ?? ""}
                    onChange={e => setFormProduct(f => ({ ...f, id_category: e.target.value }))}
                    required
                  >
                    <option value="">-- Chọn loại --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Trạng thái */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-1">Trạng thái</label>
                  <select
                    className="border px-3 py-2 rounded w-full"
                    value={String(formProduct.status ?? 1)}
                    onChange={e => setFormProduct(f => ({ ...f, status: e.target.value === "1" ? 1 : 0 }))}
                  >
                    <option value="1">Đang bán</option>
                    <option value="0">Ngừng bán</option>
                  </select>
                </div>

                {/* Hình ảnh */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-1">Hình ảnh</label>
                  <ImageSelectorButton
                    buttonText="Chọn ảnh"
                    buttonClassName="w-full h-10 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-md text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
                    buttonIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    }
                    title="Chọn hình ảnh cho món ăn"
                    selectedImage={imagePreview || formProduct.image || null}
                    onImageSelect={handleImageSelect}
                    onImageRemove={handleRemoveImage}
                    layout="vertical"
                    gap={2}
                    showPreview={true}
                  />
                </div>

                {/* Số lượng đã bán */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-1">Số lượng đã bán</label>
                  <input
                    type="number"
                    className="border px-3 py-2 rounded w-full"
                    value={formProduct.quantity_sold || 0}
                    onChange={e => setFormProduct(f => ({ ...f, quantity_sold: Number(e.target.value) }))}
                    min={0}
                  />
                </div>

                {/* Mô tả ngắn */}
                <div className="flex flex-col col-span-2">
                  <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full"
                    value={formProduct.meta_description ?? ""}
                    onChange={e => setFormProduct(f => ({ ...f, meta_description: e.target.value }))}
                  />
                </div>

                {/* Mô tả chi tiết */}
                <div className="flex flex-col col-span-2">
                  <label className="block text-sm font-medium mb-1">Mô tả chi tiết</label>
                  <textarea
                    className="border px-3 py-2 rounded w-full"
                    value={formProduct.detail_description ?? ""}
                    onChange={e => setFormProduct(f => ({ ...f, detail_description: e.target.value }))}
                    rows={4}
                  />
                </div>

                {/* Nút submit/hủy */}
                <div className="flex gap-2 mt-4 col-span-2 justify-end">
                  <button
                    type="button"
                    className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-gray-600 transition"
                    onClick={handleCloseForm}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="bg-[#3E2723] text-[#FAF3E0] hover:bg-[#D4AF37] px-6 py-2 rounded-lg font-semibold shadow transition"
                  >
                    {editId ? "Lưu thay đổi" : "Thêm mới"}
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}

      {/* Modal xem chi tiết */}
      {detailModalVisible && selectedProduct && (
        <Modal isOpen={detailModalVisible} onClose={() => setDetailModalVisible(false)} className="max-w-2xl">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Chi tiết món ăn</h3>
              <button
                onClick={() => setDetailModalVisible(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Hình ảnh */}
              <div className="col-span-2">
                <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                  {selectedProduct.image ? (
                    <Image
                      width={400}
                      height={300}
                      src={
                        selectedProduct.image.startsWith("http") || selectedProduct.image.startsWith("/")
                          ? selectedProduct.image
                          : `/images/products/${selectedProduct.image}`
                      }
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Không có hình ảnh
                    </div>
                  )}
                </div>
              </div>

              {/* Thông tin cơ bản */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700">Tên món</h4>
                  <p className="text-lg">{selectedProduct.name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Giá</h4>
                  <p className="text-lg text-[#3E2723] font-semibold">{selectedProduct.price?.toLocaleString()} đ</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Loại</h4>
                  <p className="text-lg">
                    {categories.find(c => String(c.id) === String(selectedProduct.id_category))?.name || selectedProduct.id_category}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Trạng thái</h4>
                  <Badge
                    size="sm"
                    color={selectedProduct.is_active ? "success" : "error"}
                  >
                    {selectedProduct.is_active ? "Đang bán" : "Ngừng bán"}
                  </Badge>
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700">Số lượng đã bán</h4>
                  <p className="text-lg">{selectedProduct.quantity_sold || 0}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Mô tả ngắn</h4>
                  <p className="text-gray-600">{selectedProduct.meta_description || "Không có mô tả"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Mô tả chi tiết</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedProduct.detail_description || "Không có mô tả chi tiết"}</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {!showTrashed ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Hình</TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Tên món</TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Giá</TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Loại</TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Trạng thái</TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-center">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] ">
                  {loading ? (
                    <TableRow className="text-center">
                      <TableCell className="text-center py-6">
                        Đang tải dữ liệu...
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-center py-6">
                        Không có món ăn nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Sắp xếp: món mới thêm (id lớn nhất) lên đầu
                    [...filteredProducts].sort((a, b) => Number(b.id) - Number(a.id)).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="px-4 py-3">
                          <div className="w-14 h-14 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                            {item.image ? (
                              <Image
                                width={56}
                                height={56}
                                src={
                                  item.image.startsWith("http") || item.image.startsWith("/")
                                    ? item.image
                                    : `/images/products/${item.image}`
                                }
                                alt={item.name}
                              />
                            ) : (
                              <span className="text-xs text-gray-400">No Image</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">{item.name}</TableCell>
                        <TableCell className="px-4 py-3">{item.price.toLocaleString()} đ</TableCell>
                        <TableCell className="px-4 py-3">
                          {categories.find(c => String(c.id) === String(item.id_category))?.name || item.id_category}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge
                            size="sm"
                            color={item.is_active ? "success" : "error"}
                          >
                            {item.is_active ? (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                                Đang bán
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                                Ngừng bán
                              </span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <button
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={e => handleOpenMenu(item.id, e)}
                            type="button"
                            aria-label="Actions"
                          >
                            <svg width={24} height={24} fill="none" viewBox="0 0 24 24">
                              <circle cx={12} cy={6} r={1.5} fill="#333" />
                              <circle cx={12} cy={12} r={1.5} fill="#333" />
                              <circle cx={12} cy={18} r={1.5} fill="#333" />
                            </svg>
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {/* Phân trang */}
              <div className="flex justify-center items-center gap-2 mt-4 select-none">
                <button
                  className="px-3 py-1 rounded border bg-gray-100 text-gray-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </button>
                {/* Trang đầu */}
                <button
                  className={`px-3 py-1 rounded border font-medium ${
                    currentPage === 1
                      ? 'bg-[#3E2723] text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  1
                </button>
                {/* Trang 2 nếu gần đầu */}
                {totalPages > 1 && currentPage <= 3 && (
                  <button
                    className={`px-3 py-1 rounded border font-medium ${
                      currentPage === 2
                        ? 'bg-[#3E2723] text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    onClick={() => setCurrentPage(2)}
                    disabled={currentPage === 2}
                  >
                    2
                  </button>
                )}
                {/* Dấu ... nếu cách xa đầu */}
                {currentPage > 3 && <span className="px-2">...</span>}
                {/* Trang hiện tại nếu không phải đầu/cuối */}
                {currentPage > 2 && currentPage < totalPages && (
                  <button
                    className="px-3 py-1 rounded border font-medium bg-[#3E2723] text-white"
                    disabled
                  >
                    {currentPage}
                  </button>
                )}
                {/* Dấu ... nếu cách xa cuối */}
                {currentPage < totalPages - 2 && <span className="px-2">...</span>}
                {/* Trang cuối */}
                {totalPages > 1 && (
                  <button
                    className={`px-3 py-1 rounded border font-medium ${
                      currentPage === totalPages
                        ? 'bg-[#3E2723] text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    {totalPages}
                  </button>
                )}
                <button
                  className="px-3 py-1 rounded border bg-gray-100 text-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Tiếp Theo
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Hình</TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Tên món</TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Giá</TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start">Loại</TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-center">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] ">
                  {loadingTrashed ? (
                    <TableRow>
                      <TableCell className="text-center py-6">
                        Đang tải dữ liệu...
                      </TableCell>
                    </TableRow>
                  ) : trashedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-center py-6">
                        Không có sản phẩm đã xóa.
                      </TableCell>
                    </TableRow>
                  ) : (
                    trashedProducts.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="px-4 py-3">
                          <div className="w-14 h-14 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                            {item.image ? (
                              <Image
                                width={56}
                                height={56}
                                src={
                                  item.image.startsWith("http") || item.image.startsWith("/")
                                    ? item.image
                                    : `/images/products/${item.image}`
                                }
                                alt={item.name}
                              />
                            ) : (
                              <span className="text-xs text-gray-400">No Image</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">{item.name}</TableCell>
                        <TableCell className="px-4 py-3">{item.price?.toLocaleString()} đ</TableCell>
                        <TableCell className="px-4 py-3">
                          {categories.find(c => String(c.id) === String(item.id_category))?.name || item.id_category}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <button
                            className="px-3 py-1 bg-green-500 text-white rounded mr-2"
                            onClick={() => handleRestore(item.id)}
                          >
                            Khôi phục
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
      {/* NotificationModal cho submit form */}
      <NotificationModal
        open={modalState.open}
        title={modalState.title}
        description={modalState.description}
        emoji={modalState.emoji}
        acceptText={modalState.acceptText}
        rejectText={modalState.rejectText}
        onAccept={() => {
          modalState.onAccept?.();
          setModalState((prev) => ({ ...prev, open: false }));
        }}
        onReject={() => {
          modalState.onReject?.();
          setModalState((prev) => ({ ...prev, open: false }));
        }}
      />
      {/* Portal action menu (only once, at the end of the component) */}
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
          >
            {/* Arrow: căn giữa với nút 3 chấm */}
            <div
              style={{
                position: "absolute",
                top: -10,
                left: 110, // dịch sang phải thêm 20px nữa
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
                left: 109, // dịch sang phải thêm 20px nữa
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
                const product = products.find(p => p.id === openMenuId);
                if (product) handleViewDetail(product);
                setOpenMenuId(null);
                setMenuPosition(null);
              }}
            >
              Xem
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                const product = products.find(p => p.id === openMenuId);
                if (product) handleEdit(product);
                setOpenMenuId(null);
                setMenuPosition(null);
              }}
            >
              Sửa
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={async () => {
                const product = products.find(p => p.id === openMenuId);
                if (product) await (async () => {
                  await apiClientBase.patch(`/product/${product.id}`, { status: !product.is_active });
                  setProducts(products =>
                    products.map(p =>
                      p.id === product.id ? { ...p, is_active: !p.is_active } : p
                    )
                  );
                  setModalState({
                    open: true,
                    title: "Cập nhật trạng thái thành công!",
                    description: `Trạng thái món "${product.name}" đã được cập nhật.`,
                    emoji: <span style={{ fontSize: 28 }}>✅</span>,
                    acceptText: "OK",
                    onAccept: () => setModalState((prev) => ({ ...prev, open: false })),
                  });
                })();
                setOpenMenuId(null);
                setMenuPosition(null);
              }}
            >
              {(() => {
                const product = products.find(p => p.id === openMenuId);
                return product?.is_active ? "Ngừng bán" : "Bán lại";
              })()}
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
              onClick={() => {
                const product = products.find(p => p.id === openMenuId);
                if (product) handleDelete(product.id);
                setOpenMenuId(null);
                setMenuPosition(null);
              }}
            >
              Xóa
            </button>
          </div>,
          document.body
        )
      }
    </div>
  );
}