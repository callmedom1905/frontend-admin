"use client";

import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import InputField from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import { Save, X, Eye } from 'lucide-react';
import ToastMessage from "@/components/tables/Post/ToastMessage";
import apiClient from "@/lib/apiClient";

interface VoucherFormData {
  code: string;
  name: string;
  description: string;
  start_date: Date | null;
  end_date: Date | null;
  discount_type: number;
  discount_value: number;
  min_price: number;
  status: number;
}

interface VoucherFormProps {
  voucher?: Partial<VoucherFormData> & { description?: string; id?: number };
  onSubmit: (data: VoucherFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const VoucherForm: React.FC<VoucherFormProps> = ({ 
  voucher, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [formData, setFormData] = useState<VoucherFormData>({
    code: voucher?.code || '',
    name: voucher?.name || '',
    description: voucher?.description || '',
    start_date: voucher?.start_date ? new Date(voucher.start_date) : null,
    end_date: voucher?.end_date ? new Date(voucher.end_date) : null,
    discount_type: voucher?.discount_type || 1,
    discount_value: voucher?.discount_value || 0,
    min_price: voucher?.min_price || 0,
    status: voucher?.status || 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const discountTypeOptions = [
    { value: "1", label: "Phần trăm (%)" },
    { value: "2", label: "Số tiền (VND)" },
  ];

  const statusOptions = [
    { value: "1", label: "Đang hoạt động" },
    { value: "0", label: "Chưa kích hoạt" },
  ];

const handleInputChange = (field: keyof VoucherFormData, value: string | number | Date | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: (field === 'start_date' || field === 'end_date') ? value as Date | null : value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Mã voucher là bắt buộc';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tên voucher là bắt buộc';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Ngày bắt đầu là bắt buộc';
    }
    if (!formData.end_date) {
      newErrors.end_date = 'Ngày kết thúc là bắt buộc';
    }
    if (formData.start_date && formData.end_date && formData.start_date.getTime() >= formData.end_date.getTime()) {
      newErrors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
    }

    if (formData.discount_value <= 0) {
      newErrors.discount_value = 'Giá trị giảm phải lớn hơn 0';
    }

    if (formData.discount_type === 1 && formData.discount_value > 100) {
      newErrors.discount_value = 'Giá trị giảm phần trăm không được vượt quá 100%';
    }

    if (formData.min_price < 0) {
      newErrors.min_price = 'Đơn hàng tối thiểu không được âm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //gọi api xử lý form
  const handleSubmit = async (e: React.FormEvent) => 
  {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Format date as local yyyy-MM-dd (not UTC)
      const formatLocalDate = (date: Date | null) => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const submitData = {
        ...formData,
        start_date: formatLocalDate(formData.start_date),
        end_date: formatLocalDate(formData.end_date),
      };

      if (voucher && voucher.id) {
        // Nếu có voucher.id thì gọi API cập nhật
        await apiClient.put(`/vouchers/${voucher.id}`, submitData);
      } else {
        // Nếu không có thì tạo mới
        await apiClient.post('/vouchers', submitData);
      }

      onSubmit(formData);
      setShowCreateToast(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      alert(errorMessage);
    }
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(value);
  };

  const [showCreateToast, setShowCreateToast] = useState(false);

  return (
    <div className="bg-white">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mã voucher */}
          <div className="space-y-2">
            <Label>Mã voucher <span className="text-red-500">*</span></Label>
            <InputField
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="Nhập mã voucher (VD: SUMMER2024)"
              error={!!errors.code}
            />
            {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
          </div>

          {/* Tên voucher */}
          <div className="space-y-2">
            <Label>Tên voucher <span className="text-red-500">*</span></Label>
            <InputField
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Nhập tên voucher"
              error={!!errors.name}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* Ngày bắt đầu */}
          <div className="space-y-2">
            <Label>Ngày bắt đầu <span className="text-red-500">*</span></Label>
            <DatePicker
              selected={formData.start_date}
              onChange={(date: Date | null) => handleInputChange('start_date', date)}
              dateFormat="yyyy-MM-dd"
              className={`cursor-pointer h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800'}`}
              placeholderText="Chọn ngày bắt đầu"
            />
            {errors.start_date && <p className="text-red-500 text-sm">{errors.start_date}</p>}
          </div>

          {/* Ngày kết thúc */}
          <div className="space-y-2">
            <Label>Ngày kết thúc <span className="text-red-500">*</span></Label>
            <DatePicker
              selected={formData.end_date}
              onChange={(date: Date | null) => handleInputChange('end_date', date)}
              dateFormat="yyyy-MM-dd"
              className={`cursor-pointer h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800'}`}
              placeholderText="Chọn ngày kết thúc"
            />
            {errors.end_date && <p className="text-red-500 text-sm">{errors.end_date}</p>}
          </div>

          {/* Loại giảm giá */}
          <div className="space-y-2">
            <Label>Loại giảm giá <span className="text-red-500">*</span></Label>
            <Select
              options={discountTypeOptions}
              value={String(formData.discount_type)}
              onChange={(value) => handleInputChange('discount_type', Number(value))}
              placeholder="Chọn loại giảm giá"
            />
          </div>

          {/* Giá trị giảm */}
          <div className="space-y-2">
            <Label>
              Giá trị giảm {formData.discount_type === 1 ? '(%)' : '(VND)'} <span className="text-red-500">*</span>
            </Label>
            <InputField
              type="number"
              value={String(formData.discount_value)}
              onChange={(e) => handleInputChange('discount_value', Number(e.target.value))}
              placeholder={formData.discount_type === 1 ? "Nhập % giảm (VD: 10)" : "Nhập số tiền giảm"}
              error={!!errors.discount_value}
              min="0"
              max={formData.discount_type === 1 ? "100" : undefined}
            />
            {errors.discount_value && <p className="text-red-500 text-sm">{errors.discount_value}</p>}
            {formData.discount_value > 0 && (
              <p className="text-gray-500 text-sm">
                {formData.discount_type === 1 
                  ? `Giảm ${formData.discount_value}%`
                  : `Giảm ${formatCurrency(formData.discount_value)}`
                }
              </p>
            )}
          </div>

          {/* Đơn hàng tối thiểu */}
          <div className="space-y-2">
            <Label>Đơn hàng tối thiểu (VND)</Label>
            <InputField
              type="number"
              value={String(formData.min_price)}
              onChange={(e) => handleInputChange('min_price', Number(e.target.value))}
              placeholder="Nhập giá trị đơn hàng tối thiểu"
              error={!!errors.min_price}
              min="0"
            />
            {errors.min_price && <p className="text-red-500 text-sm">{errors.min_price}</p>}
            {formData.min_price > 0 && (
              <p className="text-gray-500 text-sm">
                Áp dụng cho đơn hàng từ {formatCurrency(formData.min_price)}
              </p>
            )}
          </div>

          {/* Trạng thái */}
          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <Select
              options={statusOptions}
              value={String(formData.status)}
              onChange={(value) => handleInputChange('status', Number(value))}
              placeholder="Chọn trạng thái"
            />
          </div>
        </div>

        {/* Mô tả */}
        <div className="space-y-2">
          <Label>Mô tả</Label>
          <TextArea
            value={formData.description}
            onChange={(value) => handleInputChange('description', value)}
            placeholder="Nhập mô tả chi tiết về voucher..."
            rows={4}
          />
        </div>

        {/* Preview */}
        {(formData.code || formData.name) && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Xem trước voucher
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p><span className="font-medium text-gray-700">Mã:</span> <span className="text-gray-900">{formData.code || 'Chưa nhập'}</span></p>
                <p><span className="font-medium text-gray-700">Tên:</span> <span className="text-gray-900">{formData.name || 'Chưa nhập'}</span></p>
                <p><span className="font-medium text-gray-700">Giảm:</span> <span className="text-green-600 font-medium">{
                  formData.discount_type === 1 
                    ? `${formData.discount_value}%`
                    : formatCurrency(formData.discount_value)
                }</span></p>
              </div>
              <div className="space-y-2">
                <p><span className="font-medium text-gray-700">Đơn tối thiểu:</span> <span className="text-gray-900">{formatCurrency(formData.min_price)}</span></p>
                <p><span className="font-medium text-gray-700">Thời gian:</span> <span className="text-gray-900">{
                  formData.start_date instanceof Date && !isNaN(formData.start_date.getTime())
                    ? formData.start_date.toISOString().slice(0, 10)
                    : ''
                } đến {
                  formData.end_date instanceof Date && !isNaN(formData.end_date.getTime())
                    ? formData.end_date.toISOString().slice(0, 10)
                    : ''
                }</span></p>
                <p><span className="font-medium text-gray-700">Trạng thái:</span> <span className={`px-2 py-1 rounded-full text-xs font-medium ${formData.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {formData.status === 1 ? 'Đang hoạt động' : 'Chưa kích hoạt'}
                </span></p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium text-gray-700"
            disabled={loading}
          >
            <X className="w-4 h-4" />
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#422006] text-white rounded-lg hover:bg-[#5a2d0c] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Đang xử lý...' : voucher ? 'Cập nhật voucher' : 'Tạo voucher'}
          </button>
        </div>
      </form>
      <ToastMessage 
        open={showCreateToast}
        message="Vui lòng kiểm tra lại thông tin đã nhập."
        onClose={() => setErrors({})}></ToastMessage>

    </div>
  );
};

export default VoucherForm;
