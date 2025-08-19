"use client"
import React, { useEffect, useState } from "react";
import Link from "next/link";
import data from "@/model/data.json";
import { ITable, IProduct, IVoucherExtended, OrderItem, TotalOrderItem } from "@/model/type";
import ApiClient from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import NotificationModal from "./NotificationModal";

export interface IOrder {
  id: number;
  id_voucher?: number | null;
  voucher_code?: string | null;
  voucher_discount_amount?: number | null;
  original_total_payment?: number | null;
  id_user: number;
  id_table: number;
  name_user: string;
  phone?: string | null;
  time?: string | null;
  date?: string | null;
  number_table: number;
  total_payment?: number;
  deposit_amount?: number;
  capacity: number;
  status?: number;
  payment?: number;
  status_deposit?: number;
  created_at?: string;
  updated_at?: string;
  order_items?: IOrderItem[];
  voucher?: IVoucherExtended; // Thêm voucher relationship
}

export interface IOrderItem {
  id: number;
  id_order: number;
  id_product: number;
  id_user: number;
  name: string;
  image: string;
  price: number;
  status: number;
  meta_description: string;
  detail_description: string;
  quantity_sold: number;
  created_at?: string;
  updated_at?: string;
}

export interface IPaymentMethod {
  id: number;
  payment_method: string;
  payment_status: number;
  id_user: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface AdTablesProps {
  tableId: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface TotalOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function AdTables({ tableId }: AdTablesProps) {
  const { user } = useAuth();
  
  // State cơ bản
  const [table, setTable] = useState<ITable | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<IPaymentMethod[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{ order_id?: number; orders: OrderItem[]; created_at?: string } | null>(null);
  const [reload, setReload] = useState(0);
  
  // State cho tính toán voucher
  const [voucherDiscount, setVoucherDiscount] = useState<number>(0);
  const [originalTotal, setOriginalTotal] = useState<number>(0);
  const [finalTotal, setFinalTotal] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [currentOrder, setCurrentOrder] = useState<IOrder | null>(null);
  
  // State cho notification
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

  // State cho SePay
  const [sepayPayment, setSepayPayment] = useState<{ qr_code?: string; payment_url?: string } | null>(null);
  const [isSePayPending, setIsSePayPending] = useState(false);
  const [isSePayQRVisible, setIsSePayQRVisible] = useState(false);
  const [orderIdForSePay, setOrderIdForSePay] = useState<number | null>(null);
  const [isWaitingSePay, setIsWaitingSePay] = useState(false);
  const [canConfirmSePay, setCanConfirmSePay] = useState(false);
  const pollingRef = React.useRef<NodeJS.Timeout | null>(null);

  // Lấy thông tin bàn từ API
  useEffect(() => {
    const fetchTable = async () => {
      try {
        const response = await ApiClient.get(`/tables/${tableId}`);
        const tableData = response.data || response;
        
        if (tableData) {
          setTable({
            ...tableData,
            number_table: tableData.number_table || Number(tableId), 
            capacity: tableData.capacity || 4,
          });
        } else {
          console.error("Invalid table data received");
          setTable(null);
        }
      } catch (error) {
        console.error("Failed to fetch table:", error);
        setTable(null);
      }
    };
    fetchTable();
  }, [tableId]);

  // Lấy phương thức thanh toán
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const data = await ApiClient.get('/payment-method');
        const activeMethods = (data.data || []).filter((method: IPaymentMethod) => method.payment_status === 1);
        setPaymentMethods(activeMethods);

        if (activeMethods.length > 0) {
          setPaymentMethod(String(activeMethods[0].id));
        }
      } catch (error) {
        console.error("Failed to fetch payment methods:", error);
        setPaymentMethods([
          { id: 1, payment_method: "Tiền mặt", payment_status: 1, id_user: 1 },
          { id: 2, payment_method: "Chuyển khoản", payment_status: 1, id_user: 1 },
          { id: 3, payment_method: "Ví Momo", payment_status: 1, id_user: 1 }
        ]);
      }
    };
    
    fetchPaymentMethods();
  }, []);

  // Lấy order tạm từ localStorage
  useEffect(() => {
    const local = localStorage.getItem(`pending_order_${tableId}`);
    if (local) {
      setPendingOrder(JSON.parse(local));
    }
  }, [tableId, reload]);

  // Lấy dữ liệu order từ API
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        // Thử lấy orders theo table ID
        const response = await ApiClient.get(`/orders/table/${tableId}`);
        const orders = response.data?.data || [];
        console.log('API Response orders:', orders); // Debug log
        
        // Nếu không có orders từ API, thử các cách khác
        if (orders.length === 0) {
          // Thử lấy order theo ID từ pendingOrder
          if (pendingOrder?.order_id) {
            console.log('Trying to fetch order by ID:', pendingOrder.order_id);
            const orderResponse = await ApiClient.get(`/orders/${pendingOrder.order_id}`);
            const orderData = orderResponse.data?.data || orderResponse.data;
            if (orderData) {
              console.log('Order by ID:', orderData);
              orders.push(orderData);
            }
          }
          
          // Thử lấy tất cả orders và filter theo table
          if (orders.length === 0) {
            console.log('Trying to fetch all orders and filter by table');
            const allOrdersResponse = await ApiClient.get('/orders');
            const allOrders = allOrdersResponse.data?.data || [];
            const tableOrders = allOrders.filter((order: any) => 
              order.id_table == tableId || order.number_table == tableId
            );
            console.log('Filtered orders:', tableOrders);
            if (tableOrders.length > 0) {
              orders.push(...tableOrders);
            }
          }
        }
        
        if (orders.length > 0) {
          const latestOrder = orders[0];
          console.log('Latest order data:', latestOrder); // Debug log
          setCurrentOrder(latestOrder);
          
          // Set voucher discount và deposit amount từ API data
          const voucherDisc = Number(latestOrder.voucher_discount_amount) || 0;
          const deposit = Number(latestOrder.deposit_amount) || 0;
          const originalTotal = Number(latestOrder.original_total_payment) || 0;
          
          console.log('Setting values:', { voucherDisc, deposit, originalTotal }); // Debug log
          
          setVoucherDiscount(voucherDisc);
          setDepositAmount(deposit);
          setOriginalTotal(originalTotal);
          
          // Tính final total từ dữ liệu API
          const calculatedFinal = Math.max(0, originalTotal - voucherDisc - deposit);
          setFinalTotal(calculatedFinal);
          
          console.log('Calculated final total:', calculatedFinal); // Debug log
        }
      } catch (error) {
        console.error('Error fetching order data:', error);
        // Không throw error, chỉ log để không làm crash component
      }
    };

    fetchOrderData();
  }, [tableId, pendingOrder?.order_id]);

  // Hàm tính toán voucher discount
  const calculateVoucherDiscount = (subtotal: number, voucher: any): number => {
    if (!voucher || !voucher.discount_type || !voucher.discount_value) {
      return 0;
    }

    // Kiểm tra điều kiện giá tối thiểu
    if (voucher.min_price && subtotal < voucher.min_price) {
      return 0;
    }

    let discount = 0;
    if (voucher.discount_type === 1) {
      // Giảm giá theo phần trăm
      discount = Math.round((subtotal * voucher.discount_value) / 100);
    } else if (voucher.discount_type === 2) {
      // Giảm giá cố định
      discount = voucher.discount_value;
    }

    return Math.min(discount, subtotal); // Không giảm quá tổng tiền
  };

    // Hàm tính lại tổng tiền khi thay đổi món ăn
  const recalculateTotals = (items: any[], order: any) => {
    console.log('recalculateTotals called with:', { items: items?.length, order }); // Debug log
    
    // Chỉ set voucher discount và deposit amount từ API, không thay đổi subtotal
    if (order?.deposit_amount) {
      const deposit = Number(order.deposit_amount);
      setDepositAmount(deposit);
      console.log('Set deposit from order:', deposit); // Debug log
    }

    if (order?.voucher_discount_amount) {
      const voucherDisc = Number(order.voucher_discount_amount);
      setVoucherDiscount(voucherDisc);
      console.log('Set voucher discount from order:', voucherDisc); // Debug log
    } else if (order?.id_voucher && order?.voucher) {
      // Fallback: tính toán voucher discount nếu chưa có từ API
      const itemsSubtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const voucherDisc = calculateVoucherDiscount(itemsSubtotal, order.voucher);
      setVoucherDiscount(voucherDisc);
      console.log('Calculated voucher discount:', voucherDisc); // Debug log
    }

    console.log('recalculateTotals completed'); // Debug log
  };

  // Lấy order từ static data (fallback)
  const orders = (data.orders as any[])
    .filter(order => order.id_table == tableId && (
      order.status === "processing" ||
      order.status === "occupied" ||
      order.status === "reserved"
    ));
  let order = orders[0];
  
  const productsMap = Object.fromEntries(
    (data.products as any[]).map(p => [
      String(p.id),
      {
        ...p,
        id_category: p.category_id,
      }
    ])
  );
  
  let orderProducts = order?.products || [];
  let orderItems = orderProducts.map((item: any) => {
    const product = productsMap[item.product_id];
    return {
      id: item.product_id,
      name: product?.name || "Sản phẩm",
      price: product?.price || 0,
      quantity: item.quantity,
    };
  });

  // Xử lý dữ liệu order items TRƯỚC KHI tính toán
  if (pendingOrder && order) {
    const map = new Map<string, any>();

    orderItems.forEach((item: OrderItem) => {
      map.set(String(item.id), { ...item });
    });
    pendingOrder.orders.forEach((item: any) => {
      const key = String(item.id);
      if (map.has(key)) {
        map.get(key).quantity += item.quantity;
      } else {
        map.set(key, { ...item });
      }
    });
    orderItems = Array.from(map.values());
  } else if (pendingOrder) {
    orderItems = pendingOrder.orders.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));
  }

  // Tính toán tổng tiền hàng từ orderItems (hiển thị trong UI)
  const subtotal: number = orderItems.reduce(
    (sum: number, o: TotalOrderItem) => sum + o.price * o.quantity,
    0
  );

  // Tính tổng cộng = subtotal - voucher discount - deposit amount
  const total: number = Math.max(0, subtotal - voucherDiscount - depositAmount);

  // Debug log
  console.log('Debug totals:', {
    subtotal, // từ orderItems
    voucherDiscount, // từ API
    depositAmount, // từ API
    total, // = subtotal - voucherDiscount - depositAmount
    orderItemsLength: orderItems.length,
    pendingOrder: pendingOrder ? { order_id: pendingOrder.order_id, ordersLength: pendingOrder.orders?.length } : null
  });

  // Hàm xóa món ăn
  const handleRemoveItem = async (itemId: string) => {
    if (pendingOrder) {
      const newOrders = pendingOrder.orders.filter((item: any) => String(item.id) !== String(itemId));
      const newPending = { ...pendingOrder, orders: newOrders };
      setPendingOrder(newPending);
      localStorage.setItem(`pending_order_${tableId}`, JSON.stringify(newPending));
      setReload(r => r + 1);
      
      if (pendingOrder.order_id) {
        try {
          await syncOrderItemsToServer(pendingOrder.order_id, newOrders);
          recalculateTotals(newOrders, currentOrder);
          await ApiClient.put(`/orders/${pendingOrder.order_id}`, {
            total_payment: finalTotal,
            original_total_payment: originalTotal,
            voucher_discount_amount: voucherDiscount
          });
        } catch (err) {
          console.error('Lỗi khi đồng bộ món ăn khi xóa:', err);
        }
      } else {
        recalculateTotals(newOrders, currentOrder);
      }
    } else if (order) {
      orderProducts = orderProducts.filter((item: any) => String(item.product_id) !== String(itemId));
      orderItems = orderItems.filter((item: any) => String(item.id) !== String(itemId));
      setReload(r => r + 1);
    }
  };

  // Hàm hủy hóa đơn
  const handleCancelOrder = async () => {
    setNotification({
      open: true,
      title: "Xác nhận hủy hóa đơn",
      description: "Bạn có chắc muốn hủy hóa đơn này không?",
      emoji: <span style={{ fontSize: 28 }}>⚠️</span>,
      acceptText: "Đồng ý",
      rejectText: "Hủy",
      onAccept: async () => {
        try {
          const tableUpdatePayload = {
            status: 1,
            start_time: null,
            end_time: null,
            description: null,
            number_table: table?.number_table || Number(tableId),
            capacity: table?.capacity || 4,
            name: table?.name || `Bàn ${tableId}`
          };

          const tableUpdateResponse = await ApiClient.patch(`/tables/${tableId}`, tableUpdatePayload);

          if (!tableUpdateResponse || !tableUpdateResponse.data) {
            throw new Error("Failed to update table status");
          }

          const orderId = pendingOrder?.order_id || order?.id;
          if (orderId) {
            await ApiClient.put(`/orders/${orderId}`, { status: 4 });
            localStorage.removeItem(`pending_order_${tableId}`);
          }

          setNotification({
            open: true,
            title: "Thành công",
            description: "Đã hủy hóa đơn và chuyển bàn về trạng thái trống.",
            emoji: <span style={{ fontSize: 28 }}>✅</span>,
            acceptText: "OK",
            onAccept: () => {
              window.location.href = "/quan-ly-dat-ban";
            }
          });
        } catch (error: any) {
          console.error("Error canceling order:", error);
          const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi hủy hóa đơn!";
          setNotification({
            open: true,
            title: "Lỗi",
            description: errorMessage,
            emoji: <span style={{ fontSize: 28 }}>❌</span>,
            acceptText: "OK",
            onAccept: () => setNotification(prev => ({ ...prev, open: false }))
          });
        }
      },
      onReject: () => setNotification(prev => ({ ...prev, open: false }))
    });
  };

  // Các hàm khác sẽ được thêm ở đây...
  const startPollingOrderStatus = (orderId: number) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await ApiClient.get(`/orders/${orderId}`);
        let status = undefined;
        if (res.data?.data?.status !== undefined) {
          status = res.data.data.status;
        } else if (res.data?.status !== undefined) {
          status = res.data.status;
        }
        if (status === 2) {
          setCanConfirmSePay(true);
          setIsWaitingSePay(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch (err) {
        // ignore
      }
    }, 3000);
  };

  const handleCompletePayment = async () => {
    setIsProcessing(true);
    const selectedMethod = paymentMethods.find(m => String(m.id) === paymentMethod);
    try {
      if (!selectedMethod) {
        setNotification({
          open: true,
          title: "Lỗi",
          description: "Phương thức thanh toán không hợp lệ!",
          emoji: <span style={{ fontSize: 28 }}>❌</span>,
          acceptText: "OK",
          onAccept: () => setNotification(prev => ({ ...prev, open: false }))
        });
        return;
      }

      if (selectedMethod.payment_method.toLowerCase().includes('sepay')) {
        // Xử lý SePay payment
        if (canConfirmSePay) {
          const orderId = pendingOrder.order_id;
          await syncOrderItemsToServer(orderId, pendingOrder.orders);
          localStorage.removeItem(`pending_order_${tableId}`);
          setNotification({
            open: true,
            title: 'Thanh toán thành công!',
            description: 'Hệ thống đã nhận xác nhận từ SePay.',
            emoji: <span style={{ fontSize: 28 }}>✅</span>,
            acceptText: 'OK',
            onAccept: () => {
              setNotification(prev => ({ ...prev, open: false }));
              window.location.href = "/quan-ly-dat-ban";
              setTimeout(() => { window.location.reload(); }, 200);
            },
          });
          setIsProcessing(false);
          return;
        }

        let sepayOrderId = null;
        if (pendingOrder?.order_id) {
          sepayOrderId = pendingOrder.order_id;
        } else if (order?.id) {
          sepayOrderId = order.id;
        }
        if (!sepayOrderId) {
          if (!user?.id) throw new Error('Vui lòng đăng nhập để tạo đơn hàng');
          if (!table) throw new Error('Không tìm thấy thông tin bàn');
          const tableNumber = table.number_table || Number(tableId);
          const tableCapacity = table.capacity || 4;
          const orderPayload = {
            id_table: Number(tableId),
            id_user: user.id,
            number_table: tableNumber,
            capacity: tableCapacity,
            name_user: user.name || "Khách tại bàn",
            date: new Date().toLocaleDateString('en-CA'),
            phone: user.phone || null,
            total_payment: total || null,
          };
          const resOrder = await ApiClient.post("/orders", orderPayload);
          sepayOrderId = resOrder.data?.id;
          if (!sepayOrderId) throw new Error('Không tạo được đơn hàng!');
        }
        setOrderIdForSePay(sepayOrderId);
        setSepayPayment({
          qr_code: `https://qr.sepay.vn/img?acc=VQRQADFUC9149&bank=MBBank&amount=${total}&des=Thanh Toán Bàn Số ${tableId}`,
          payment_url: "https://my.sepay.vn/payment-link-demo"
        });
        setIsWaitingSePay(true);
        setCanConfirmSePay(false);
        startPollingOrderStatus(sepayOrderId);
        setIsProcessing(false);
        return;
      }

      // Xử lý thanh toán thường
      if (!table) {
        throw new Error("Không tìm thấy thông tin bàn");
      }

      const tableNumber = table.number_table || Number(tableId);
      const tableCapacity = table.capacity || 4;

      if (pendingOrder && pendingOrder.order_id) {
        const orderId = pendingOrder.order_id;
        await ApiClient.put(`/orders/${orderId}`, {
          status: 2,
          id_payment: selectedMethod.id,
          status_deposit: 2,
          total_payment: total,
          original_total_payment: originalTotal,
          voucher_discount_amount: voucherDiscount,
        });
        await syncOrderItemsToServer(orderId, pendingOrder.orders);
        localStorage.removeItem(`pending_order_${tableId}`);
        setNotification({
          open: true,
          title: "Thành công",
          description: `Đã cập nhật lại đơn hàng #${orderId} và thanh toán thành công bằng ${selectedMethod.payment_method}!`,
          emoji: <span style={{ fontSize: 28 }}>✅</span>,
          acceptText: "OK",
          onAccept: () => {
            window.location.href = "/quan-ly-dat-ban";
          }
        });
        return;
      }

      let orderId: number | null = null;

      if (pendingOrder && !order) {
        try {
          if (!user?.id) {
            throw new Error("Vui lòng đăng nhập để tạo đơn hàng");
          }

          const orderPayload = {
            id_table: Number(tableId),
            id_user: user.id,
            number_table: tableNumber,
            capacity: tableCapacity,
            name_user: user.name || "Khách tại bàn",
            date: new Date().toLocaleDateString('en-CA'),
            phone: user.phone || null,
            total_payment: total || null,
            original_total_payment: originalTotal || null,
            voucher_discount_amount: voucherDiscount || null,
            id_voucher: currentOrder?.id_voucher || null,
            voucher_code: currentOrder?.voucher_code || null,
          };

          const orderData = await ApiClient.post("/orders", orderPayload);

          if (!orderData.data?.id) {
            throw new Error("Không nhận được ID đơn hàng sau khi tạo");
          }

          orderId = orderData.data.id;

          const syncPayload = {
            items: pendingOrder.orders.map((item: { id: number | string; quantity: number }) => ({
              id_product: Number(item.id),
              quantity: item.quantity
            }))
          };

          await ApiClient.post(`/orders/${orderId}/sync-items`, syncPayload);
          
          await ApiClient.put(`/orders/${orderId}`, {
            status: 2,
            status_deposit: 2,
            id_payment: selectedMethod.id,
            total_payment: total,
            original_total_payment: originalTotal,
            voucher_discount_amount: voucherDiscount,
          });
          
          localStorage.removeItem(`pending_order_${tableId}`);

          const tableUpdatePayload = {
            status: 1,
            start_time: null,
            end_time: null,
            description: null,
            number_table: tableNumber,
            capacity: tableCapacity,
            name: table.name || `Bàn ${tableId}`
          };

          const tableUpdateResponse = await ApiClient.patch(`/tables/${tableId}`, tableUpdatePayload);

          if (!tableUpdateResponse || !tableUpdateResponse.data) {
            throw new Error("Không thể cập nhật trạng thái bàn");
          }

          setNotification({
            open: true,
            title: "Thành công",
            description: `Thanh toán thành công bằng ${selectedMethod.payment_method}!`,
            emoji: <span style={{ fontSize: 28 }}>✅</span>,
            acceptText: "OK",
            onAccept: () => {
              window.location.href = "/quan-ly-dat-ban";
            }
          });
        } catch (error: any) {
          console.error("Chi tiết lỗi:", error);
          if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
          }
          throw new Error(`Lỗi khi tạo đơn hàng: ${error.message}`);
        }
      } else if (order) {
        await ApiClient.put(`/orders/${order.id}`, {
          status: 2,
          id_payment: selectedMethod.id,
          status_deposit: 2,
        });
        
        orderId = order.id;
      } else {
        throw new Error("Không tìm thấy thông tin đơn hàng");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setNotification({
        open: true,
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Có lỗi xảy ra khi thanh toán!",
        emoji: <span style={{ fontSize: 28 }}>❌</span>,
        acceptText: "OK",
        onAccept: () => setNotification(prev => ({ ...prev, open: false }))
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const syncOrderItemsToServer = async (orderId: number, items: any[]) => {
    try {
      if (!items || items.length === 0) {
        throw new Error("Danh sách món ăn không được để trống");
      }

      const validItems = items.map(item => {
        if (!item.id) {
          throw new Error(`Món "${item.name}" không có ID sản phẩm`);
        }
        if (!item.quantity || item.quantity < 1) {
          throw new Error(`Số lượng món "${item.name}" không hợp lệ`);
        }
        return {
          id_product: Number(item.id),
          quantity: Number(item.quantity)
        };
      });

      const response = await ApiClient.post(`/orders/${orderId}/sync-items`, {
        items: validItems
      });

      return response;
    } catch (err: any) {
      console.error("Error syncing order items:", err);
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error("Failed to sync order items");
    }
  };



  // Tính toán lại tổng tiền khi order items thay đổi
  useEffect(() => {
    if (orderItems.length > 0 || currentOrder) {
      recalculateTotals(orderItems, currentOrder);
    }
  }, [orderItems, currentOrder]);

  // Lấy ngày giờ tạo order
  let createdAt = order?.created_at
    ? new Date(order.created_at).toLocaleString("vi-VN")
    : "-";
  if (pendingOrder && pendingOrder.created_at) {
    createdAt = new Date(pendingOrder.created_at).toLocaleString("vi-VN");
  }

  // Lấy trạng thái bàn
  const statusMap: Record<string, string> = {
    available: "Trống",
    occupied: "Đang sử dụng",
    reserved: "Đã đặt trước"
  };
  let tableStatus = table?.status || "available";
  if (orderItems.length > 0) tableStatus = "occupied";
  const tableStatusLabel = statusMap[tableStatus] || tableStatus;

  // Reset QR state khi đổi phương thức thanh toán
  useEffect(() => {
    setIsSePayQRVisible(false);
    setSepayPayment(null);
    setIsWaitingSePay(false);
    setCanConfirmSePay(false);
    setOrderIdForSePay(null);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, [paymentMethod, tableId]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  return (
    <>
      <div
        className={`w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 shadow-lg p-3 sm:p-6 lg:p-8 min-h-screen sm:min-h-[80vh] flex flex-col justify-start pb-20 sm:pb-8`}
        style={{ fontSize: "1rem" }}
      >
        <Link href={`/quan-ly-dat-ban/${tableId}/orders`} className="mb-4 sm:mb-6">
          <button
            className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 sm:px-6 sm:py-3 rounded-[8px] font-semibold text-sm sm:text-[14px] transition"
            type="button"
          >
            <svg width={18} height={18} fill="none" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Trở về
          </button>
        </Link>
        
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-4 sm:mb-6 tracking-wider text-gray-600 dark:text-amber-50">
          HÓA ĐƠN THANH TOÁN
        </h2>
        
        {/* Thông tin bàn */}
        <div className="space-y-2 sm:space-y-0 sm:flex sm:justify-between mb-4 text-sm sm:text-lg dark:text-amber-50">
          <span className="text-sm sm:text-base pr-[60px]">
            <strong>Bàn:</strong> {table?.name || tableId}
          </span>
          <span className="text-sm sm:text-base">
            <strong>Trạng thái:</strong> {tableStatusLabel}
          </span>
        </div>
        
        <div className="space-y-2 sm:space-y-0 sm:flex sm:justify-between mb-6 sm:mb-8 text-sm sm:text-lg dark:text-amber-50">
          <span className="text-sm sm:text-base pr-[10px]">
            <strong>Ngày giờ:</strong> {createdAt}
          </span>
          <span className="text-sm sm:text-base">
            <strong>Mã hóa đơn:</strong> {order?.id || pendingOrder?.order_id}
          </span>
        </div>
        
        {/* Bảng món ăn */}
        <div className="overflow-x-auto mb-6 sm:mb-8 -mx-3 sm:mx-0">
          <div className="min-w-full">
            <table className="w-full border text-sm sm:text-base">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-2 sm:px-4 sm:py-2 text-left">Tên món</th>
                  <th className="border px-2 py-2 sm:px-4 sm:py-2 text-center">SL</th>
                  <th className="border px-2 py-2 sm:px-4 sm:py-2 text-right">Đơn giá</th>
                  <th className="border px-2 py-2 sm:px-4 sm:py-2 text-right">Thành tiền</th>
                  <th className="border px-2 py-2 sm:px-4 sm:py-2 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 sm:py-8 text-gray-400 text-base sm:text-xl">
                      Chưa có món nào được order.
                    </td>
                  </tr>
                ) : (
                  orderItems.map((item: any) => (
                    <tr key={item.id}>
                      <td className="border px-2 py-2 sm:px-4 sm:py-2 text-sm sm:text-base">{item.name}</td>
                      <td className="border px-2 py-2 sm:px-4 sm:py-2 text-center">{item.quantity}</td>
                      <td className="border px-2 py-2 sm:px-4 sm:py-2 text-right text-sm sm:text-base">
                        {item.price.toLocaleString()}đ
                      </td>
                      <td className="border px-2 py-2 sm:px-4 sm:py-2 text-right text-sm sm:text-base">
                        {(item.price * item.quantity).toLocaleString()}đ
                      </td>
                      <td className="border px-2 py-2 sm:px-4 sm:py-2 text-center">
                        <button
                          className="text-red-600 hover:text-red-900 font-bold text-sm sm:text-base"
                          onClick={() => handleRemoveItem(item.id)}
                          title="Xóa món"
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Tổng tiền với voucher discount */}
        <div className="space-y-2 mb-4 sm:mb-6">
          {/* Tổng tiền hàng */}
          <div className="flex justify-between items-center">
            <span className="font-medium dark:text-white text-base sm:text-lg text-black">
              Tổng tiền hàng:
            </span>
            <span className="text-gray-700 text-lg sm:text-xl font-semibold">
              {subtotal.toLocaleString()} đ
            </span>
          </div>
          
          {/* Giảm giá voucher */}
          {voucherDiscount > 0 && (
            <div className="flex justify-between items-center">
              <span className="font-medium dark:text-white text-base sm:text-lg text-black">
                Giảm giá voucher:
              </span>
              <span className="text-green-600 text-lg sm:text-xl font-semibold">
                -{voucherDiscount.toLocaleString()} đ
              </span>
            </div>
          )}
          
          {/* Số tiền đã đặt cọc */}
          {depositAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="font-medium dark:text-white text-base sm:text-lg text-black">
                Đã đặt cọc:
              </span>
              <span className="text-blue-600 text-lg sm:text-xl font-semibold">
                -{depositAmount.toLocaleString()} đ
              </span>
            </div>
          )}
          
          {/* Tổng cộng */}
          <div className="flex justify-between items-center border-t pt-2">
            <span className="font-semibold dark:text-white text-lg sm:text-2xl text-black">
              Tổng cộng:
            </span>
            <span className="text-red-600 text-xl sm:text-3xl font-bold">
              {total.toLocaleString()} đ
            </span>
          </div>
        </div>
        
        {/* Phương thức thanh toán */}
        {orderItems.length > 0 && (
          <div className="flex flex-col mb-4 w-full space-y-2">
            <label className="font-semibold text-base sm:text-lg dark:text-amber-50">
              Phương thức thanh toán:
            </label>
            <div className="w-full sm:w-auto sm:flex sm:justify-end">
              <select
                className="border px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-lg w-full max-w-xs sm:max-w-none sm:w-auto min-w-[200px]"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                disabled={paymentMethods.length === 0}
              >
                {paymentMethods.length === 0 ? (
                  <option value="">Đang tải phương thức...</option>
                ) : (
                  paymentMethods.map(method => (
                    <option key={method.id} value={String(method.id)}>
                      {method.payment_method}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        )}
        
        {/* QR Code */}
        <div className="flex justify-center mb-4">
          {sepayPayment?.qr_code && (
            <img src={sepayPayment.qr_code} alt="QR Code" className="max-w-full h-auto mx-auto max-h-64 sm:max-h-80" />
          )}
        </div>
        
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row mt-4 gap-3 sm:gap-4 w-full">
          {orderItems.length > 0 && (
            <>
              {/* Nút hủy hóa đơn */}
              <button
                className="bg-white border border-red-500 text-red-600 hover:bg-red-50 px-4 py-3 sm:px-6 sm:py-3 rounded-[8px] font-semibold text-sm sm:text-[14px] transition w-full sm:w-auto order-2 sm:order-1"
                onClick={handleCancelOrder}
                type="button"
              >
                Hủy hóa đơn
              </button>
              
              {/* Nút thanh toán */}
              {(() => {
                const selectedMethod = paymentMethods.find(m => String(m.id) === paymentMethod);
                const isSePayMethod = selectedMethod?.payment_method.toLowerCase().includes('sepay');
                const isButtonDisabled = isProcessing || (isWaitingSePay && !canConfirmSePay && isSePayMethod);
                
                return (
                  <button
                    className={`transition font-semibold text-sm sm:text-[14px] w-full sm:w-auto px-4 py-3 sm:px-6 sm:py-3 rounded-[8px] order-1 sm:order-2 sm:ml-auto
                      ${isButtonDisabled 
                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                        : 'bg-[#3E2723] text-white hover:bg-[#5d4037]'}
                    `}
                    onClick={handleCompletePayment}
                    disabled={isButtonDisabled}
                    type="button"
                    style={{ minWidth: 120 }}
                  >
                    {isProcessing ? 'Đang xử lý...' : isWaitingSePay && isSePayMethod ? 'Đang chờ thanh toán...' : 'Thanh toán'}
                  </button>
                );
              })()}
            </>
          )}
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
    </>
  );
}
  