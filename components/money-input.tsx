"use client";
import type { InputHTMLAttributes } from "react";

// "58000" -> "58.000". Chi giu chu so, them dau cham phan nghin.
function formatThousands(raw: string): string {
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

interface MoneyInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type" | "inputMode"
  > {
  value: string;
  // Tra ve chuoi chu so tho (vd "58000") de parent luu nguyen state cu.
  onValueChange: (raw: string) => void;
}

export function MoneyInput({ value, onValueChange, className, ...rest }: MoneyInputProps) {
  return (
    <div className="relative shrink-0">
      <span className="num pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted">
        đ
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={formatThousands(value)}
        onChange={(e) => onValueChange(e.target.value.replace(/\D/g, ""))}
        className={`!pl-7 ${className ?? ""}`}
        {...rest}
      />
    </div>
  );
}
