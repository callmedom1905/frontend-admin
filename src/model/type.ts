export interface IUser {
  id: number | string;
  id_role: number;
  name: string;
  email: string;
  profile_image: string;
  phone: string;
  password: string;
  remember_token: string;
  active: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  description?: string;
}

export interface IRole {
  id: number | string;
  name: string;
}

export interface IPermission {
  id: number | string;
  name: string;
}

export interface IRoleHavePermission {
  role_id: number | string;
  permission_id: number | string;
  id: number | string;
}

export interface ITable {
  id: number;
  table_number: number;
  status: number; // 1: Trống, 2: Đang sử dụng, 3: Đã đặt trước, 4: Không sử dụng
  image?: string | null;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  capacity: number;
  type?: string | null;
  view?: string | null;
  purpose?: string | null;
  created_at?: string;
  updated_at?: string;
  // Alias cho backward compatibility
  name?: string;
  number_table?: number;
}

export interface IOrder {
  id: number | string;
  id_user: number | string;
  id_voucher?: number | string | null;
  voucher_code?: string | null;
  voucher_discount_amount?: number | null;
  original_total_payment?: number | null;
  id_table: number | string;
  name_user: string;
  phone?: string | null;
  time?: string | null;
  date?: string | null;
  number_table: number;
  total_payment?: number;
  deposit_amount?: number; // Thêm trường tiền cọc
  capacity: number;
  status?: number | string; // 0,1,2,3
  payment?: number | string; // 0,1,2
  status_deposit?: number | string; // 0,1
  created_at: string;
  updated_at?: string;
  products?: { product_id: number | string; quantity: number }[];
  order_items?: IOrderItem[];
  tables?: ITable[]; // Thêm property tables cho đơn hàng nhiều bàn
}

export interface IOrderItemSimple {
  product_id: number | string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  slug: string;
  meta_description: string;
  detail_description: string;
  quantity_sold: number;
}

export interface IOrderItem {
  id: number | string;
  id_order: number | string;
  id_product: number | string;
  id_user: number | string;
  name: string;
  image: string;
  price: number;
  status: boolean;
  slug: string;
  meta_description: string;
  detail_description: string;
  quantity_sold: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  order_id?: number | string;
  product_id?: number | string;
  quantity?: number;
}

export interface IProduct {
  id: number | string;
  id_category: number | string;
  id_user?: number | string;
  name: string;
  slug?: string;
  price: number | string;
  status?: boolean | number;
  image: string | null;
  meta_description?: string;
  detail_description?: string | null;
  quantity_sold?: number;
  created_at: string | null;
  updated_at: string | null;
  deleted_at?: string | null;
  is_active: boolean; 
}

export interface ICategory {
  id: number;
  name: string;
  slug: string;
  status?: boolean | number;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
}

export interface IPayment {
  id: number | string;
  order_id: number | string;
  method: string;
  amount: number;
  payment_date: string | null;
}

export interface IVoucher {
  id: number | string;
  code: string;
  discount: number;
  expiry_date: string;
}

export interface IPost {
  id: number | string;
  title: string;
  content: string;
  created_at: string;
}

// ===== INTERFACES FROM Cate.tsx =====
export interface Category {
  id: number | string;
  name: string;
  slug?: string;
  status: number;
  deleted_at?: string | null;
}

export interface ApiCategory {
  id: number | string;
  name: string;
  slug?: string;
  status: boolean | number;
  deleted_at?: string | null;
}

// ===== INTERFACES FROM AdTables.tsx =====
export interface IOrderExtended {
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
  order_items?: IOrderItemExtended[];
  voucher?: IVoucherExtended;
}

export interface IOrderItemExtended {
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

export interface IVoucherExtended {
  id: number | string;
  code: string;
  discount_type: string;
  discount_value: number;
  expiry_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface TotalOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface AdTablesProps {
  tableId: string;
}

// ===== INTERFACES FROM BookTables.tsx =====
export interface TableStatusMap {
  [key: number]: {
    label: string;
    color: string;
    bgColor: string;
  };
}

export interface NotificationModalState {
  open: boolean;
  title: string;
  description?: string;
  emoji?: React.ReactNode;
  acceptText?: string;
  rejectText?: string;
  onAccept: () => void;
  onReject?: () => void;
}

export interface FormData {
  table_number: number;
  status: number;
  image: string;
  description: string;
  capacity: number;
  view: string;
  purpose: string;
}

export interface MenuPosition {
  top: number;
  left: number;
}

// ===== COMMON TYPES =====
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status?: number;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

