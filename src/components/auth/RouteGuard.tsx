"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { user, loading, initializeAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Initialize authentication on component mount
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!loading) {
      // If not authenticated, redirect to login
      if (!user) {
        router.push("/signin");
        return;
      }

      // If role restrictions are specified, check user role
      if (allowedRoles && allowedRoles.length > 0) {
        const userRole = user.role?.guard_name;
        if (!userRole || !allowedRoles.includes(userRole)) {
          router.push("/signin");
          return;
        }
      }
    }
  }, [user, loading, allowedRoles, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If not authenticated, don't render children
  if (!user) {
    return null;
  }

  // If role restrictions are specified and user doesn't have required role
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role?.guard_name;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return null;
    }
  }

  // User is authenticated and has required role, render children
  return <>{children}</>;
} 