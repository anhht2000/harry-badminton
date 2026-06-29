// Logo thương hiệu: con cầu lông (shuttlecock) tối giản — cork tròn ở đáy,
// chùm lông xòe lên trên, vài gân lông. Dùng currentColor để theo tông amber.
// Tái dùng ở header (badge) và footer. variant "mark" chỉ icon; "lockup" kèm chữ.

export function ShuttlecockMark({
  size = 18,
  className
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* Cork (đầu tròn ở đáy) */}
      <path d="M8.7 15.1c0 2.7 1.3 5 3.3 5s3.3-2.3 3.3-5" />
      {/* Vành nối lông với cork */}
      <path d="M8.7 15.1c1.1.8 5.5.8 6.6 0" />
      {/* Hai cạnh chùm lông xòe lên */}
      <path d="M8.7 15.1 5.1 5.3" />
      <path d="M15.3 15.1 18.9 5.3" />
      {/* Vòng cung đầu lông */}
      <path d="M5.1 5.3c3.4-1.8 10.4-1.8 13.8 0" />
      {/* Gân lông */}
      <path d="M12 15.4V4" />
      <path d="M10.3 15.2 8.4 4.8" />
      <path d="M13.7 15.2 15.6 4.8" />
    </svg>
  );
}
