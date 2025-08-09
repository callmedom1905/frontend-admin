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

