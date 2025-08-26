import React, { useState, useEffect } from "react";
import { useForm, RegisterOptions } from "react-hook-form";

interface User {
  id: number;
  name: string;
  email?: string;
  phone: string;
  status: number;
  id_role: number;
  profile_image?: string;
  created_at?: string;
}

interface UserFormData {
  name: string;
  email?: string;
  phone: string;
  password?: string;
  confirmPassword?: string;
  status?: number;
  id_role: number;
}

interface UserFormProps {
  onSubmit?: (data: UserFormData) => void;
  editUser?: User;
}

const UserForm: React.FC<UserFormProps> = ({ onSubmit, editUser }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    setValue,
    watch,
  } = useForm<UserFormData>();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editUser) {
      setValue("name", editUser.name || "");
      setValue("email", editUser.email || "");
      setValue("phone", editUser.phone || "");
      setValue("status", editUser.status);
      setValue("id_role", editUser.id_role);
      setValue("password", "");
      setValue("confirmPassword", "");
    } else {
      reset();
      setValue("id_role", 3); // Default role for new users
    }
  }, [editUser, setValue, reset]);

  const submitHandler = async (data: UserFormData) => {
    setLoading(true);
    try {
      if (onSubmit) onSubmit(data);
    } catch (err: any) {
      
      // Xử lý lỗi từ backend với format {status: false, message: "..."}
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      }
      // Xử lý lỗi validation từ backend với format errors
      else if (err.response?.data?.errors) {
        const apiErrors = err.response.data.errors;
        Object.keys(apiErrors).forEach((key) => {
          setError(key as keyof UserFormData, { type: "manual", message: apiErrors[key][0] });
        });
      }
      // Lỗi khác
      else {
        alert("Có lỗi xảy ra khi lưu người dùng!");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    name: keyof UserFormData,
    label: string,
    type: string = "text",
    placeholder: string,
    icon: React.ReactNode,
    validation: RegisterOptions<UserFormData, keyof UserFormData>
  ) => (
    <div className="flex flex-col">
      <label className="mb-1 font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={type}
          {...register(name, validation)}
          className={`border-2 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-[#D4AF37] transition ${
            errors[name] ? "border-red-400" : "border-gray-200"
          }`}
          placeholder={placeholder}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
          {icon}
        </span>
      </div>
      {errors[name] && <span className="text-red-500 text-xs">{errors[name]?.message}</span>}
    </div>
  );

  const renderPasswordInput = (
    name: "password" | "confirmPassword",
    label: string,
    placeholder: string,
    showPassword: boolean,
    setShowPassword: (show: boolean) => void,
    validation: RegisterOptions<UserFormData, "password" | "confirmPassword">
  ) => (
    <div className="flex flex-col">
      <label className="mb-1 font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          {...register(name, validation)}
          className={`border-2 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-[#D4AF37] transition ${
            errors[name] ? "border-red-400" : "border-gray-200"
          }`}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          tabIndex={-1}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path d="M17.94 17.94A10.97 10.97 0 0112 19c-7 0-11-7-11-7a21.77 21.77 0 015.06-6.06M1 1l22 22" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.53 9.53A3 3 0 0112 9c1.66 0 3 1.34 3 3 0 .47-.11.91-.29 1.29" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
      {errors[name] && <span className="text-red-500 text-xs">{errors[name]?.message}</span>}
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="w-full h-full flex flex-col justify-center items-center"
      style={{ minWidth: 320, minHeight: 500 }}
    >
      <div className="w-full grid grid-cols-1 gap-y-4">
        {renderInput(
          "name",
          "Họ tên",
          "text",
          "Nhập họ tên",
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" fill="#bbb"/>
          </svg>,
          { required: "Vui lòng nhập họ tên" }
        )}

        {editUser && renderInput(
          "email",
          "Email",
          "email",
          "Nhập email",
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M2 4a2 2 0 012-2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0v.01L12 13l8-8.99V4H4zm0 16h16V6.83l-8 8-8-8V20z" fill="#bbb"/>
          </svg>,
          {
            required: "Vui lòng nhập email",
            pattern: { value: /^\S+@\S+$/i, message: "Email không hợp lệ" }
          }
        )}

        {renderInput(
          "phone",
          "Số điện thoại",
          "tel",
          "Nhập số điện thoại",
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.21.49 2.53.76 3.88.76a1 1 0 011 1v3.5a1 1 0 01-1 1C10.07 22 2 13.93 2 4.5A1 1 0 013 3.5h3.5a1 1 0 011 1c0 1.35.27 2.67.76 3.88a1 1 0 01-.21 1.11l-2.2 2.2z" fill="#bbb"/>
          </svg>,
          {
            required: "Vui lòng nhập số điện thoại",
            pattern: { 
              value: /^0[0-9]{9,10}$/, 
              message: "Số điện thoại phải bắt đầu bằng số 0 và có 10-11 số" 
            }
          }
        )}

        {editUser && (
          <div className="flex flex-col">
            <label className="mb-1 font-semibold text-gray-700">Trạng thái</label>
            <ul className="flex gap-4">
              <li>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    value={1}
                    {...register("status", { required: "Vui lòng chọn trạng thái" })}
                    checked={watch("status") === 1}
                    onChange={() => setValue("status", 1)}
                  />
                  <span className="text-green-700 font-medium">Đang hoạt động</span>
                </label>
              </li>
              <li>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    value={0}
                    {...register("status", { required: "Vui lòng chọn trạng thái" })}
                    checked={watch("status") === 0}
                    onChange={() => setValue("status", 0)}
                  />
                  <span className="text-red-600 font-medium">Ngừng hoạt động</span>
                </label>
              </li>
            </ul>
            {errors.status && <span className="text-red-500 text-xs">{errors.status?.message}</span>}
          </div>
        )}

        {renderPasswordInput(
          "password",
          editUser ? "Mật khẩu mới" : "Mật khẩu",
          editUser ? "Để trống nếu không đổi mật khẩu" : "Nhập mật khẩu",
          showPassword,
          setShowPassword,
          {
            required: !editUser ? "Vui lòng nhập mật khẩu" : false,
            minLength: { value: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" }
          }
        )}

        {(!editUser || (editUser && !!watch("password"))) && (
          renderPasswordInput(
            "confirmPassword",
            editUser ? "Xác nhận mật khẩu mới" : "Xác nhận mật khẩu",
            editUser ? "Nhập lại mật khẩu mới nếu đổi" : "Nhập lại mật khẩu",
            showConfirm,
            setShowConfirm,
            {
              required: !editUser ? "Vui lòng xác nhận mật khẩu" : !!watch("password"),
              validate: (value: string | undefined) => {
                if (!value) return true;
                return value === watch("password") || "Mật khẩu xác nhận không khớp";
              }
            }
          )
        )}
      </div>
      <div className="w-full mt-8 flex">
        <button
          type="submit"
          className="bg-[#3E2723] hover:bg-[#D4AF37] text-white font-semibold py-3 px-8 rounded-xl shadow transition text-lg flex items-center gap-2"
          disabled={loading}
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {loading ? (editUser ? "Đang cập nhật..." : "Đang tạo...") : (editUser ? "Cập nhật" : "Tạo người dùng")}
        </button>
      </div>
    </form>
  );
};

export default UserForm;