"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [   loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const { login, loginByPhone } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (loginMethod === 'email') {
        await login(email, password);
      } else {
        await loginByPhone(phone, password);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
      <div>
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Đăng Nhập
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nhập thông tin đăng nhập của bạn!
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-500 bg-red-100 rounded-lg dark:bg-red-900/50">
            {error}
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-lg ${loginMethod === 'email'
                ?'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' 
                : 'bg-primary-500'
              }`}
            onClick={() => setLoginMethod('email')}
          >
            Đăng nhập bằng Email
          </button>
          <button
            type="button"
            className={`w-1/2 flex-1 py-2 text-sm font-medium rounded-lg ${loginMethod === 'phone'
                ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' 
                : 'bg-primary-500 '
              }`}
            onClick={() => setLoginMethod('phone')}
          >
            Đăng nhập bằng SĐT
          </button>
        </div>

        <form onSubmit={handleSignIn}>
          <div className="space-y-6">
            {loginMethod === 'email' ? (
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="info@gmail.com"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            ) : (
              <div>
                <Label>
                  Số điện thoại <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="0123456789"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <Label>
                Mật khẩu <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu của bạn"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                className="w-5 h-5"
                checked={isChecked}
                onChange={setIsChecked}
                disabled={loading}
              />
              <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                Ghi nhớ đăng nhập
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
