"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ITable, TableStatusMap, NotificationModalState } from "@/model/type";
import { Be_Vietnam_Pro } from "next/font/google";
import ApiClient from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { FiPlus, FiEdit, FiTrash, FiEye, FiSearch, FiFilter, FiX } from "react-icons/fi";
import { Modal } from "../ui/modal/index";
import { ImageSelectorButton } from "@/components/file-manager";
import NotificationModal from "./NotificationModal";

const beVietnam = Be_Vietnam_Pro({
  subsets: ['vietnamese'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

// Map trạng thái bàn sang hiển thị và màu sắc tương ứng
const statusMap: TableStatusMap = {
  1: { label: "Trống", color: "text-green-600", bgColor: "bg-green-50" },
  2: { label: "Đang sử dụng", color: "text-amber-600", bgColor: "bg-amber-50" },
  3: { label: "Đã đặt trước", color: "text-blue-600", bgColor: "bg-blue-50" },
  4: { label: "Không sử dụng", color: "text-red-600", bgColor: "bg-red-50" },
};

// Lấy thông tin đơn hàng của bàn từ localStorage
function getOrderForTable(tableId: number) {
  if (typeof window === "undefined") return null;
  const order = localStorage.getItem(`pending_order_${tableId}`);
  return order ? JSON.parse(order) : null;
}

export default function BookTables() {
  const { user } = useAuth();
  
  // Các state quản lý dữ liệu
  const [tables, setTables] = useState<ITable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State cho tìm kiếm và lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | "all">("all");
  const [capacityFilter, setCapacityFilter] = useState<number | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  // State cho quản lý bàn (chỉ cho manager)
  const [formVisible, setFormVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [selectedTableForDetail, setSelectedTableForDetail] = useState<ITable | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // State cho quản lý bàn đã xóa
  const [showTrashed, setShowTrashed] = useState(false);
  const [trashedTables, setTrashedTables] = useState<ITable[]>([]);

  // State cho form thêm/sửa bàn
  const [formData, setFormData] = useState<Partial<ITable>>({
    table_number: 0,
    status: 1,
    image: "",
    description: "",
    capacity: 4,
    view: "",
    purpose: "",
  });

  // State cho notification modal
  const [notificationModal, setNotificationModal] = useState<NotificationModalState>({
    open: false,
    title: "",
    description: "",
    onAccept: () => {},
  });

  // Kiểm tra quyền
  const isManager = user?.id_role === 1;

  // Hàm lọc bàn theo điều kiện tìm kiếm
  const filteredTables = tables.filter((table) => {
    // Lọc theo từ khóa tìm kiếm (số bàn, mô tả)
    const searchMatch = searchTerm === "" || 
      table.table_number?.toString().includes(searchTerm) ||
      table.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.view?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.purpose?.toLowerCase().includes(searchTerm.toLowerCase());

    // Lọc theo trạng thái
    const statusMatch = statusFilter === "all" || table.status === statusFilter;

    // Lọc theo sức chứa
    const capacityMatch = capacityFilter === "all" || table.capacity === capacityFilter;

    return searchMatch && statusMatch && capacityMatch;
  });

  // Hàm reset tất cả bộ lọc
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCapacityFilter("all");
  };

  // Hàm kiểm tra có bộ lọc nào đang được áp dụng không
  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || capacityFilter !== "all";

  // Hàm lấy danh sách bàn từ API
  async function fetchTables() {
    try {
      setLoading(true);
      const response = await ApiClient.get("/tables");
      
      // Kiểm tra cấu trúc response
      console.log("API Response:", response);
      
      // Xử lý response theo cấu trúc từ backend
      const tablesData = response?.data || [];
      
      console.log("Dữ liệu bàn:", tablesData);
      setTables(tablesData);
      setError(null);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách bàn:", err);
      setError("Không thể tải danh sách bàn. Vui lòng thử lại sau.");
      setTables([]);
    } finally {
      setLoading(false);
    }
  }

// Hàm format ngày giờ dạng hh:mm dd/mm/yyyy
function formatDateTime(value?: string | null) {
  if (!value) return "Trống";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Trống";
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

  // Gọi API khi component được mount
  useEffect(() => {
    fetchTables();
  }, []);

  // Hàm lấy danh sách bàn đã xóa
  const fetchTrashedTables = async () => {
    try {
      const response = await ApiClient.get("/tables/trashed");
      const trashedData = response?.data || [];
      setTrashedTables(trashedData);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách bàn đã xóa:", err);
      setTrashedTables([]);
    }
  };

  // Hàm khôi phục bàn
  const handleRestoreTable = async (tableId: number) => {
    if (!isManager) {
      setNotificationModal({
        open: true,
        title: "Không có quyền",
        description: "Bạn không có quyền khôi phục bàn!",
        emoji: <span style={{ fontSize: 28 }}>🚫</span>,
        acceptText: "Đóng",
        onAccept: () => setNotificationModal({ ...notificationModal, open: false }),
      });
      return;
    }

    try {
      setProcessingAction(`restore-${tableId}`);
      await ApiClient.post(`/tables/${tableId}/restore`);
      setNotificationModal({
        open: true,
        title: "Thành công",
        description: "Khôi phục bàn thành công!",
        emoji: <span style={{ fontSize: 28 }}>✅</span>,
        acceptText: "Đóng",
        onAccept: () => {
          setNotificationModal({ ...notificationModal, open: false });
          fetchTrashedTables();
          fetchTables();
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Khôi phục bàn thất bại!";
      setNotificationModal({
        open: true,
        title: "Lỗi",
        description: errorMessage,
        emoji: <span style={{ fontSize: 28 }}>❌</span>,
        acceptText: "Đóng",
        onAccept: () => setNotificationModal({ ...notificationModal, open: false }),
      });
      console.error(error);
    } finally {
      setProcessingAction(null);
    }
  };

  // Các hàm xử lý CRUD cho bàn (chỉ cho manager)
  const handleAddTable = () => {
    if (!isManager) {
      setNotificationModal({
        open: true,
        title: "Không có quyền",
        description: "Bạn không có quyền thêm bàn mới!",
        emoji: <span style={{ fontSize: 28 }}>🚫</span>,
        acceptText: "Đóng",
        onAccept: () => setNotificationModal({ ...notificationModal, open: false }),
      });
      return;
    }
    setFormData({
      table_number: 0,
      status: 1,
      image: "",
      description: "",
      capacity: 4,
      view: "",
      purpose: "",
    });
    setEditId(null);
    setFormVisible(true);
  };

  const handleEditTable = (table: ITable) => {
    if (!isManager) {
      setNotificationModal({
        open: true,
        title: "Không có quyền",
        description: "Bạn không có quyền chỉnh sửa bàn!",
        emoji: <span style={{ fontSize: 28 }}>🚫</span>,
        acceptText: "Đóng",
        onAccept: () => setNotificationModal({ ...notificationModal, open: false }),
      });
      return;
    }
    setFormData({
      table_number: table.table_number || table.id,
      status: table.status,
      image: table.image || "",
      description: table.description || "",
      capacity: table.capacity,
      view: table.view || "",
      purpose: table.purpose || "",
    });
    setEditId(table.id);
    setFormVisible(true);
  };

  const handleViewTableDetail = (table: ITable) => {
    setSelectedTableForDetail(table);
    setDetailModalVisible(true);
  };

  const handleDeleteTable = async (tableId: number) => {
    if (!isManager) {
      setNotificationModal({
        open: true,
        title: "Không có quyền",
        description: "Bạn không có quyền xóa bàn!",
        emoji: <span style={{ fontSize: 28 }}>🚫</span>,
        acceptText: "Đóng",
        onAccept: () => setNotificationModal({ ...notificationModal, open: false }),
      });
      return;
    }

    setNotificationModal({
      open: true,
      title: "Xác nhận xóa",
      description: "Bạn có chắc muốn xóa bàn này?",
      emoji: <span style={{ fontSize: 28 }}>⚠️</span>,
      acceptText: "Xóa",
      rejectText: "Hủy",
      onAccept: async () => {
        setNotificationModal({ ...notificationModal, open: false });
        try {
          setProcessingAction(`delete-${tableId}`);
          await ApiClient.delete(`/tables/${tableId}`);
          setNotificationModal({
            open: true,
            title: "Thành công",
            description: "Xóa bàn thành công!",
            emoji: <span style={{ fontSize: 28 }}>✅</span>,
            acceptText: "Đóng",
            onAccept: () => {
              setNotificationModal({ ...notificationModal, open: false });
              fetchTables();
            },
          });
        } catch (error) {
          setNotificationModal({
            open: true,
            title: "Lỗi",
            description: "Xóa bàn thất bại!",
            emoji: <span style={{ fontSize: 28 }}>❌</span>,
            acceptText: "Đóng",
            onAccept: () => setNotificationModal({ ...notificationModal, open: false }),
          });
          console.error(error);
        } finally {
          setProcessingAction(null);
        }
      },
      onReject: () => setNotificationModal({ ...notificationModal, open: false }),
    });
  };

  const handleSubmitForm = async () => {
    try {
      setProcessingAction("submit");
      if (editId) {
        // Cập nhật bàn
        await ApiClient.put(`/tables/${editId}`, formData);
        setNotificationModal({
          open: true,
          title: "Thành công",
          description: "Cập nhật bàn thành công!",
          emoji: <span style={{ fontSize: 28 }}>✅</span>,
          acceptText: "Đóng",
          onAccept: () => {
            setNotificationModal({ ...notificationModal, open: false });
            setFormVisible(false);
            fetchTables();
          },
        });
      } else {
        // Thêm bàn mới
        await ApiClient.post("/tables", formData);
        setNotificationModal({
          open: true,
          title: "Thành công",
          description: "Thêm bàn thành công!",
          emoji: <span style={{ fontSize: 28 }}>✅</span>,
          acceptText: "Đóng",
          onAccept: () => {
            setNotificationModal({ ...notificationModal, open: false });
            setFormVisible(false);
            fetchTables();
          },
        });
      }
    } catch (error: unknown) {
      // Hiển thị lỗi trả về từ API (nếu có)
      let errorMessage = "Thao tác thất bại!";
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 'data' in error.response &&
          error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
        errorMessage = String(error.response.data.message);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setNotificationModal({
        open: true,
        title: "Lỗi",
        description: errorMessage,
        emoji: <span style={{ fontSize: 28 }}>❌</span>,
        acceptText: "Đóng",
        onAccept: () => setNotificationModal({ ...notificationModal, open: false }),
      });
      console.error(error);
    } finally {
      setProcessingAction(null);
    }
  };



  // Hiển thị trạng thái loading
  if (loading) {
    return (
      <div className={`${beVietnam.className} w-full max-w-7xl mx-auto bg-white dark:bg-gray-50 rounded-xl p-6 mt-6`}>
        <div className="flex justify-center items-center h-64">
          <p>Đang tải danh sách bàn...</p>
        </div>
      </div>
    );
  }

  // Hiển thị thông báo lỗi
  if (error) {
    return (
      <div className={`${beVietnam.className} w-full max-w-7xl mx-auto bg-white dark:bg-gray-50 rounded-xl p-6 mt-6`}>
        <div className="text-red-500">{error}</div>
        <button 
          onClick={fetchTables}
          className="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // Đổi trạng thái bàn thành "Đang sử dụng" nếu có món ăn trong localStorage
  const tablesWithLocalStatus = filteredTables.map((table) => {
    const tableOrder = getOrderForTable(table.id);
    // Nếu có món ăn trong localStorage thì đổi trạng thái thành 2
    if (tableOrder && tableOrder.orders && tableOrder.orders.length > 0) {
      return { ...table, status: 2 };
    }
    return table;
  });

  return (
    <div className={`${beVietnam.className} w-full max-w-7xl mx-auto bg-white dark:bg-gray-50 rounded-xl p-6 mt-6`}>
      {/* Phần header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {isManager ? "Quản lý bàn ăn" : "Danh sách bàn ăn"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isManager ? "Quản lý toàn bộ bàn trong nhà hàng" : "Xem danh sách bàn trong nhà hàng"}
          </p>
        </div>
          {isManager && (
          <div className="mt-4 md:mt-0 flex gap-2">
            <button
              onClick={handleAddTable}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#D4AF37] transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Thêm Bàn Mới
            </button>
            <button
              onClick={() => {
                setShowTrashed(!showTrashed);
                if (!showTrashed) {
                  fetchTrashedTables();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {showTrashed ? "Ẩn Bàn Đã Xóa" : "Xem Bàn Đã Xóa"}
            </button>
          </div>
        )}
      </div>

      {/* Phần tìm kiếm và lọc */}
      {!showTrashed && (
        <div className="mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            {/* Thanh tìm kiếm chính */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo số bàn, mô tả, cảnh quan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                    hasActiveFilters 
                      ? "border-amber-500 bg-amber-50 text-amber-700" 
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FiFilter className="w-4 h-4" />
                  Bộ lọc
                  {hasActiveFilters && (
                    <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      !
                    </span>
                  )}
                </button>
                
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>

            {/* Panel bộ lọc nâng cao */}
            {showFilters && (
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Bộ lọc trạng thái */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value={"true"}>Trống</option>
                      <option value={"false"}>Đang sử dụng</option>
                      <option value={"false"}>Đã đặt trước</option>
                      <option value={"false"}>Không sử dụng</option>
                    </select>
                  </div>

                  {/* Bộ lọc sức chứa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sức chứa
                    </label>
                    <select
                      value={capacityFilter}
                      onChange={(e) => setCapacityFilter(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="all">Tất cả sức chứa</option>
                      <option value={2}>2 người</option>
                      <option value={4}>4 người</option>
                      <option value={6}>6 người</option>
                      <option value={8}>8 người</option>
                      <option value={10}>10 người</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Hiển thị kết quả tìm kiếm */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Tìm thấy <span className="font-semibold text-gray-800">{tablesWithLocalStatus.length}</span> bàn
                    {tables.length !== tablesWithLocalStatus.length && (
                      <span className="text-gray-500"> trong tổng số {tables.length} bàn</span>
                    )}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Xóa tất cả bộ lọc
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

             {/* Danh sách bàn */}
       {!showTrashed && (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tablesWithLocalStatus.map((table) => {
          const tableOrder = getOrderForTable(table.id);
          const status = statusMap[table.status] || {
            label: statusMap[1].label,
            color: statusMap[1].color,
            bgColor: statusMap[1].bgColor,
          };

          const isBlocked = table.status === 4; // Không sử dụng
          
          return (
            <div 
              key={table.id}
              className={`rounded-xl overflow-hidden shadow-md border transition-all hover:shadow-lg ${
                isBlocked ? "border-red-200" : "border-gray-200"
              }`}
            >
              <div className={`p-5 ${isBlocked ? "bg-red-50" : status.bgColor}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">Bàn số: {table.table_number}</p>
                    <p className="text-sm text-gray-500 mt-1">Sức chứa: {table.capacity || "Không xác định"}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 py-1 rounded-full text-[10px] font-medium ${status.color} ${isBlocked ? "bg-red-100" : status.bgColor}`}>
                    {status.label === "Trống" && (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                    {status.label === "Đang sử dụng" && (
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    )}
                    {status.label === "Đã đặt trước" && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                    {status.label}
                  </span>
                </div>
                {tableOrder?.orders?.length > 0 && (
                      <div className="mt-2 bg-white p-3 rounded-lg shadow-sm">
                          <div className="text-xs font-semibold mb-2 text-gray-700">Món đã đặt:</div>
                          <div className="flex flex-col gap-2">
                            {tableOrder.orders.slice(0, 4).map((item: { name: string; quantity: number }, idx: number) => (
                              <div key={idx} className="flex justify-between">
                                <span className="text-xs text-gray-600 flex-1 truncate">{item.name}</span>
                                <span className="text-xs text-gray-500 ml-2">x{item.quantity}</span>
                              </div>
                            ))}
                          {tableOrder.orders.length > 3 && (
                            <div className="text-xs text-gray-500 mt-1">+{tableOrder.orders.length - 3} món khác</div>
                          )}
                        </div>
                      </div>
                    )}
              </div>
              
              {/* Các nút thao tác với bàn */}
              <div className="bg-white p-5 border-t border-gray-100">
                <div className="flex flex-col space-y-3">
                  <Link href={`/quan-ly-dat-ban/${table.id}/orders`}>
                    <button 
                      className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                        isBlocked 
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                          : "bg-[#D4AF37] hover:bg-[#D4AF37] text-white"
                      }`}
                      disabled={isBlocked}
                    >
                      Đặt món
                    </button>
                  </Link>
                  <Link href={`/quan-ly-dat-ban/${table.id}`}>
                    <button className="w-full py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition">
                      Xem đơn hàng
                    </button>
                  </Link>
                  
                  {/* Nút hành động cho manager */}
                  {isManager && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTableDetail(table);
                        }}
                        className="flex-1 py-1 px-2 text-xs border border-blue-300 hover:bg-blue-50 text-blue-700 rounded transition-colors"
                        title="Xem chi tiết"
                      >
                        <FiEye className="w-3 h-3 mx-auto" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTable(table);
                        }}
                        className="flex-1 py-1 px-2 text-xs border border-green-300 hover:bg-green-50 text-green-700 rounded transition-colors"
                        title="Chỉnh sửa"
                      >
                        <FiEdit className="w-3 h-3 mx-auto" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTable(table.id);
                        }}
                        disabled={processingAction === `delete-${table.id}`}
                        className="flex-1 py-1 px-2 text-xs border border-red-300 hover:bg-red-50 text-red-700 rounded transition-colors disabled:opacity-50"
                        title="Xóa bàn"
                      >
                        {processingAction === `delete-${table.id}` ? (
                          <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        ) : (
                          <FiTrash className="w-3 h-3 mx-auto" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
                     );
         })}
         </div>
       )}

       {/* Danh sách bàn đã xóa */}
       {showTrashed && (
         <div>
           <h3 className="text-lg font-semibold text-gray-800 mb-4">Bàn đã xóa</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {trashedTables.map((table) => (
               <div 
                 key={table.id}
                 className="rounded-xl overflow-hidden shadow-md border border-red-200 bg-red-50"
               >
                 <div className="p-5">
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="text-sm text-gray-600">Bàn số: {table.table_number || "Không xác định"}</p>
                       <p className="text-sm text-gray-500 mt-1">Sức chứa: {table.capacity || "Không xác định"}</p>
                     </div>
                     <span className="flex items-center gap-1.5 py-1 rounded-full text-[10px] font-medium text-red-600 bg-red-100">
                       <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                       Đã xóa
                     </span>
                   </div>
                   {table.description && (
                     <p className="text-sm text-gray-600 mt-2">{table.description}</p>
                   )}
                 </div>
                 
                 <div className="bg-white p-5 border-t border-gray-100">
                   <div className="flex gap-2">
                     <button
                       onClick={() => handleRestoreTable(table.id)}
                       disabled={processingAction === `restore-${table.id}`}
                       className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                       title="Khôi phục bàn"
                     >
                       {processingAction === `restore-${table.id}` ? (
                         <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                       ) : (
                         "Khôi phục"
                       )}
                     </button>
                   </div>
                 </div>
               </div>
             ))}
             {trashedTables.length === 0 && (
               <div className="col-span-full text-center py-8 text-gray-500">
                 Không có bàn nào đã xóa
               </div>
             )}
           </div>
         </div>
       )}

      {/* Modal Form Thêm/Sửa Bàn */}
      {formVisible && (
        <Modal isOpen={formVisible} onClose={() => setFormVisible(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editId ? "Chỉnh sửa bàn" : "Thêm bàn mới"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số bàn *
                </label>
                <input
                  type="number"
                  value={formData.table_number || ""}
                  onChange={(e) => setFormData({...formData, table_number: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Nhập số bàn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sức chứa *
                </label>
                <input
                  type="number"
                  value={formData.capacity || ""}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Nhập sức chứa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Nhập mô tả bàn"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={formData.status || 1}
                  onChange={(e) => setFormData({...formData, status: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value={1}>Trống</option>
                  <option value={2}>Đang sử dụng</option>
                  <option value={3}>Đã đặt trước</option>
                  <option value={4}>Không sử dụng</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh
                </label>
                  <ImageSelectorButton
                  selectedImage={formData.image || ""}
                  onImageSelect={(imagePath) => setFormData({...formData, image: imagePath})}
                  buttonClassName="w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setFormVisible(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitForm}
                disabled={processingAction === "submit"}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {processingAction === "submit" ? "Đang xử lý..." : (editId ? "Cập nhật" : "Thêm mới")}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Chi Tiết Bàn */}
      {detailModalVisible && selectedTableForDetail && (
        <Modal isOpen={detailModalVisible} onClose={() => setDetailModalVisible(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">Chi tiết bàn</h3>
            <div className="space-y-4">
              {selectedTableForDetail.image ? (
                <div>
                  <img
                    src={selectedTableForDetail.image}
                    alt={`Bàn ${selectedTableForDetail.table_number || selectedTableForDetail.id}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 text-sm">
                  Hình ảnh trống
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Số bàn</label>
                  <p className="text-sm text-gray-900">{selectedTableForDetail.table_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Sức chứa</label>
                  <p className="text-sm text-gray-900">{selectedTableForDetail.capacity} người</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Trạng thái</label>
                  <p className="text-sm text-gray-900">{statusMap[selectedTableForDetail.status]?.label || "Không xác định"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Mô tả</label>
                  <p className="text-sm text-gray-900">{selectedTableForDetail.description || "Trống"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Cảnh quan</label>
                  <p className="text-sm text-gray-900">{selectedTableForDetail.view || "Trống"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Mục đích</label>
                  <p className="text-sm text-gray-900">{selectedTableForDetail.purpose || "Trống"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Giờ bắt đầu</label>
                  <p className="text-sm text-gray-900">{formatDateTime(selectedTableForDetail.start_time)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Giờ kết thúc</label>
                  <p className="text-sm text-gray-900">{formatDateTime(selectedTableForDetail.end_time)}</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => setDetailModalVisible(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Notification Modal */}
      <NotificationModal
        open={notificationModal.open}
        title={notificationModal.title}
        description={notificationModal.description}
        emoji={notificationModal.emoji}
        acceptText={notificationModal.acceptText}
        rejectText={notificationModal.rejectText}
        onAccept={notificationModal.onAccept}
        onReject={notificationModal.onReject}
        onClose={() => setNotificationModal({ ...notificationModal, open: false })}
      />
    </div>
  );
}