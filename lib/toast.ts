// 관리자 화면 어디서든 "저장이 완료되었습니다." 같은 안내를 화면에 잠깐 띄우기 위한 도우미입니다.
// 화면 맨 위 ToastHost가 이 신호를 받아서 보여줍니다.
export const TOAST_EVENT = "admin-toast";

export function showToast(message = "저장이 완료되었습니다.") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: message }));
}
