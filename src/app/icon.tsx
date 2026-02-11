import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#111111",
          borderRadius: "96px",
        }}
      >
        <svg
          width="320"
          height="320"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FB3000"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="3" y1="8" x2="21" y2="8" />
          <circle cx="8" cy="12" r="0.5" fill="#FB3000" />
          <line x1="10" y1="12" x2="18" y2="12" stroke="white" />
          <circle cx="8" cy="16" r="0.5" fill="#FB3000" />
          <line x1="10" y1="16" x2="16" y2="16" stroke="white" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
