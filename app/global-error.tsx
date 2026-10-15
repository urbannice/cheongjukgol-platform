"use client";

// 예상하지 못한 서버 오류가 발생했을 때 보여주는 화면입니다.
// 원래는 화면이 그냥 하얗게 깨졌는데, 방문자에게 무슨 상황인지 알려주고
// 다시 시도할 수 있게 안내 문구와 버튼을 보여줍니다.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fafaf9",
          color: "#292524",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            일시적인 오류가 발생했습니다
          </p>
          <p style={{ fontSize: 14, color: "#78716c", marginBottom: 20 }}>
            잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게
            아래 오류 코드와 함께 알려주세요.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: 12,
                color: "#a8a29e",
                marginBottom: 20,
                fontFamily: "monospace",
              }}
            >
              오류 코드: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              padding: "10px 20px",
              background: "#292524",
              color: "#fff",
              borderRadius: 8,
              border: "none",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
