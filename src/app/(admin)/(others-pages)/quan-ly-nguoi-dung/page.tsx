"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import React, { useState } from "react";
import BasicTableOne from "@/components/tables/BasicTableOne";
import UserForm from "@/components/tables/users/UserForm";
import NotificationModal from "@/components/tables/NotificationModal";
import ToastMessage from "@/components/common/ToastMessage";
import UserDetailModal from "@/components/tables/users/UserDetailModal";

interface User {
  id: number;
  name: string;
  email?: string;
  phone: string;
  status: number;
  id_role: number;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
}

interface FormState {
  showForm: boolean;
  editUser: User | null;
  confirmSubmit: boolean;
  pendingFormData: any;
  showToast: boolean;
  loadingSubmit: boolean;
  lastAction: "create" | "update" | null;
  selectedUser: User | null;
  showDetail: boolean;
}

export default function Tables() {
  const [formState, setFormState] = useState<FormState>({
    showForm: false,
    editUser: null,
    confirmSubmit: false,
    pendingFormData: null,
    showToast: false,
    loadingSubmit: false,
    lastAction: null,
    selectedUser: null,
    showDetail: false,
  });

  const handleEditUser = (user: User) => {
    setFormState(prev => ({
      ...prev,
      editUser: user,
      showForm: true,
    }));
  };

  const handleFormSubmit = async () => {
    if (!formState.pendingFormData) return;
    
    setFormState(prev => ({ ...prev, loadingSubmit: true }));
    
    try {
      const apiClient = (await import("@/lib/apiClient")).default;
      const { editUser, pendingFormData } = formState;
      
      if (editUser) {
        await apiClient.patch(`/users/${editUser.id}`, {
          name: pendingFormData.name,
          email: pendingFormData.email,
          phone: pendingFormData.phone,
          status: pendingFormData.status,
          id_role: pendingFormData.id_role,
          ...(pendingFormData.password ? { password: pendingFormData.password } : {}),
        });
      } else {
        await apiClient.post("/users", {
          name: pendingFormData.name,
          email: pendingFormData.email,
          phone: pendingFormData.phone,
          password: pendingFormData.password,
          id_role: pendingFormData.id_role,
        });
      }

      setFormState(prev => ({
        ...prev,
        showForm: false,
        editUser: null,
        showToast: true,
        confirmSubmit: false,
        pendingFormData: null,
        lastAction: editUser ? "update" : "create",
      }));
    } catch (err: any) {
      console.log("Full error object:", err);
      console.log("Error response:", err.response?.data);
      
      // Xử lý lỗi từ backend với format {status: false, message: "..."}
      let errorMessage = "";
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else {
        errorMessage = formState.editUser
          ? "Có lỗi xảy ra khi cập nhật người dùng!"
          : "Có lỗi xảy ra khi tạo người dùng!";
      }
      
      alert(errorMessage);
      
      setFormState(prev => ({
        ...prev,
        confirmSubmit: false,
        pendingFormData: null,
      }));
    } finally {
      setFormState(prev => ({ ...prev, loadingSubmit: false }));
    }
  };

  const handleCloseModal = () => {
    setFormState(prev => ({
      ...prev,
      confirmSubmit: false,
      pendingFormData: null,
    }));
  };

  const handleBackToList = () => {
    if (formState.confirmSubmit) {
      if (window.confirm("Bạn có chắc chắn muốn hủy thao tác này?")) {
        setFormState(prev => ({
          ...prev,
          showForm: false,
          editUser: null,
          confirmSubmit: false,
          pendingFormData: null,
        }));
      }
    } else {
      setFormState(prev => ({
        ...prev,
        showForm: false,
        editUser: null,
      }));
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Quản Lý Người Dùng" />
      <div
        className="w-full bg-white rounded-2xl border border-gray-200 px-0 py-0 relative max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-[1488px] mx-auto mt-4 min-h-[400px] sm:min-h-[600px] md:min-h-[700px] lg:min-h-[844px]"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-8 pt-6 sm:pt-8 pb-4 gap-4">
          <h1 className="text-lg sm:text-2xl font-bold text-[#3E2723]">Quản Lý Người Dùng</h1>
          {!formState.showForm && (
            <button
              className="bg-[#3E2723] hover:bg-[#D4AF37] text-white font-semibold py-2 px-4 sm:px-6 rounded-xl shadow transition w-full sm:w-auto"
              onClick={() => {
                setFormState(prev => ({
                  ...prev,
                  showForm: true,
                  editUser: null,
                }));
              }}
            >
              + Tạo người dùng
            </button>
          )}
        </div>
        <div className="px-2 sm:px-8 pb-4 sm:pb-8">
          {formState.showForm ? (
            <div className="w-full bg-white rounded-2xl border border-gray-200 p-0">
              <div className="flex flex-row items-center px-2 sm:px-6 py-4 gap-2 justify-between">
                <button
                  className="flex items-center gap-2 text-[#3E2723] hover:text-[#D4AF37] font-semibold px-2 py-1 transition bg-transparent"
                  onClick={handleBackToList}
                  aria-label="Quay lại"
                  type="button"
                >
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M15 19l-7-7 7-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div className="flex-1 text-center">
                  <span className="text-base sm:text-xl font-bold text-[#3E2723]">
                    {formState.editUser ? "Cập Nhật Người Dùng" : "Tạo Người Dùng Mới"}
                  </span>
                </div>
              </div>
              <div className="px-2 sm:px-8 py-4 sm:py-8">
                <UserForm
                  onSubmit={data => {
                    setFormState(prev => ({
                      ...prev,
                      pendingFormData: data,
                      confirmSubmit: true,
                      lastAction: formState.editUser ? "update" : "create",
                    }));
                  }}
                  editUser={formState.editUser || undefined}
                />
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <BasicTableOne 
                onEditUser={handleEditUser} 
                onViewUser={(user) => {
                  setFormState(prev => ({
                    ...prev,
                    selectedUser: user,
                    showDetail: true
                  }));
                }}
              />
            </div>
          )}
        </div>
      </div>

      <NotificationModal
        open={formState.confirmSubmit}
        title={
          formState.editUser
            ? "Bạn có chắc chắn muốn cập nhật thông tin người dùng này?"
            : "Bạn có chắc chắn muốn tạo người dùng mới?"
        }
        description={
          formState.editUser
            ? "Sau khi cập nhật, thông tin người dùng sẽ được thay đổi."
            : "Sau khi tạo, bạn có thể chỉnh sửa thông tin người dùng."
        }
        acceptText={formState.loadingSubmit ? (formState.editUser ? "Đang cập nhật..." : "Đang tạo...") : (formState.editUser ? "Cập nhật" : "Tạo")}
        rejectText="Hủy"
        onAccept={handleFormSubmit}
        onReject={handleCloseModal}
        onClose={handleCloseModal}
      />

      <ToastMessage
        open={formState.showToast}
        message={
          formState.lastAction === "update"
            ? "Cập nhật người dùng thành công!"
            : formState.lastAction === "create"
            ? "Tạo người dùng thành công!"
            : ""
        }
        onClose={() => setFormState(prev => ({ ...prev, showToast: false }))}
      />

      <UserDetailModal
        isOpen={formState.showDetail}
        onClose={() => setFormState(prev => ({ ...prev, showDetail: false, selectedUser: null }))}
        user={formState.selectedUser}
      />
    </div>
  );
}
