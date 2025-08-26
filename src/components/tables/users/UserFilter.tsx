import React, { useRef, useState, useEffect } from "react";

interface UserFilterProps {
  onFilterChange: (filters: {
    search: string;
    status: "all" | "active" | "inactive";
  }) => void;
}

const UserFilter: React.FC<UserFilterProps> = ({ onFilterChange }) => {
  const [dropdown, setDropdown] = useState<{ type: null | "status"; open: boolean; anchor: HTMLElement | null }>({
    type: null,
    open: false,
    anchor: null,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    onFilterChange({ search, status });
  }, [search, status, onFilterChange]);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdown.open &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(dropdown.anchor && dropdown.anchor.contains(event.target as Node))
      ) {
        setDropdown({ type: null, open: false, anchor: null });
      }
    }
    if (dropdown.open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdown]);

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 text-[14px] relative z-10">
      {/* Input tìm kiếm */}
      <input
        type="text"
        className="border px-2 py-1 rounded bg-white text-gray-900 w-full sm:w-auto"
        placeholder="Tìm kiếm tên, email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {/* Dropdown trạng thái */}
      <div className="relative w-full sm:w-auto">
        <button
          className="border px-2 py-1 rounded bg-white min-w-[140px] w-full sm:w-auto text-left truncate text-gray-900"
          onClick={e =>
            setDropdown({
              type: "status",
              open: dropdown.type !== "status" || !dropdown.open,
              anchor: e.currentTarget,
            })
          }
          type="button"
        >
          <span className="block truncate">
            {status === "all"
              ? "Tất cả trạng thái"
              : status === "active"
              ? "Đang hoạt động"
              : "Ngừng hoạt động"}
          </span>
        </button>
        {dropdown.open && dropdown.type === "status" && (
          <div
            ref={dropdownRef}
            className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg"
          >
            <ul>
              <li
                className={`px-4 py-2 cursor-pointer hover:bg-[#F8F5F0] ${status === "all" ? "text-[#3E2723] font-semibold" : ""} truncate`}
                style={{ whiteSpace: "nowrap" }}
                onClick={() => {
                  setStatus("all");
                  setDropdown({ type: null, open: false, anchor: null });
                }}
              >
                Tất cả trạng thái
              </li>
              <li
                className={`px-4 py-2 cursor-pointer hover:bg-[#F8F5F0] ${status === "active" ? "text-[#3E2723] font-semibold" : ""} truncate`}
                style={{ whiteSpace: "nowrap" }}
                onClick={() => {
                  setStatus("active");
                  setDropdown({ type: null, open: false, anchor: null });
                }}
              >
                Đang hoạt động
              </li>
              <li
                className={`px-4 py-2 cursor-pointer hover:bg-[#F8F5F0] ${status === "inactive" ? "text-[#3E2723] font-semibold" : ""} truncate`}
                style={{ whiteSpace: "nowrap" }}
                onClick={() => {
                  setStatus("inactive");
                  setDropdown({ type: null, open: false, anchor: null });
                }}
              >
                Ngừng hoạt động
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserFilter; 