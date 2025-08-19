"use client";
import React, { useState, useEffect  } from "react";
import StatsCards from "@/components/charts/StatsCards";
import MonthlySalesBarChart from "@/components/charts/MonthlySalesBarChart";
import TopProductsTable from "@/components/charts/TopProductsTable";
import TopCustomersTable from "@/components/charts/TopCustomersTable";
import FilterPeriod from "@/components/charts/FilterPeriod";
import SeoDashboard from "@/components/dashboard/SeoDashboard";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'1' | '3' | '6' | '9' | '12' | '24'>('1');
 const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/signin");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  if (user?.role?.guard_name === 'staff') {
    return (
      <>
        <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950" style={{ minHeight: '50vh' }}>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Xin chào, {user.name}!</h1>
        </div>
      </>
    )
  }
  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-6 sm:space-y-8">
      {/* Filter Period */}
      <div className="-mx-2 sm:mx-0">
        <FilterPeriod 
          selectedPeriod={selectedPeriod} 
          onPeriodChange={setSelectedPeriod} 
        />
      </div>

      {/* Stats Cards */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[340px] sm:min-w-0">
          <StatsCards period={selectedPeriod} />
        </div>
      </div>

      {/* Sales Chart */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[340px] sm:min-w-0">
          <MonthlySalesBarChart />
        </div>
      </div>

      {/* Top Products & Customers */}
      <div className="flex flex-col gap-6 md:grid md:grid-cols-2">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[340px] sm:min-w-0">
            <TopProductsTable />
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[340px] sm:min-w-0">
            <TopCustomersTable />
          </div>
        </div>
      </div>

      {/* SEO Dashboard tích hợp */}
      {/* <SeoDashboard /> */}
    </div>
  );
}
