import React from "react";
import StatsCards from "@/components/charts/StatsCards";
import MonthlySalesBarChart from "@/components/charts/MonthlySalesBarChart";
import TopProductsTable from "@/components/charts/TopProductsTable";
import TopCustomersTable from "@/components/charts/TopCustomersTable";

export default function BarChartPage() {
  return (
    <div className="p-6 space-y-8">
      <StatsCards />
      <MonthlySalesBarChart />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopProductsTable />
        <TopCustomersTable />
      </div>
    </div>
  );
}
