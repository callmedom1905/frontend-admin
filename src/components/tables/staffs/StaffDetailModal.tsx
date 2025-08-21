import React from "react";
import { Modal } from "../../ui/modal";
import { FiUser, FiMail, FiPhone, FiCalendar, FiShield } from "react-icons/fi";
import Badge from "../../ui/badge/Badge";

interface Staff {
  id: number;
  name: string;
  email?: string;
  phone: string;
  status: number;
  avatar?: string;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
}

interface StaffDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
}

function StaffDetailModal({ isOpen, onClose, staff }: StaffDetailModalProps) {
  if (!staff) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        onClick={handleBackdropClick}
      >
        <div className="p-6 max-w-2xl w-full bg-white rounded-xl shadow-lg mx-auto relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full focus:outline-none"
            aria-label="Đóng"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Chi tiết nhân viên
            </h3>
          </div>

          <div className="space-y-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                {staff.profile_image ? (
                  <img
                    width={96}
                    height={96}
                    src={
                      staff.profile_image.startsWith("http") || staff.profile_image.startsWith("/")
                        ? staff.profile_image
                        : `/images/staff/${staff.profile_image}`
                    }
                    alt={staff.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-1">{staff.name}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiShield className="w-4 h-4" />
                  <span>Nhân viên</span>
                </div>
                <div className="mt-2">
                  <Badge
                    color={staff.status === 1 ? "success" : "error"}
                  >
                    {staff.status === 1 ? "Đang hoạt động" : "Ngừng hoạt động"}
                  </Badge>
                </div>
              </div>
            </div>
            <h5 className="font-semibold text-gray-900">Thông tin tài khoản</h5>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FiMail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{staff.email || 'Chưa cập nhật'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FiPhone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="text-gray-900">{staff.phone}</p>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiCalendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Ngày tạo</p>
                    <p className="text-gray-900">
                      {staff.created_at ? new Date(staff.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiCalendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                    <p className="text-gray-900">
                      {staff.updated_at ? new Date(staff.updated_at).toLocaleDateString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default StaffDetailModal; 