import React from "react";

interface FilterPeriodProps {
  selectedPeriod: '1' | '3' | '6' | '9' | '12' | '24';
  onPeriodChange: (period: '1' | '3' | '6' | '9' | '12' | '24') => void;
}

const periods = [
  { value: '1' as const, label: '1 tháng' },
  { value: '3' as const, label: '3 tháng' },
  { value: '6' as const, label: '6 tháng' },
  { value: '9' as const, label: '9 tháng' },
  { value: '12' as const, label: '12 tháng' },
  { value: '24' as const, label: '24 tháng' },
];

export default function FilterPeriod({ selectedPeriod, onPeriodChange }: FilterPeriodProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
      <h3 className="font-semibold mb-3 text-gray-800">Lọc theo thời gian</h3>
      <div className="flex flex-wrap gap-2">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onPeriodChange(period.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === period.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}
