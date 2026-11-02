// 전화번호를 화면에 글자로 보여주지 않고, 누르면 바로 전화가 연결되는 버튼입니다.
export default function CallButton({
  phone,
  schoolName,
  className = "",
}: {
  phone: string;
  schoolName: string;
  className?: string;
}) {
  return (
    <a
      href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
      aria-label={`${schoolName}에 전화하기`}
      className={`btn-secondary inline-flex items-center justify-center gap-2 text-sm ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
      전화하기
    </a>
  );
}
