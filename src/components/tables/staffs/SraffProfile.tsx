import React from "react";
//
const SraffProfile: React.FC<{ staff: any; onClose: () => void }> = ({ staff, onClose }) => {
  if (!staff) return null;
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center"
      style={{
        zIndex: 2147483647, // max z-index to ensure overlay is always on top
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 shadow-2xl p-0 animate-fade-in flex flex-col justify-center items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-6 py-4 border-b border-gray-100 w-full">
          <button
            className="flex items-center gap-2 text-[#3E2723] hover:text-[#D4AF37] font-semibold px-2 py-1 transition bg-transparent"
            onClick={onClose}
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
              Thông Tin Nhân Viên
            </span>
          </div>
        </div>
        <div className="px-8 py-8 flex flex-col items-center w-full">
          <div className="flex flex-col items-center gap-2 w-full">
            <img
              src={staff.avatar || staff.profile_image}
              alt={staff.name}
              className="w-28 h-28 rounded-full object-cover border-4 border-[#D4AF37] shadow-lg mb-4"
            />
            <div className="text-2xl font-bold text-[#3E2723] mb-1">{staff.name}</div>
            <div className="flex flex-col gap-2 w-full max-w-md mt-4">
              <div className="flex items-center">
                <span className="w-32 text-gray-500 font-medium">Email:</span>
                <span className="text-gray-800">{staff.email}</span>
              </div>
              <div className="flex items-center">
                <span className="w-32 text-gray-500 font-medium">Số điện thoại:</span>
                <span className="text-gray-800">{staff.phone}</span>
              </div>
              <div className="flex items-center">
                <span className="w-32 text-gray-500 font-medium">Trạng thái:</span>
                <span className={staff.active === 1 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                  {staff.active === 1 ? "Hoạt động" : "Ẩn"}
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-32 text-gray-500 font-medium">Ngày tạo:</span>
                <span className="text-gray-800">
                  {staff.created_at
                    ? new Date(staff.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SraffProfile;
