"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function UserInfoCard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg bg-white p-10 shadow-default dark:bg-boxdark">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg bg-white p-10 text-center shadow-default dark:bg-boxdark">
        <p className="text-red-500">Không tìm thấy thông tin người dùng.</p>
      </div>
    );
  }

  return (
    <>
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="p-6">
                 <div className="space-y-4">
                     <div className="grid grid-cols-3 items-center">
                        <p className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Họ và Tên</p>
                        <p className="col-span-2 text-black dark:text-white/90">{user.name}</p>
                    </div>
                     <div className="grid grid-cols-3 items-center">
                        <p className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                        <p className="col-span-2 text-black dark:text-white/90">{user.email}</p>
                    </div>
                     <div className="grid grid-cols-3 items-center">
                        <p className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Số điện thoại</p>
                        <p className="col-span-2 text-black dark:text-white/90">{user.phone || 'Chưa cập nhật'}</p>
                    </div>
                     <div className="grid grid-cols-3 items-center">
                        <p className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Trạng thái</p>
                        <div className="col-span-2">
                            <span
                            className={`px-3 py-1 text-sm font-medium rounded-full ${
                                user.deleted_at
                                ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                            }`}
                            >
                            {user.deleted_at ? "Không hoạt động" : "Hoạt động"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {/* <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-black dark:text-white/90 mb-4">Tiến độ dự án</h3>
                <div className="space-y-4">
                    {projectStatus.map((project, index) => (
                        <ProgressBar key={index} title={project.title} percentage={project.percentage} color={project.color}/>
                    ))}
                </div>
            </div>
        </div>
        <div className="pt-6">
            <div className="flex items-center gap-4">
                <a href="#" className="text-gray-500 transition hover:text-primary dark:text-gray-400 dark:hover:text-primary">
                    <FiFacebook size={20} />
                </a>
                <a href="#" className="text-gray-500 transition hover:text-primary dark:text-gray-400 dark:hover:text-primary">
                    <FiTwitter size={20} />
                </a>
                <a href="#" className="text-gray-500 transition hover:text-primary dark:text-gray-400 dark:hover:text-primary">
                    <FiInstagram size={20} />
                </a>
            </div>
        </div> */}
    </>
  );
}
