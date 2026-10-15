-- 전체활동을 성격별(마을학교 활동 / 함께하는 공동활동 / 대표자 네트워크)로
-- 구분해서 보여주기 위한 migration입니다.
-- 기존 activities 데이터는 절대 지우지 않고, 새 분류 값만 안전하게 채워 넣습니다.
-- Supabase 대시보드 SQL Editor에서 그대로 실행하시면 됩니다. (여러 번 실행해도 안전합니다)

-- 1) 활동 성격 값을 담을 새 컬럼 추가
alter table public.activities
  add column if not exists activity_category text;

-- 2) 기존 데이터 안전 이전
--    - 마을학교 활동(activity_type = 'school')은 전부 '마을학교 활동'으로
--    - 기존 연합활동(activity_type = 'community')은 우선 전부 '함께하는 공동활동'으로 채워둡니다.
--      (실제로는 대표자 회의/연수 성격인 것도 섞여 있을 수 있으니,
--       관리자 화면에서 해당 활동을 열어 "대표자 네트워크"로 바꿔주시면 됩니다.)
update public.activities
  set activity_category = 'school'
  where activity_type = 'school' and activity_category is null;

update public.activities
  set activity_category = 'joint_program'
  where activity_type = 'community' and activity_category is null;

-- 3) 값 검증 규칙 + 기본값
alter table public.activities
  alter column activity_category set default 'school';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'activities_activity_category_check'
  ) then
    alter table public.activities
      add constraint activities_activity_category_check
      check (activity_category in ('school', 'joint_program', 'network'));
  end if;
end $$;

alter table public.activities
  alter column activity_category set not null;

-- 4) 필터 조회 성능을 위한 인덱스
create index if not exists activities_activity_category_idx
  on public.activities (activity_category);
