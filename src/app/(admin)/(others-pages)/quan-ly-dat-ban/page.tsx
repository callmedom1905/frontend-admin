import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import BookTables from "@/components/tables/BookTables";
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
      <PageBreadcrumb pageTitle="Quản Lý Đặt Bàn" />
      <div className="space-y-6">
        <ComponentCard title="Quản Lý Đặt Bàn">
          <BookTables />
        </ComponentCard>
      </div>
    </div>
  );
}
