"use client";

export function PrintButton() {
  return (
    <button className="secondary" type="button" onClick={() => window.print()}>
      In / Lưu PDF
    </button>
  );
}
