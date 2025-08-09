import React from "react";

interface NotificationModalProps {
  open: boolean;
  title: string;
  description?: string;
  emoji?: React.ReactNode;
  acceptText?: string;
  rejectText?: string;
  onAccept: () => void;
  onReject?: () => void;
  onClose?: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  open,
  title,
  description,
  emoji = <span style={{ fontSize: 28 }}>🤔</span>,
  acceptText = "Accept",
  rejectText = "Reject",
  onAccept,
  onReject,
  onClose,
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/30 transition-opacity duration-200"
      style={{ animation: "fadeInModal 0.25s" }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full relative transition-transform duration-200"
        style={{ animation: "scaleInModal 0.25s" }}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-black"
          onClick={onClose || onReject}
          aria-label="Close"
        >
          <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="mb-2">{emoji}</div>
          <div className="text-lg font-semibold mb-1">{title}</div>
          {description && (
            <div className="text-gray-500 text-sm mb-6">{description}</div>
          )}
          <div className="flex gap-3 w-full mt-2">
            <button
              className="flex-1 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 font-medium hover:bg-gray-100 transition"
              onClick={onReject || onClose}
              type="button"
            >
              {rejectText}
            </button>
            <button
              className="flex-1 py-2 rounded-lg bg-black text-white font-medium hover:bg-gray-900 transition"
              onClick={onAccept}
              type="button"
            >
              {acceptText}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleInModal {
          from { opacity: 0; transform: scale(0.95);}
          to { opacity: 1; transform: scale(1);}
        }
      `}</style>
    </div>
  );
};

export default NotificationModal;
