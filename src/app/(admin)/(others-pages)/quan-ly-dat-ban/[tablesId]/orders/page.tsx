"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import OrderForm from "@/components/tables/OrderForm";
import React from "react";

export default function TableOrderPage({ params }: { params: { tablesId: string } }) {
  // Đảm bảo unwrap params nếu là Promise (Next.js 14+)
  // Nếu params là Promise, dùng React.use() để lấy giá trị thực
  // Nếu không, giữ nguyên để tương thích cũ

  // Cách an toàn cho cả hai trường hợp:
  // @ts-ignore-next-line
  const realParams = typeof params.then === "function" ? React.use(params) : params;
  const tableId = (realParams as { tablesId: string }).tablesId;

  return (
    <div>
      <PageBreadcrumb pageTitle={`Đặt Món Cho Bàn #${tableId}`} />
      <div className="space-y-6">
        <ComponentCard title="Đặt Món">
          <OrderForm tableId={tableId} />
        </ComponentCard>
      </div>
    </div>
  );
}