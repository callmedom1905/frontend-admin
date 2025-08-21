"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { FiGlobe, FiGithub, FiTwitter, FiInstagram, FiFacebook } from "react-icons/fi";

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

  const socialLinks = [
    { icon: <FiGlobe/>, name: "Trang web", value: "https://bootdey.com", href: "#" },
    { icon: <FiGithub/>, name: "Github", value: "bootdey", href: "#" },
    { icon: <FiTwitter/>, name: "Twitter", value: "@bootdey", href: "#" },
    { icon: <FiInstagram/>, name: "Instagram", value: "bootdey", href: "#" },
    { icon: <FiFacebook/>, name: "Facebook", value: "bootdey", href: "#" },
  ]

  return (
    <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-6 text-center border-b border-stroke dark:border-gray-800">
            <div className="relative mx-auto mb-4 h-32 w-32">
                <img
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
        {/* <div className="p-6">
            <ul className="space-y-4">
                {socialLinks.map((link, index) => (
                    <li key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 dark:text-gray-400">{link.icon}</span>
                            <span className="font-medium text-black dark:text-white/90">{link.name}</span>
                        </div>
                        <a href={link.href} className="text-sm text-primary hover:underline">{link.value}</a>
                    </li>
                ))}
            </ul>
        </div> */}
    </div>
  );
}