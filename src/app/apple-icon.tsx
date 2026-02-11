import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          borderRadius: "36px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "6px",
                backgroundColor: "#FB3000",
              }}
            />
            <div
              style={{
                width: "80px",
                height: "6px",
                borderRadius: "3px",
                backgroundColor: "white",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "6px",
                backgroundColor: "#FB3000",
              }}
            />
            <div
              style={{
                width: "60px",
                height: "6px",
                borderRadius: "3px",
                backgroundColor: "white",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "6px",
                backgroundColor: "#FB3000",
                opacity: 0.5,
              }}
            />
            <div
              style={{
                width: "50px",
                height: "6px",
                borderRadius: "3px",
                backgroundColor: "white",
                opacity: 0.5,
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
