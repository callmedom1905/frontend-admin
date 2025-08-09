// import UserAddressCard from "@/components/user-profile/UserAddressCard";
import { Metadata } from "next";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân | Moo Beef Steak",
  description: "Trang hồ sơ cá nhân của bạn",
  icons: "/images/logo/res.png",
};

export default function Profile() {
  return (
    <div className="border rounded-2xl dark:bg-gray-900">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <UserMetaCard />
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <UserInfoCard />
                </div>
            </div>
        </div>
    </div>
  );
}
