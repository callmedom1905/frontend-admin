import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AdTables from "@/components/tables/AdTables";
import { Metadata } from "next";
import React from "react";
import Link from "next/link";
import data from "@/model/data.json";

export const metadata: Metadata = {
  title: " Moo Beef Steak Prime",
  description: "Where Prime Cuts Meet Perfection",
  icons: "/images/logo/res.png",
};



export default async function Tables({ params }: { params: { tablesId: string } }) {
  const { tablesId } = await params;
console.log({tablesId});
  return (
    <div>
      <PageBreadcrumb pageTitle="Trang Hóa Đơn" />
      <div className="space-y-6">
        <ComponentCard title="Quản Lý Hóa Đơn">
          <AdTables tableId={tablesId} />

        </ComponentCard>
      </div>
    </div>
  );
}
