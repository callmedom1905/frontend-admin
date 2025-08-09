"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import OrderForm from "@/components/tables/OrderForm";
import React from "react";

export default function TableOrderPage({ params }: { params: { tablesId: string } | Promise<{ tablesId: string }> }) {
  // Đảm bảo unwrap params nếu là Promise (Next.js 14+)
  const isPromise = typeof params === "object" && params !== null && typeof (params as Promise<{ tablesId: string }> ).then === "function";
  const realParams = isPromise ? React.use(params as Promise<{ tablesId: string }>) : params;
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