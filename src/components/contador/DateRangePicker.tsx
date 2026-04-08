// components/contador/DateRangePicker.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (range: { startDate: Date; endDate: Date }) => void;
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [showPresets, setShowPresets] = useState(false);
  const presetsRef = useRef<HTMLDivElement>(null);

  const presets = [
    { label: "Hoje", getValue: () => {
      const today = new Date();
      return { startDate: today, endDate: today };
    }},
    { label: "Ontem", getValue: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return { startDate: yesterday, endDate: yesterday };
    }},
    { label: "Últimos 7 Dias", getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return { startDate: start, endDate: end };
    }},
    { label: "Últimos 30 Dias", getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return { startDate: start, endDate: end };
    }},
    { label: "Este Mês", getValue: () => {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date()
      };
    }},
    { label: "Mês Passado", getValue: () => {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0)
      };
    }},
    { label: "Este Ano", getValue: () => {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date()
      };
    }},
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (presetsRef.current && !presetsRef.current.contains(event.target as Node)) {
        setShowPresets(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetClick = (preset: typeof presets[0]) => {
    const range = preset.getValue();
    onChange(range);
    setShowPresets(false);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="relative" ref={presetsRef}>
      <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg p-1">
        <input
          type="date"
          value={formatDate(startDate)}
          onChange={(e) => onChange({ startDate: new Date(e.target.value), endDate })}
          className="px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-500">até</span>
        <input
          type="date"
          value={formatDate(endDate)}
          onChange={(e) => onChange({ startDate, endDate: new Date(e.target.value) })}
          className="px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
        >
          <Calendar className="h-4 w-4 text-gray-600 mr-1" />
          <ChevronDown className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {showPresets && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
          <div className="py-2">
            {presets.map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePresetClick(preset)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}