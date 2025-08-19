"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import React, { useState } from "react";
import StaffList from "@/components/tables/staffs/StaffList";
import StaffForm from "@/components/tables/staffs/StaffFrom";
import NotificationModal from "@/components/tables/NotificationModal";
import ToastMessage from "@/components/common/ToastMessage";
import StaffDetailModal from "@/components/tables/staffs/StaffDetailModal";

interface Staff {
  id: number;
  name: string;
  email?: string;
  phone: string;
  status: number; // 0: ngừng hoạt động, 1: đang hoạt động
  avatar?: string;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
}

interface FormState {
  showForm: boolean;
  editStaff: Staff | null;
  confirmSubmit: boolean;
  pendingFormData: any;
  showToast: boolean;
  loadingSubmit: boolean;
  lastAction: "create" | "update" | null;
  selectedStaff: Staff | null;
  showDetail: boolean;
}

export default function Tables() {
  const [formState, setFormState] = useState<FormState>({
    showForm: false,
    editStaff: null,
    confirmSubmit: false,
    pendingFormData: null,
    showToast: false,
    loadingSubmit: false,
    lastAction: null,
    selectedStaff: null,
    showDetail: false,
  });

  const handleEditStaff = (staff: Staff) => {
    setFormState(prev => ({
      ...prev,
      editStaff: staff,
      showForm: true,
    }));
  };

  const handleFormSubmit = async () => {
    if (!formState.pendingFormData) return;

    setFormState(prev => ({ ...prev, loadingSubmit: true }));

    try {
      const apiClient = (await import("@/lib/apiClient")).default;
      const { editStaff, pendingFormData } = formState;

      if (editStaff) {
        await apiClient.put(`/staff/${editStaff.id}`, {
          name: pendingFormData.name,
          email: pendingFormData.email,
          phone: pendingFormData.phone,
          status: pendingFormData.status,
          ...(pendingFormData.password ? { password: pendingFormData.password } : {}),
        });
      } else {
        await apiClient.post("/staff", {
          name: pendingFormData.name,
          email: pendingFormData.email,
          phone: pendingFormData.phone,
          password: pendingFormData.password,
        });
      }

      setFormState(prev => ({
        ...prev,
        showForm: false,
        editStaff: null,
        showToast: true,
        confirmSubmit: false,
        pendingFormData: null,
        lastAction: editStaff ? "update" : "create",
      }));
    } catch (err: any) {
      console.log("Full error object:", err);
      if (err) {
        alert(err)
      }
      console.log("Error response:", err.response?.data);

      // Xử lý lỗi từ backend với format {status: false, message: "..."}

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
          editStaff: null,
          confirmSubmit: false,
          pendingFormData: null,
        }));
      }
    } else {
      setFormState(prev => ({
        ...prev,
        showForm: false,
        editStaff: null,
      }));
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Quản Lý Nhân Viên" />
      <div
        className="w-full bg-white rounded-2xl border border-gray-200 px-0 py-0 relative"
        style={{ maxWidth: "1488px", marginLeft: "auto", marginRight: "auto", marginTop: "1rem", minHeight: "844px" }}
      >
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <h1 className="text-2xl font-bold text-[#3E2723]">Quản Lý Nhân Viên</h1>
          {!formState.showForm && (
            <button
              className="bg-[#3E2723] hover:bg-[#D4AF37] text-white font-semibold py-2 px-6 rounded-xl shadow transition"
              onClick={() => {
                setFormState(prev => ({
                  ...prev,
                  showForm: true,
                  editStaff: null,
                }));
              }}
              style={{ marginLeft: "auto", marginRight: 0 }}
            >
              + Tạo nhân viên
            </button>
          )}
        </div>
        <div className="px-8 pb-8">
          {formState.showForm ? (
            <div className="w-full bg-white rounded-2xl border border-gray-200 p-0">
              <div className="flex items-center px-6 py-4 relative">
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
                <div className="flex-1 text-center pr-8">
                  <span className="text-xl font-bold text-[#3E2723]">
                    {formState.editStaff ? "Cập Nhật Nhân Viên" : "Tạo Nhân Viên Mới"}
                  </span>
                </div>
              </div>
              <div className="px-8 py-8">
                <StaffForm
                  onSubmit={data => {
                    setFormState(prev => ({
                      ...prev,
                      pendingFormData: data,
                      confirmSubmit: true,
                      lastAction: formState.editStaff ? "update" : "create",
                    }));
                  }}
                  editStaff={formState.editStaff || undefined}
                />
              </div>
            </div>
          ) : (
            <StaffList
              onEditStaff={handleEditStaff}
              onViewStaff={(staff) => {
                setFormState(prev => ({
                  ...prev,
                  selectedStaff: staff,
                  showDetail: true
                }));
              }}
            />
          )}
        </div>
      </div>

      <NotificationModal
        open={formState.confirmSubmit}
        title={
          formState.editStaff
            ? "Bạn có chắc chắn muốn cập nhật thông tin nhân viên này?"
            : "Bạn có chắc chắn muốn tạo nhân viên mới?"
        }
        description={
          formState.editStaff
            ? "Sau khi cập nhật, thông tin nhân viên sẽ được thay đổi."
            : "Sau khi tạo, bạn có thể chỉnh sửa thông tin nhân viên."
        }
        acceptText={formState.loadingSubmit ? (formState.editStaff ? "Đang cập nhật..." : "Đang tạo...") : (formState.editStaff ? "Cập nhật" : "Tạo")}
        rejectText="Hủy"
        onAccept={handleFormSubmit}
        onReject={handleCloseModal}
        onClose={handleCloseModal}
      />

      <ToastMessage
        open={formState.showToast}
        message={
          formState.lastAction === "update"
            ? "Cập nhật nhân viên thành công!"
            : formState.lastAction === "create"
              ? "Tạo nhân viên thành công!"
              : ""
        }
        onClose={() => setFormState(prev => ({ ...prev, showToast: false }))}
      />

      <StaffDetailModal
        isOpen={formState.showDetail}
        onClose={() => setFormState(prev => ({ ...prev, showDetail: false, selectedStaff: null }))}
        staff={formState.selectedStaff}
      />
    </div>
  );
}
