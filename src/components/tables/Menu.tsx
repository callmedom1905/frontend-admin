"use client"
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

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
  const [filterCategory, setFilterCategory] = useState<string | number | "">("");
  const [sortOption, setSortOption] = useState<
    "default" | "price_asc" | "price_desc" | "name_asc" | "name_desc" | "sold_desc"
  >("default");
  const [apiSortedProducts, setApiSortedProducts] = useState<IProduct[]>([]);
  const [loadingSort, setLoadingSort] = useState(false);
  const [searchResults, setSearchResults] = useState<IProduct[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State cho hiển thị sản phẩm đã xóa
  const [showTrashed, setShowTrashed] = useState(false);
  const [trashedProducts, setTrashedProducts] = useState<IProduct[]>([]);
  const [loadingTrashed, setLoadingTrashed] = useState(false);

  // State cho dữ liệu từ API lọc theo trạng thái
  const [filteredByStatusProducts, setFilteredByStatusProducts] = useState<IProduct[]>([]);
  const [loadingStatusFilter, setLoadingStatusFilter] = useState(false);

  // State cho dữ liệu từ API lọc theo danh mục
  const [filteredByCategoryProducts, setFilteredByCategoryProducts] = useState<IProduct[]>([]);
  const [loadingCategoryFilter, setLoadingCategoryFilter] = useState(false);

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // State cho thanh chức năng menu
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  // State cho image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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
        type CategoryOption = { id: string | number; name: string };
        const cats = res.data as CategoryOption[];
        setCategories(cats.map((cat) => ({ id: cat.id, name: cat.name })));
      }
    } catch {
      toast.error("Không thể tải danh mục!");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Hàm gọi API lọc theo trạng thái
  const fetchProductsByStatus = useCallback(async (status: string) => {
    if (status === "") {
      setFilteredByStatusProducts([]);
      return;
    }
    
    setLoadingStatusFilter(true);
    try {
      const url = status === "1" ? "/products/filter/active" : "/products/filter/inactive";
      const res = await apiClientBase.get(url);
      const list = Array.isArray(res.data?.data) 
        ? (res.data.data as Array<IProduct & { status: boolean | number }>)
        : [];
      
      const processedList = list.map((item) => {
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
        } as IProduct & { is_active: boolean };
      });
      
      setFilteredByStatusProducts(processedList);
    } catch {
      toast.error("Không thể tải dữ liệu lọc theo trạng thái!");
      setFilteredByStatusProducts([]);
    } finally {
      setLoadingStatusFilter(false);
    }
  }, []);

  // Hàm gọi API lọc theo danh mục
  const fetchProductsByCategory = useCallback(async (categoryId: string | number) => {
    if (categoryId === "") {
      setFilteredByCategoryProducts([]);
      return;
    }
    
    setLoadingCategoryFilter(true);
    try {
      const res = await apiClientBase.get(`/products/category/${categoryId}`);
      const list = Array.isArray(res.data) 
        ? (res.data as Array<IProduct & { status: boolean | number }>)
        : [];
      
      const processedList = list.map((item) => {
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
        } as IProduct & { is_active: boolean };
      });
      
      setFilteredByCategoryProducts(processedList);
    } catch {
      toast.error("Không thể tải dữ liệu lọc theo danh mục!");
      setFilteredByCategoryProducts([]);
    } finally {
      setLoadingCategoryFilter(false);
    }
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
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClientBase.get(`/pagination/products?page=${currentPage}`);
      const list = Array.isArray(res.data?.data)
        ? (res.data.data as Array<IProduct & { status: boolean | number }>)
        : [];
      setProducts(
        list.map((item) => {
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
          } as IProduct & { is_active: boolean };
        })
      );
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
  }, [fetchProducts]);

  // Gọi API lọc theo trạng thái khi filterStatus thay đổi
  useEffect(() => {
    fetchProductsByStatus(filterStatus);
  }, [filterStatus, fetchProductsByStatus]);

  // Gọi API lọc theo danh mục khi filterCategory thay đổi
  useEffect(() => {
    fetchProductsByCategory(filterCategory);
  }, [filterCategory, fetchProductsByCategory]);

  // Gọi API sắp xếp theo lựa chọn (giá tăng/giảm, bán chạy)
  useEffect(() => {
    const fetchSorted = async () => {
      // Các trường hợp dùng API sort
      const useApi = sortOption === "price_asc" || sortOption === "price_desc" || sortOption === "sold_desc";
      if (!useApi) {
        setApiSortedProducts([]);
        return;
      }

      setLoadingSort(true);
      try {
        let url = "";
        if (sortOption === "price_asc") url = "/products/sort/asc";
        else if (sortOption === "price_desc") url = "/products/sort/desc";
        else if (sortOption === "sold_desc") url = "/products/most-sold";

        const res = await apiClientBase.get(url);
        const list = Array.isArray(res.data)
          ? (res.data as Array<IProduct & { status: boolean | number }>)
          : Array.isArray(res.data?.data)
            ? (res.data.data as Array<IProduct & { status: boolean | number }>)
            : [];

        const processed = list.map((item) => {
          let is_active = false;
          if (typeof item.status === "boolean") is_active = item.status === true;
          else if (typeof item.status === "number") is_active = item.status === 1;
          return {
            ...item,
            id_category: item.id_category ?? item.id_category,
            is_active,
          } as IProduct & { is_active: boolean };
        });
        setApiSortedProducts(processed);
      } catch {
        toast.error("Không thể sắp xếp dữ liệu!");
        setApiSortedProducts([]);
      } finally {
        setLoadingSort(false);
      }
    };

    fetchSorted();
  }, [sortOption]);

  // Tìm kiếm theo tên bằng API
  useEffect(() => {
    const debounced = setTimeout(async () => {
      const name = filterName.trim();
      if (name === "") {
        setSearchResults([]);
        return;
      }
      setLoadingSearch(true);
      try {
        const res = await apiClientBase.get(`/products/search?query=${encodeURIComponent(name)}&page=${currentPage}`);
        const list = Array.isArray(res.data?.data)
          ? (res.data.data as Array<IProduct & { status: boolean | number }>)
          : Array.isArray(res.data?.data?.data)
            ? (res.data.data.data as Array<IProduct & { status: boolean | number }>)
            : [];
        const processed = list.map((item) => {
          let is_active = false;
          if (typeof item.status === "boolean") is_active = item.status === true;
          else if (typeof item.status === "number") is_active = item.status === 1;
          return {
            ...item,
            id_category: item.id_category ?? item.id_category,
            is_active,
          } as IProduct & { is_active: boolean };
        });
        setSearchResults(processed);
        // cập nhật tổng trang nếu có
        const lastPage = res.data?.last_page ?? res.data?.data?.last_page;
        if (typeof lastPage === "number") setTotalPages(lastPage);
      } catch {
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);
    return () => {
      clearTimeout(debounced);
    };
  }, [filterName, currentPage]);

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
    } catch (err: unknown) {
      setModalState({
        open: true,
        title: "Lưu thất bại!",
        description: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Có lỗi xảy ra khi lưu sản phẩm.",
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
  const filteredProducts = (() => {
    // Nếu có từ khóa tìm kiếm, ưu tiên dữ liệu từ API search
    if (filterName.trim() !== "" && searchResults.length > 0) {
      return searchResults.filter(item => {
        const matchStatus = filterStatus === "" || (filterStatus === "1" ? item.is_active : !item.is_active);
        const matchCategory = filterCategory === "" || String(item.id_category) === String(filterCategory);
        return matchStatus && matchCategory;
      });
    }
    // Nếu có filter theo trạng thái, sử dụng dữ liệu từ API
    if (filterStatus !== "" && filteredByStatusProducts.length > 0) {
      return filteredByStatusProducts.filter(item => {
        const matchName = filterName.trim() === "" || item.name.toLowerCase().includes(filterName.trim().toLowerCase());
        const matchCategory = filterCategory === "" || String(item.id_category) === String(filterCategory);
        return matchName && matchCategory;
      });
    }
    
    // Nếu có filter theo danh mục, sử dụng dữ liệu từ API
    if (filterCategory !== "" && filteredByCategoryProducts.length > 0) {
      return filteredByCategoryProducts.filter(item => {
        const matchName = filterName.trim() === "" || item.name.toLowerCase().includes(filterName.trim().toLowerCase());
        const matchStatus = filterStatus === "" || (filterStatus === "1" ? item.is_active : !item.is_active);
        return matchName && matchStatus;
      });
    }
    
    // Nếu không có filter theo API, sử dụng logic cũ
    const baseList = apiSortedProducts.length > 0 ? apiSortedProducts : products;
    return baseList.filter(item => {
      const matchName = filterName.trim() === "" || item.name.toLowerCase().includes(filterName.trim().toLowerCase());
      const matchStatus = filterStatus === "" || (filterStatus === "1" ? item.is_active : !item.is_active);
      const matchCategory = filterCategory === "" || String(item.id_category) === String(filterCategory);
      return matchName && matchStatus && matchCategory;
    });
  })();

  const sortedProducts = (() => {
    const list = [...filteredProducts];
    switch (sortOption) {
      case "price_asc":
        return list.sort((a, b) => Number(a.price) - Number(b.price));
      case "price_desc":
        return list.sort((a, b) => Number(b.price) - Number(a.price));
      case "name_asc":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "name_desc":
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case "sold_desc":
        return list.sort((a, b) => Number(b.quantity_sold || 0) - Number(a.quantity_sold || 0));
      default:
        return list;
    }
  })();

  // Thêm useEffect để reset về trang 1 khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [filterName, filterStatus]);


  // Thêm hàm xử lý xem chi tiết
  const handleViewDetail = (product: IProduct) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  // Xử lý mở menu
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
      {/* Bộ lọc mobile */}
      <div className="flex items-center justify-between mb-2 md:hidden">
        <h2 className="text-xl font-bold">Quản lý Menu Món Ăn</h2>
        <button
          className="p-2 rounded-md border bg-white text-sm"
          onClick={() => setMobileFilterOpen(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 5h18M6 12h12M10 19h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      {/* Mobile search (outside modal) */}
      <div className="md:hidden mb-4">
        <input
          type="text"
          placeholder="Tìm theo tên món..."
          className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none"
          value={filterName}
          onChange={e => setFilterName(e.target.value)}
        />
      </div>
      {/* Bộ lọc desktop   */}
      <div className="hidden md:flex items-center gap-2 mb-4">
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
        <select
          className="border border-gray-300 px-2 h-8 rounded-md text-sm bg-white min-w-[170px]"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
          title="Sắp xếp"
        >
          <option value="default">Mặc định</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
          <option value="name_asc">Tên A-Z</option>
          <option value="name_desc">Tên Z-A</option>
          <option value="sold_desc">Bán chạy</option>
        </select>
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
      {/* Modal bộ lọc mobile */}
      <Modal isOpen={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} className="max-w-md">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Bộ lọc & Sắp xếp</h3>
            <button className="text-gray-500" onClick={() => setMobileFilterOpen(false)}>
              ✕
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Loại</label>
              <select
                className="border px-3 py-2 rounded w-full"
                value={String(filterCategory)}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="">Tất cả loại</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái</label>
              <select
                className="border px-3 py-2 rounded w-full"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="1">Đang bán</option>
                <option value="0">Ngừng bán</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sắp xếp</label>
              <select
                className="border px-3 py-2 rounded w-full"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
              >
                <option value="default">Mặc định</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
                <option value="name_asc">Tên A-Z</option>
                <option value="name_desc">Tên Z-A</option>
                <option value="sold_desc">Bán chạy</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              className="px-3 py-2 text-sm rounded-md border"
              onClick={() => {
                setFilterName("");
                setFilterCategory("");
                setFilterStatus("");
                setSortOption("default");
              }}
            >
              Đặt lại
            </button>
            <button
              className="px-4 py-2 text-sm rounded-md bg-[#3E2723] text-[#FAF3E0] hover:bg-[#D4AF37]"
              onClick={() => setMobileFilterOpen(false)}
            >
              Áp dụng
            </button>
          </div>
        </div>
      </Modal>
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
                    <img
                      width={400}
                      height={300}
                      src={selectedProduct.image}
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
                  {loading || loadingStatusFilter || loadingCategoryFilter || loadingSort || loadingSearch ? (
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
                    // Áp dụng sắp xếp đã chọn; nếu mặc định, giữ món mới nhất lên đầu
                    (sortOption === "default"
                      ? [...sortedProducts].sort((a, b) => Number(b.id) - Number(a.id))
                      : sortedProducts
                    ).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="px-4 py-3">
                          <div className="w-14 h-14 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                            {item.image ? (
                              <img
                                width={56}
                                height={56}
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
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
                              <img
                                width={56}
                                height={56}
                                src={item.image}
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
          Tiếp
        </button>
      </div>
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