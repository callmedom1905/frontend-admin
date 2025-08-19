import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Cate from "@/components/tables/Cate";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: " Moo Beef Steak Prime",
  description:
    "Where Prime Cuts Meet Perfection",
    icons: "/images/logo/res.png",
};

export default function Tables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Quản Lý Danh Mục" />
      <div className="space-y-6">
        <ComponentCard title="Quản Lý Danh Mục">
          <Cate />
        </ComponentCard>
      </div>
    </div>
  );
}
