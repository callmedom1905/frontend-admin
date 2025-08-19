import React, { useEffect } from "react";

interface ToastMessageProps {
  open: boolean;
  message: React.ReactNode; 
  onClose?: () => void;
}

const ToastMessage: React.FC<ToastMessageProps> = ({ open, message, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 2500);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed top-6 right-6 z-[99999] animate-toast-in"
      style={{ minWidth: 320, maxWidth: 400 }}
    >
      <div className="flex items-center bg-white rounded-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.18)] px-4 py-3 border border-gray-200">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#E6F9EB] mr-3">
          {/* Green check icon */}
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#E6F9EB"/>
            <path d="M8 12.5L11 15.5L16 10.5" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className="text-gray-800 text-base font-medium">{message}</span>
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-24px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-toast-in { animation: toast-in 0.35s cubic-bezier(.4,0,.2,1); }
      `}</style>
    </div>
  );
};

export default ToastMessage;