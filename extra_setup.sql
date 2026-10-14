-- =========================================================
-- 관리자번호 반복 입력 제한용 표 (보안 요구사항)
-- =========================================================
create table if not exists admin_login_attempts (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  attempted_at timestamptz not null default now()
);
create index if not exists idx_admin_login_attempts_ip_time on admin_login_attempts(ip, attempted_at);

alter table admin_login_attempts enable row level security;
-- 방문자는 이 표에 전혀 접근할 수 없습니다 (정책 없음 = 접근 불가). 서버(Secret key)만 사용합니다.

-- =========================================================
-- 초기 데이터: 현재 참여 중인 10개 마을학교
-- (대표자명/전화번호/주소 등 개인정보는 비워두었습니다. 관리자 화면에서 입력해주세요.)
-- =========================================================
insert into schools (name, slug, display_order) values
  ('늘푸름수북마을학교', 'neulpureum-subuk', 1),
  ('소나기마을학교', 'sonagi', 2),
  ('월산휘게마을학교', 'wolsan-hygge', 3),
  ('무정사랑마을학교', 'mujeong-sarang', 4),
  ('인문창작마을학교', 'inmun-changjak', 5),
  ('봉우리마을학교', 'bongwoori', 6),
  ('슬로우마을학교', 'slow', 7),
  ('추월산마을학교', 'chuwolsan', 8),
  ('꿈꾸는마을학교', 'kkumkkuneun', 9),
  ('샘물마을학교', 'saemmul', 10)
on conflict (slug) do nothing;
