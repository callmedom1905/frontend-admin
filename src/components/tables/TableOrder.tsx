"use client"
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { IOrder, IOrderItem } from "../../model/type";

// Type definitions for API responses
interface ApiResponse<T> {
  data: T;
}
import { Modal } from "../ui/modal";
import { Be_Vietnam_Pro } from "next/font/google";
import apiClientBase from "@/lib/apiClient";
import NotificationModal from "./NotificationModal";

const beVietnam = Be_Vietnam_Pro({
  subsets: ['vietnamese'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export default function BasicTableOne() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [orderLoading, setOrderLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState<IOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;
  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: '1', label: 'Đặt trước' },
    { value: '2', label: 'Đã xác nhận' },
    { value: '3', label: 'Hoàn thành' },
    { value: '4', label: 'Đã hủy' },
  ];

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

  const [allOrders, setAllOrders] = useState<IOrder[]>([]);

  const fetchOrders = async () => {
    try {
      setOrderLoading(true);
      setError(null);
      const response = await apiClientBase.get('/orders');
      setAllOrders(response.data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Không thể tải danh sách hóa đơn. Vui lòng thử lại.");
    } finally {
      setOrderLoading(false);
    }
  };

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        setOrderLoading(true);
        setError(null);
        const response = await apiClientBase.get('/orders');
        setAllOrders(response.data || []);
      } catch (err) {
        setError('Không thể tải danh sách hóa đơn. Vui lòng thử lại.');
      } finally {
        setOrderLoading(false);
      }
    };
    fetchAllOrders();
  }, []);

  // Sắp xếp hóa đơn mới nhất lên đầu, rồi phân trang frontend
  const sortedOrders = [...allOrders].sort((a, b) => {
    if (a.created_at && b.created_at) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return Number(b.id || 0) - Number(a.id || 0);
  });
  const totalPages = Math.ceil(sortedOrders.length / perPage);
  const pagedOrders = sortedOrders.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Less strict filtering - only require id
  const validOrders = pagedOrders.filter(order => order.id);

  const filteredOrders = [...validOrders]
    .filter(order => {
      // Filter by status
      const statusMatch = filterStatus === "" || 
      order.status?.toString() === filterStatus;
      
      // Filter by search query
      const searchMatch = 
        searchQuery === "" || 
        order.name_user?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        order.phone?.includes(searchQuery) || 
        order.id?.toString().includes(searchQuery);
      
      return statusMatch && searchMatch;
    });

  const handleShowDetail = async (order: IOrder) => {
    try {
      setShowModal(true);
      setDetailLoading(true);
      const response = await apiClientBase.get(`/orders/${order.id}`) as ApiResponse<IOrder>;
      let detail = response.data;
      // Kiểm tra nếu là Đặt trước và đã quá hạn thì tự động hủy
      if (detail.status === 1 && detail.date) {
        // Ghép date và time nếu có, nếu không có time thì mặc định 23:59:59
        let dateTimeStr = detail.date;
        if (detail.time) {
          dateTimeStr += 'T' + detail.time;
        } else {
          dateTimeStr += 'T23:59:59';
        }
        const orderDate = new Date(dateTimeStr);
        const now = new Date();
        if (orderDate < now) {
          // Đã quá hạn, cập nhật trạng thái về Đã hủy
          await apiClientBase.put(`/orders/${detail.id}`, { status: 4 });
          detail = { ...detail, status: 4 };
        }
      }
      setDetailOrder(detail);
    } catch (err) {
      console.error("Error fetching order details:", err);
      setNotification({
        open: true,
        title: "Lỗi",
        description: "Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.",
        emoji: <span style={{ fontSize: 28 }}>❌</span>,
        acceptText: "Đóng",
        onAccept: () => setNotification(prev => ({ ...prev, open: false }))
      });
      setDetailOrder(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setDetailOrder(null);
  };

  const ActionButton = ({ onView }: { onView: () => void }) => (
    <button
      className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-100 transition"
      onClick={onView}
      title="Xem chi tiết"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    </button>
  );

  return (
    <div className={`${beVietnam.className} p-4`}>
      <div className="flex flex-col mb-4">
        <h2 className="text-xl font-bold text-black">Quản lý hóa đơn</h2>
        <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, SĐT, ID..."
              className="border px-3 py-2 rounded text-sm w-full sm:w-auto min-w-[180px] "
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Custom Dropdown for Status Filter */}
          <div className="relative w-full sm:w-auto min-w-[140px]">
            <button
              type="button"
              className="border px-3 py-2 rounded text-sm w-full flex items-center justify-between bg-white"
              onClick={() => setDropdownOpen((open) => !open)}
            >
              {statusOptions.find(opt => opt.value === filterStatus)?.label || 'Tất cả trạng thái'}
              <svg className="ml-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdownOpen && (
              <ul className="absolute left-0 mt-2 w-full bg-white border rounded shadow z-10 py-2">
                {statusOptions.map((option) => (
                  <li
                    key={option.value}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${filterStatus === option.value ? 'font-bold text-black' : 'text-gray-800'}`}
                    onClick={() => {
                      setFilterStatus(option.value);
                      setDropdownOpen(false);
                    }}
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 w-[50px]">ID</TableCell>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 min-w-[120px]">Tên khách</TableCell>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 min-w-[110px]">Điện thoại</TableCell>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 min-w-[100px]">Ngày</TableCell>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 w-[80px]">Số bàn</TableCell>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 w-[90px]">Số người</TableCell>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 min-w-[120px]">Trạng thái</TableCell>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 min-w-[110px]">Tổng tiền</TableCell>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 min-w-[100px]">Voucher</TableCell>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 w-[80px]">Tiền cọc</TableCell>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 min-w-[120px]">Ngày tạo</TableCell>
              <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 w-[50px]">Hành Động</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderLoading ? (
              <TableRow>
                <TableCell className="text-center py-6">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-6">
                  {searchQuery || filterStatus 
                    ? "Không tìm thấy hóa đơn phù hợp" 
                    : "Không có dữ liệu hóa đơn"}
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50 text-center">
                  <TableCell className="px-4 py-3 text-sm">{order.id}</TableCell>
                  <TableCell className="px-4 py-3 text-sm">{order.name_user || "N/A"}</TableCell>
                  <TableCell className="px-4 py-3 text-sm">{order.phone || "N/A"}</TableCell>
                  <TableCell className="px-4 py-3 text-sm">
                    {order.date ? new Date(order.date).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-center">
                    {order.tables && order.tables.length > 0 ? (
                       (() => {
                         const tableNumbers = order.tables.map((t) => t.table_number);
                        const uniqueTableNumbers = [...new Set(tableNumbers)];
                        return (
                          <span
                            title={`Bàn số ${uniqueTableNumbers.join(', ')}`}
                            style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                          >
                            {uniqueTableNumbers.join(', ')}
                          </span>
                        );
                      })()
                    ) : (
                      order.id_table || "N/A"
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-center">
                    {order.capacity || "N/A"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${order.status === 3 ? "bg-blue-100 text-blue-700" :
                        order.status === 2 ? "bg-green-100 text-green-700" :
                        order.status === 1 ? "bg-gray-100 text-gray-700" :
                        "bg-red-100 text-red-700"}
                    `}>
                      {order.status === 1 ? "Đặt trước" :
                      //  order.status === 2 ? "Đã xác nhận" :
                       order.status ===2 ? "Hoàn thành" : "Đã hủy"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm font-medium">
                    {order.total_payment && !isNaN(Number(order.total_payment))
                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(order.total_payment))
                      : "N/A"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm">
                    {order.id_voucher ? (
                      <div className="text-xs">
                        <div className="font-medium text-green-600">{order.id_voucher}</div>
                        {order.voucher_discount_amount && (
                          <div className="text-red-500">
                            -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(order.voucher_discount_amount))}
                          </div>
                        )}
                      </div>
                    ) : (
                      "Không có"
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-center">
                    {order.deposit_amount && !isNaN(Number(order.deposit_amount))
                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(order.deposit_amount))
                      : "N/A"}    
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm">
                    {order.created_at ? new Date(order.created_at).toLocaleString() : "N/A"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <ActionButton onView={() => handleShowDetail(order)} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination UI */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Trước
        </button>
        {[...Array(totalPages)].map((_, idx) => {
          const pageNumber = idx + 1;
          return (
            <button
              key={idx}
              className={`px-3 py-1 rounded border ${
                currentPage === pageNumber 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => setCurrentPage(pageNumber)}
            >
              {pageNumber}
            </button>
          );
        })}
        <button
          className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Tiếp
        </button>
      </div>

      {showModal && (
        <Modal isOpen={showModal} onClose={handleCloseModal} className="max-w-2xl">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl mx-auto border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {detailLoading
                  ? "Đang tải chi tiết hóa đơn..."
                  : detailOrder
                    ? `Chi tiết hóa đơn #${detailOrder.id}`
                    : "Không tìm thấy hóa đơn"}
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600 transition"
                onClick={handleCloseModal}
                aria-label="Đóng"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {detailLoading ? (
              <div className="py-10 text-center text-gray-500">Đang tải dữ liệu...</div>
            ) : detailOrder ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <div><span className="font-medium">Tên khách hàng:</span> {detailOrder.name_user || "N/A"}</div>
                    <div><span className="font-medium">Điện thoại:</span> {detailOrder.phone || "N/A"}</div>
                    <div><span className="font-medium">Ngày đặt:</span> {detailOrder.date ? new Date(detailOrder.date).toLocaleString() : "N/A"}</div>
                    <div><span className="font-medium">Bàn đã đặt:</span> {detailOrder.tables && detailOrder.tables.length > 0 ? (() => {
                       const tableNumbers = detailOrder.tables.map((t) => t.table_number);
                      const uniqueTableNumbers = [...new Set(tableNumbers)];
                      return uniqueTableNumbers.map(num => `Bàn số ${num}`).join(', ');
                    })() : (detailOrder.id_table ? `Bàn số ${detailOrder.id_table}` : "N/A")}</div>
                  </div>
                  <div className="space-y-2">
                    <div><span className="font-medium">Số người:</span> {detailOrder.capacity || "N/A"}</div>
                    <div>
                      <span className="font-medium">Trạng thái:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium
                        ${detailOrder.status === 3 ? "bg-green-100 text-green-700" :
                          detailOrder.status === 2 ? "bg-blue-100 text-blue-700" :
                          detailOrder.status === 1 ? "bg-gray-100 text-gray-700" :
                          "bg-red-100 text-red-700"}
                      `}>
                        {detailOrder.status === 1 ? "Đặt trước" :
                         detailOrder.status === 2 ? "Đã xác nhận" :
                         detailOrder.status === 3 ? "Hoàn thành" : "Đã hủy"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t pt-4">
                  <h3 className="font-medium text-lg mb-4">Danh sách món ăn</h3>
                  {detailOrder.order_items && detailOrder.order_items.length > 0 ? (
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                      {detailOrder.order_items.map((item: IOrderItem, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-16 h-16 object-cover rounded-md"
                              />
                            )}
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-gray-600">
                                Số lượng: {item.quantity_sold}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Tổng: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity_sold)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Không có món ăn nào trong đơn hàng</p>
                  )}
                </div>

                <div className="mt-6 border-t pt-4">
                  {detailOrder.voucher_code && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2">Thông tin Voucher</h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Mã voucher:</span> <span className="text-green-600 font-bold">{detailOrder.voucher_code}</span></div>
                        {detailOrder.original_total_payment && (
                          <div><span className="font-medium">Tổng tiền gốc:</span> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(detailOrder.original_total_payment))}</div>
                        )}
                        {detailOrder.voucher_discount_amount && (
                          <div><span className="font-medium">Giảm giá:</span> <span className="text-red-600 font-bold">-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(detailOrder.voucher_discount_amount))}</span></div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Tổng tiền:</span>
                    <span className="text-lg font-bold">
                      {detailOrder.total_payment && !isNaN(Number(detailOrder.total_payment))
                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(detailOrder.total_payment))
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Tiền cọc:</span>
                    <span className="text-lg font-bold">
                      {detailOrder.deposit_amount && !isNaN(Number(detailOrder.deposit_amount))
                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(detailOrder.deposit_amount))
                        : "-"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  {detailOrder.status === 1 && (
                    <button
                    className="bg-green-500 text-white px-6 py-2 rounded-md font-medium transition"
                    onClick={() => {
                      // Lưu order_items vào localStorage dạng pending order
                      if (detailOrder && detailOrder.order_items && detailOrder.order_items.length > 0) {
                        const pendingOrder = {
                          order_id: detailOrder.id, // Lưu mã đơn hàng gốc
                          orders: detailOrder.order_items.map((item: IOrderItem) => ({
                            id: item.id_product || item.id,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity_sold,
                          })),
                          created_at: new Date().toISOString(),
                        };
                        // Lưu theo số bàn
                        const tableId = detailOrder.id_table;
                        if (tableId) {
                          localStorage.setItem(`pending_order_${tableId}`, JSON.stringify(pendingOrder));
                          window.location.href = `/quan-ly-dat-ban/${tableId}`;
                        }
                      }
                    }}
                  >
                    Thanh Toán
                  </button>
                  )}
                  {detailOrder && detailOrder.status === 1 && (
                    <button
                      className="bg-amber-400 text-white px-6 py-2 rounded-md font-medium transition"
                      onClick={() => {
                        // Lưu order_items vào localStorage dạng pending order
                        if (detailOrder && detailOrder.order_items && detailOrder.order_items.length > 0) {
                          const pendingOrder = {
                            order_id: detailOrder.id, // Lưu mã đơn hàng gốc
                            orders: detailOrder.order_items.map((item: IOrderItem) => ({
                              id: item.id_product || item.id, // id_product ưu tiên, fallback id
                              name: item.name,
                              price: item.price,
                              quantity: item.quantity_sold,
                            })),
                            created_at: new Date().toISOString(),
                          };
                          // Lưu theo số bàn
                          const tableId = detailOrder.id_table;
                          if (tableId) {
                            localStorage.setItem(`pending_order_${tableId}`, JSON.stringify(pendingOrder));
                            // Chuyển hướng sang trang AdTables
                            window.location.href = `/quan-ly-dat-ban/${tableId}/orders`;
                          }
                        }
                      }}
                    >
                     Thêm món
                    </button>
                  )}
                  <button
                    className="bg-[#3E2723] text-[#FAF3E0] px-6 py-2 rounded-md font-medium transition"
                    onClick={handleCloseModal}
                  >
                    Đóng
                  </button>
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-red-500">Không tìm thấy hóa đơn</div>
            )}
          </div>
        </Modal>
      )}

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
    </div>
  );
}