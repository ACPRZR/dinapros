"use client";

import type { ReactNode } from "react";

type OptionCardProps = {
  icon: ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
};

export default function OptionCard({
  icon,
  label,
  selected,
  onClick,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all min-h-[120px] ${
        selected
          ? "border-accent bg-accent/10"
          : "border-edge bg-card hover:border-accent/50"
      }`}
    >
      <div className={selected ? "text-accent" : "text-dim"}>
        {icon}
      </div>
      <span
        className={`text-sm font-medium text-center leading-tight ${
          selected ? "text-fg" : "text-dim"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
