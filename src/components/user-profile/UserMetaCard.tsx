"use client";
import React from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function UserMetaCard() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg bg-white p-6 shadow-default dark:bg-boxdark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow-default dark:bg-boxdark">
        <p>Could not load user profile.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-6 text-center border-b border-stroke dark:border-gray-800">
            <div className="relative mx-auto mb-4 h-32 w-32">
                <Image
                    width={128}
                    height={128}
                    src={`/images/user/${user.profile_image || 'user-01.jpg'}`}
                    alt="profile"
                    className="rounded-full"
                />
            </div>
            <h3 className="mb-1.5 text-xl font-semibold text-black dark:text-white/90">
            {user.name}
            </h3>
            <p className="mb-2.5 font-medium text-gray-600 dark:text-gray-400">{user.role.name}</p>
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
  );
}