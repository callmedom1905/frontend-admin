import React, { useState, useEffect, useRef } from "react";
import ApiClient from "@/lib/apiClient";
import { IProduct, ICategory } from "@/model/type";
import NotificationModal from "./NotificationModal";
import { useMediaQuery } from 'react-responsive';

export default function OrderForm({ tableId }: { tableId: string }) {
  const [menu, setMenu] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selected, setSelected] = useState<number | string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [orders, setOrders] = useState<{ id: number | string; name: string; quantity: number; price: number; image?: string; status?: string }[]>([]);
  const [reload, setReload] = useState(0);
  const [activeCategory, setActiveCategory] = useState<number | string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<{ id: number | string; name: string }[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | string>("");
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isDownSwipe) {
      setCartModalOpen(false);
    }
  };

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

  useEffect(() => {
    const savedOrders = localStorage.getItem(`pending_order_${tableId}`);
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders);
        if (parsedOrders.orders && Array.isArray(parsedOrders.orders)) {
          setOrders(parsedOrders.orders);
        }
      } catch (error) {
        console.error("Error loading saved orders:", error);
      }
    }
  }, [tableId]);

  // fetch dữ liệu
  useEffect(() => {   
    ApiClient.get("/product").then(res => {
      console.log("Products data:", res.data);
      const products = Array.isArray(res.data)
        ? res.data.filter((item: IProduct) => item.status === true)
        : [];
      setMenu(products);
      if (products.length > 0) setSelected(products[0].id);
    }).catch(error => {
      console.error("Error fetching products:", error);
    });

    ApiClient.get("/categories/all").then(res => {
      console.log("Categories data:", res.data);
      const cats = Array.isArray(res.data) ? res.data : [];
      setCategories(cats);
    });

    ApiClient.get("/payment-method").then(res => {
      const methods = Array.isArray(res.data) ? res.data : [];
      setPaymentMethods(methods);
      if (methods.length > 0) setSelectedPaymentMethod(methods[0].id);
    }).catch(error => {
      console.error("Error fetching payment methods:", error);
    });
  }, [tableId]);

  const fetchProductsByCategory = (categoryId: number | string | null) => {
    if (categoryId === null) {
      ApiClient.get("/product").then(res => {
        const products = Array.isArray(res.data)
          ? res.data.filter((item: IProduct) => item.status === true)
          : [];
        setMenu(products);
      });
    } else {
      ApiClient.get(`/products/category/${categoryId}`).then(res => {
        // API trả về { success, message, data }
        const products = res.data && Array.isArray(res.data)
          ? res.data.filter((item: IProduct) => item.status === true)
          : [];
        setMenu(products);
      });
    }
  };

  // Update localStorage
  const updateLocalStorageOrder = async (newOrders: any[]) => {
    const key = `pending_order_${tableId}`;
    const local = localStorage.getItem(key);
    let createdAt = new Date().toISOString();
    let order_id = undefined;

    if (local) {
      const prev = JSON.parse(local);
      createdAt = prev.created_at || createdAt;
      order_id = prev.order_id;
    }

    const orderData = {
      ...((order_id && { order_id }) || {}),
      tableId,
      orders: newOrders,
      created_at: createdAt,
      total_amount: newOrders.reduce((sum, order) => sum + (order.price * order.quantity), 0)
    };

    localStorage.setItem(key, JSON.stringify(orderData));

    // Nếu là reorder, đồng bộ backend ngay
    if (order_id) {
      try {
        // Gọi sync-items
        await ApiClient.post(`/orders/${order_id}/sync-items`, {
          items: newOrders.map(item => ({
            id_product: Number(item.id),
            quantity: Number(item.quantity)
          }))
        });
        // Gọi PATCH tổng tiền
        await ApiClient.put(`/orders/${order_id}`, {
          total_payment: orderData.total_amount
        });
      } catch (err) {
        console.error('Lỗi khi đồng bộ món ăn khi thêm/sửa:', err);
      }
    }
    return newOrders;
  };

  const handleSelectProduct = (id: number | string, increment: number = 1) => {
    setSelected(id);
    
    // Haptic feedback cho mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    setOrders((prev) => {
      const idx = prev.findIndex((o) => String(o.id) === String(id));
      let newOrders;

      if (idx !== -1) {
        if (increment < 0 && prev[idx].quantity + increment <= 0) {
          newOrders = prev.filter((o, i) => i !== idx);
        } else {
          newOrders = prev.map((o, i) =>
            i === idx
              ? { ...o, quantity: Math.max(1, o.quantity + increment) }
              : o
          );
        }
      } else if (increment > 0) {
        const item = menu.find((m) => String(m.id) === String(id));
        if (!item) return prev;
        newOrders = [
          ...prev,
          {
            id: item.id,
            name: item.name,
            quantity: 1,
            price: Number(item.price),
            image: item.image ?? undefined,
            status: item.status === true ? "Còn Hàng" : "Hết Hàng"
          },
        ];
      } else {
        return prev;
      }
      updateLocalStorageOrder(newOrders);
      return newOrders;
    });
  };

  const handleAdd = () => {
    const item = menu.find((m) => String(m.id) === String(selected));
    if (!item) return;

    setOrders((prev) => {
      const idx = prev.findIndex((o) => String(o.id) === String(selected));
      let newOrders;

      if (idx !== -1) {
        newOrders = [...prev];
        newOrders[idx].quantity += quantity;
      } else {
        newOrders = [
          ...prev,
          { 
            id: item.id, 
            name: item.name, 
            quantity, 
            price: Number(item.price), 
            image: item.image ?? undefined,
            status: item.status === true ? "Còn Hàng" : "Hết Hàng"
          },
        ];
      }

      updateLocalStorageOrder(newOrders);
      return newOrders;
    });

    setQuantity(1);
  };


  const handleRemove = (id: number | string) => {
    setOrders((prev) => {
      const newOrders = prev.filter((o) => String(o.id) !== String(id));
      updateLocalStorageOrder(newOrders);
      return newOrders;
    });
  };

  const handleConfirmOrder = async () => {
    if (orders.length === 0) return;
    // Lấy order_id từ localStorage nếu có
    const local = localStorage.getItem(`pending_order_${tableId}`);
    let order_id = undefined;
    let created_at = new Date().toISOString();
    if (local) {
      const prev = JSON.parse(local);
      order_id = prev.order_id;
      created_at = prev.created_at || created_at;
    }
    try {
      let orderRes;
      if (order_id) {
        // Nếu đã có order_id thì cập nhật trạng thái
        orderRes = await ApiClient.put(`/orders/${order_id}`, {
          status: 1,
          total_payment: orders.reduce((sum, o) => sum + o.price * o.quantity, 0),
        });
      } else {
        // Nếu chưa có order_id thì tạo mới
        const payload = {
          id_table: tableId,
          name_user: "Khách tại bàn",
          number_table: Number(tableId),
          capacity: 4,
          total_payment: orders.reduce((sum, o) => sum + o.price * o.quantity, 0),
          status: 1,
        };
        orderRes = await ApiClient.post("/orders", payload);
        order_id = orderRes.data?.data?.id || orderRes.data?.id;
        created_at = orderRes.data?.data?.created_at || orderRes.data?.created_at || created_at;
      }
      // Lưu lại vào localStorage
      localStorage.setItem(
        `pending_order_${tableId}`,
        JSON.stringify({
          order_id,
          tableId,
          orders,
          created_at,
          total_amount: orders.reduce((sum, o) => sum + o.price * o.quantity, 0),
        })
      );
      window.location.href = `/quan-ly-dat-ban/${tableId}`;
    } catch (err) {
      let msg = "Không thể xác nhận đơn hàng!";
      if (typeof err === "object" && err !== null) {
        if ('response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
          msg = (err.response.data as any).message;
        } else if ('message' in err) {
          msg = (err as any).message;
        }
      }
      alert(msg);
    }
  };

  const handleClearAll = () => {
    setOrders([]);
    localStorage.removeItem(`pending_order_${tableId}`);
  };

  const total = orders.reduce((sum, o) => sum + o.price * o.quantity, 0);

  const openCategoryModal = (categoryId: number | string) => {
    setActiveCategory(categoryId);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setActiveCategory(null);
  };

  // Lấy tất cả sản phẩm (không phân loại)
  const allProducts = Array.isArray(menu)
    ? menu.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const isMobile = useMediaQuery({ maxWidth: 767 });

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && cartModalOpen) {
        setCartModalOpen(false);
      }
    };

    if (cartModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [cartModalOpen]);

  return (
    <div className={`p-4 md:p-8 bg-white rounded-xl shadow-lg dark:bg-gray-800`}>
      <div className="mb-4">
        <button
          className="flex items-center gap-2 text-gray-800 font-semibold hover:underline bg-transparent border-none outline-none px-0 py-0"
          type="button"
          onClick={() => window.history.back()}
        >
          <svg width={22} height={22} fill="none" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Trở về
        </button>
      </div>
      <div className="mb-4 text-xl font-bold text-gray-800 dark:text-amber-50">Chọn món ăn</div>

      {/* Thanh tìm kiếm món ăn */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm món ăn..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Danh sách các button danh mục */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => {
            setActiveCategory(null);
            fetchProductsByCategory(null);
          }}
          className={`px-4 py-2 rounded-lg ${activeCategory === null ? 'bg-amber-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'}`}
        >
          Tất cả
        </button>
        {categories.filter(cat => cat.status === true).map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              fetchProductsByCategory(cat.id);
            }}
            className={`px-4 py-2 rounded-lg ${activeCategory === cat.id ? 'bg-amber-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Hiển thị tất cả sản phẩm */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-4 gap-6">
            {menu.length === 0 && (
              <div className="col-span-full text-gray-400 italic">Đang tải sản phẩm</div>
            )}
            {menu.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => {
              const isSelected = orders.some((o) => String(o.id) === String(item.id));
              const orderItem = orders.find((o) => String(o.id) === String(item.id));
              return (
                <div
                  key={item.id}
                  className={[
                    "border rounded-xl p-4 flex flex-col items-center shadow-md transition-all duration-200 hover:shadow-xl cursor-pointer dark:bg-gray-800",
                    isSelected
                      ? "border-amber-600"
                      : "border-gray-200 bg-white"
                  ].join(" ")}
                  onClick={() => { if (!orderItem) handleSelectProduct(item.id, 1) }}
                >
                  <img
                    src={
                      item.image?.startsWith("http") || item.image?.startsWith("/")
                        ? item.image
                        : `${item.image}`
                    }
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded mb-2 border"
                  />
                  <div className="font-medium text-center text-base text-gray-800 dark:text-amber-50">{item.name}</div>
                  <div className="text-sm text-gray-500 mb-1">{item.price.toLocaleString()} đ</div>
                  {orderItem ? (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        className="px-2 py-1 border text-black rounded-[8px] font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProduct(item.id, -1);
                        }}
                      >-</button>
                      <span className="font-semibold">{orderItem.quantity}</span>
                      <button
                        className="px-2 py-1 border text-black rounded-[8px] text-lg font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProduct(item.id, 1);
                        }}
                      >+</button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectProduct(item.id, 1);
                      }}
                      className="mt-2 px-3 py-1 rounded bg-amber-600 text-white text-sm font-semibold shadow"
                    >
                      Chọn
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Giỏ hàng cho desktop/tablet */}
        {!isMobile && (
          <div className="w-full md:w-100 flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-inner flex flex-col" style={{ minHeight: 1000 }}>
            <div>
              <div className="mb-4 text-lg font-bold text-gray-700 dark:text-amber-50">Bàn số: {tableId}</div>
              <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {orders.length > 0 && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Đã lưu vào giỏ hàng</span>
                  </div>
                )}
              </div>
              <ul className="list-none ml-0 max-h-100 overflow-y-auto mt-2">
                {orders.length === 0 ? (
                  <li className="text-gray-800 dark:text-amber-50">Chưa chọn món nào.</li>
                ) : (
                  orders.map((order, idx) => (
                    <li key={idx} className="flex items-center h-[50px] gap-3 mb-3 bg-white dark:bg-gray-800 rounded p-2 shadow">
                      <img
                        src={
                          order.image?.startsWith("http") || order.image?.startsWith("/")
                            ? order.image
                            : `/images/product/${order.image}`
                        }
                        alt={order.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <span className="flex-1 text-gray-600 text-sm truncate w-64 dark:text-amber-50">{order.name}</span>
                      <span className="text-sm text-gray-600 dark:text-amber-50">SL: {order.quantity}</span>
                      <span className="text-sm text-gray-600 dark:text-amber-50">{(order.price * order.quantity).toLocaleString()}đ</span>
                      <div className="flex items-center gap-1">
                        <button
                          className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(order.id);
                          }}
                        >
                          X
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
              <div className="mt-4 font-bold text-xl flex justify-between text-black dark:text-amber-50">
                <span>Tổng tiền:</span>
                <span className="text-red-600">{total.toLocaleString()}đ</span>
              </div>
            </div>
            <div className="flex gap-2 mt-8 sticky bottom-0 bg-gray-50 dark:bg-gray-800 pt-4 z-10 flex-col">
              {/* Payment method dropdown */}
              <div className="flex gap-2">
                <button
                  style={{
                    fontSize: "0.95rem",
                    padding: "6px 0",
                    borderRadius: 8,
                    background: "",
                    color: "#E6C67A",
                    border: "#E6C67A 1px solid",
                  }}
                  className="font-semibold w-1/2 hover:brightness-90"
                  onClick={handleClearAll}
                  disabled={orders.length === 0}
                  type="button"
                >
                  Xóa tất cả
                </button>
                <button
                  style={{
                    fontSize: "0.95rem",
                    padding: "6px 0",
                    borderRadius: 8,
                    background: "#3E2723",
                    color: "#FAF3E0",
                    border: "none",
                  }}
                  className="font-semibold w-1/2 hover:brightness-90"
                  onClick={handleConfirmOrder}
                  disabled={orders.length === 0}
                  type="button"
                >
                  Xác nhận order
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Nút nổi và popup cho mobile */}
        {isMobile && (
          <>
            {/* Nút nổi ở góc dưới phải */}
            <button
              className="fixed bottom-6 right-6 z-50 bg-amber-600 text-white rounded-full shadow-lg p-4 flex items-center gap-2 hover:bg-amber-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
              onClick={() => {
                setCartModalOpen(true);
                // Haptic feedback
                if ('vibrate' in navigator) {
                  navigator.vibrate(100);
                }
              }}
              title="Xem giỏ hàng"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="7" cy="21" r="1" fill="#fff"/>
                <circle cx="20" cy="21" r="1" fill="#fff"/>
              </svg>
              <span className="font-semibold hidden sm:inline">Giỏ hàng</span>
              {orders.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
                  {orders.length > 99 ? '99+' : orders.length}
                </span>
              )}
            </button>
            
            {/* Modal giỏ hàng */}
            {cartModalOpen && (
              <div 
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" 
                onClick={() => setCartModalOpen(false)}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                ref={modalRef}
              >
                <div 
                  className="w-full max-w-md bg-white dark:bg-gray-800 rounded-t-2xl p-6 shadow-2xl animate-slide-up" 
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header với drag indicator */}
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-xl font-bold text-gray-800 dark:text-amber-50 flex items-center gap-2">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="7" cy="21" r="1" fill="currentColor"/>
                        <circle cx="20" cy="21" r="1" fill="currentColor"/>
                      </svg>
                      Giỏ hàng ({orders.length})
                    </div>
                    <button 
                      onClick={() => setCartModalOpen(false)} 
                      className="text-gray-500 hover:text-gray-800 text-2xl p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* Danh sách món ăn */}
                  <div className="max-h-80 overflow-y-auto">
                    {orders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" className="mx-auto mb-4 text-gray-300">
                          <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="7" cy="21" r="1" fill="currentColor"/>
                          <circle cx="20" cy="21" r="1" fill="currentColor"/>
                        </svg>
                        <p>Chưa chọn món nào</p>
                        <p className="text-sm">Hãy chọn món ăn từ menu bên trên</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((order, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <img
                              src={order.image?.startsWith("http") || order.image?.startsWith("/") ? order.image : `/images/product/${order.image}`}
                              alt={order.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 dark:text-amber-50 truncate">{order.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {order.price.toLocaleString()}đ × {order.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-800 dark:text-amber-50">
                                {(order.price * order.quantity).toLocaleString()}đ
                              </p>
                              <button
                                className="mt-1 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                onClick={() => handleRemove(order.id)}
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Tổng tiền */}
                  {orders.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center text-lg font-bold text-gray-800 dark:text-amber-50">
                        <span>Tổng tiền:</span>
                        <span className="text-red-600 text-xl">{total.toLocaleString()}đ</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Các nút hành động */}
                  <div className="flex gap-3 mt-6">
                    <button
                      className="flex-1 px-4 py-3 border border-amber-500 text-amber-600 rounded-lg font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleClearAll}
                      disabled={orders.length === 0}
                      type="button"
                    >
                      Hủy đơn
                    </button>
                    <button
                      className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleConfirmOrder}
                      disabled={orders.length === 0}
                      type="button"
                    >
                      Thanh toán
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal hiển thị sản phẩm theo danh mục */}
      {/* Đã bỏ modal, không còn hiển thị boxup cho category */}

      <NotificationModal
        open={notification.open}
        title={notification.title}
        description={notification.description}
        emoji={notification.emoji}
        acceptText={notification.acceptText}
        rejectText={notification.rejectText}
        onAccept={notification.onAccept || (() => setNotification(prev => ({ ...prev, open: false })))}
        onReject={notification.onReject || (() => setNotification(prev => ({ ...prev, open: false })))}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}