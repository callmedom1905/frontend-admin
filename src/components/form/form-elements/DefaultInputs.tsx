"use client";
import React, { useState } from 'react';
import ComponentCard from '../../common/ComponentCard';
import Label from '../Label';
import Input from '../input/InputField';
import Select from '../Select';
import { ChevronDownIcon, EyeCloseIcon, EyeIcon } from '../../../icons';
import DatePicker from '@/components/form/date-picker';
import TextArea from "../input/TextArea";
import { EnvelopeIcon } from "../../../icons";
import PhoneInput from "../group-input/PhoneInput";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import  apiClientBase  from "@/lib/apiClient";

export default function DefaultInputs({ onSubmitUser }: { onSubmitUser?: (data: any) => void }) {
  const [message, setMessage] = useState("");
  const [messageTwo, setMessageTwo] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "User", // Mặc định là User
    password: "",
    date: "",
    email: "",
    phone: "",
    description: "",
    profile_image: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const router = useRouter();

  const options = [
    { value: "Admin", label: "Admin" },
    { value: "Staff", label: "Staff" },
    { value: "User", label: "User" },
  ];

  const handleSelectChange = (value: string) => {
    setForm(f => ({ ...f, role: value }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleDateChange = (_: any, currentDateString: string) => {
    setForm(f => ({ ...f, date: currentDateString }));
  };

  const handleTextAreaChange = (value: string) => {
    setForm(f => ({ ...f, description: value }));
  };

  const handlePhoneNumberChange = (phoneNumber: string) => {
    setForm(f => ({ ...f, phone: phoneNumber }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, email: e.target.value }));
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0]);
      setForm(f => ({ ...f, profile_image: acceptedFiles[0].name }));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
      "image/svg+xml": [],
    },
  });

  const validateForm = async () => {
    // Kiểm tra các trường bắt buộc
    if (!form.name.trim()) {
      setSuccess("Vui lòng nhập họ tên.");
      return false;
    }
    if (!form.role) {
      setSuccess("Vui lòng chọn vai trò.");
      return false;
    }
    if (!form.password || form.password.length < 6) {
      setSuccess("Mật khẩu phải có ít nhất 6 ký tự.");
      return false;
    }
    if (!form.email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(form.email)) {
      setSuccess("Vui lòng nhập email hợp lệ.");
      return false;
    }
    if (!form.phone || !/^(\+?\d{1,3}[- ]?)?\d{9,11}$/.test(form.phone)) {
      setSuccess("Vui lòng nhập số điện thoại hợp lệ.");
      return false;
    }
    // Kiểm tra trùng email hoặc số điện thoại trong database (dùng apiClientBase)
    const res = await apiClientBase.get("/users");
    const users = Array.isArray(res.data) ? res.data : res.data?.data || [];
    if (users.some((u: any) => u.email === form.email)) {
      setSuccess("Email đã tồn tại trong hệ thống.");
      return false;
    }
    if (users.some((u: any) => u.phone === form.phone)) {
      setSuccess("Số điện thoại đã tồn tại trong hệ thống.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    if (!(await validateForm())) return;
    setLoading(true);
    // Map role string to id_role
    let id_role = 2;
    if (form.role === "Admin") id_role = 1;
    else if (form.role === "Staff") id_role = 2;
    else if (form.role === "User") id_role = 3;

    const newUser = {
      name: form.name,
      id_role,
      email: form.email,
      phone: form.phone,
      password: form.password,
      profile_image: form.profile_image,
      remember_token: "",
      active: "Active",
      created_at: form.date || new Date().toISOString(),
      updated_at: form.date || new Date().toISOString(),
      deleted_at: null,
      description: form.description,
    };
    try {
      await apiClientBase.post("/users", newUser);
      setLoading(false);
      setSuccess("Thêm người dùng thành công!");
      setForm({
        name: "",
        role: "",
        password: "",
        date: "",
        email: "",
        phone: "",
        description: "",
        profile_image: "",
      });
      setUploadedFile(null);
      if (onSubmitUser) onSubmitUser(newUser);
      setTimeout(() => {
        router.push("/quan-ly-nguoi-dung");
      }, 1000);
    } catch (err) {
      setLoading(false);
      setSuccess("Thêm người dùng thất bại!");
    }
  };

  return (
    <ComponentCard title="Thêm người dùng">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <Label>Full Name</Label>
          <Input
            type="text"
            placeholder="Nhập Họ Và Tên"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label>Role</Label>
          <div className="relative">
            <Select
              options={options}
              placeholder="Chọn vai trò"
              defaultValue="User"
              onChange={handleSelectChange}
              value={form.role}
              className="dark:bg-dark-900"
            />
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <ChevronDownIcon />
            </span>
          </div>
        </div>
        <div>
          <Label>Mật Khẩu</Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
            >
              {showPassword ? (
                <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
              ) : (
                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div>
          <DatePicker
            id="date-picker"
            label="Date Picker Input"
            placeholder="Chọn ngày"
            onChange={handleDateChange}
          />
        </div>
        <div>
          <Label>Email</Label>
          <div className="relative">
            <Input
              placeholder="info@gmail.com"
              type="text"
              name="email"
              value={form.email}
              onChange={handleEmailChange}
              className="pl-[62px]"
            />
            <span className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 px-3.5 py-3 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <EnvelopeIcon />
            </span>
          </div>
        </div>
        <div>
          <Label>Số Điện Thoại</Label>
          <PhoneInput
            selectPosition="start"
            countries={[{ code: "VN", label: "+84" }]}
            placeholder="+84 (555) 000-000"
            onChange={handlePhoneNumberChange}
            value={form.phone}
          />
        </div>
        <div>
          <Label>Mô Tả</Label>
          <TextArea
            value={form.description}
            onChange={handleTextAreaChange}
            rows={6}
          />
        </div>
        <div>
          <Label>Ảnh Đại Diện</Label>
          <div
            {...getRootProps()}
            className={`transition border border-gray-300 border-dashed cursor-pointer dark:hover:border-brand-500 dark:border-gray-700 rounded-xl hover:border-brand-500 p-7 lg:p-10 ${
              isDragActive
                ? "border-brand-500 bg-gray-100 dark:bg-gray-800"
                : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
            }`}
            id="demo-upload"
          >
            <input {...getInputProps()} />
            <div className="dz-message flex flex-col items-center m-0!">
              <div className="mb-[22px] flex justify-center">
                <div className="flex h-[68px] w-[68px]  items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  <svg
                    className="fill-current"
                    width="29"
                    height="28"
                    viewBox="0 0 29 28"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699ZM5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="mb-3 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
                {isDragActive ? "Thả tệp vào đây..." : "Kéo và thả tệp hoặc nhấp để chọn tệp"}
              </h4>
              <span className=" text-center mb-5 block w-full max-w-[290px] text-sm text-gray-700 dark:text-gray-400">
                Hãy chọn hình bạn ưng ý nhất để làm ảnh đại diện cho người dùng này.
              </span>
              <span className="font-medium underline text-theme-sm text-brand-500">
                Thả tệp
              </span>
              {uploadedFile && (
                <div className="mt-2 text-sm text-green-600">
                  Đã chọn: {uploadedFile.name}
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Đang thêm..." : "Thêm người dùng"}
          </button>
          {success && <div className={`mt-2 ${success.includes("thành công") ? "text-green-600" : "text-red-600"}`}>{success}</div>}
        </div>
      </form>
    </ComponentCard>
  );
}
