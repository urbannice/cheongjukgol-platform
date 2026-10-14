-- =========================================================
-- 마을학교 구조 정리: 대표자 소개 통합 / 프로그램 정보 / 이메일 /
-- 운영장소 / 함께하는 활동가 / 여러 개의 SNS 링크
--
-- 기존 컬럼(team_intro, specialties, main_activities, programs,
-- external_link)은 삭제하지 않고 그대로 남겨둡니다. 새 컬럼으로
-- 내용을 복사만 하고, 화면에서는 새 컬럼을 사용합니다.
-- 여러 번 실행해도 안전합니다.
-- =========================================================

-- 1) schools 테이블에 새 컬럼 추가 --------------------------------
alter table schools add column if not exists email text;
alter table schools add column if not exists show_email boolean not null default true;
alter table schools add column if not exists location_name text;
alter table schools add column if not exists representative_photo text;
alter table schools add column if not exists representative_bio text;
alter table schools add column if not exists has_activists boolean not null default false;
alter table schools add column if not exists activist_photo text;
alter table schools add column if not exists program_name text;
alter table schools add column if not exists program_description text;
alter table schools add column if not exists program_schedule text;

-- 2) 기존 데이터를 새 컬럼으로 안전하게 복사 (새 컬럼이 비어있을 때만) ---
update schools
set representative_bio = trim(both E'\n' from
  coalesce(team_intro, '') ||
  case when team_intro is not null and specialties is not null then E'\n\n전문분야: ' else
    case when specialties is not null then '전문분야: ' else '' end
  end ||
  coalesce(specialties, '')
)
where representative_bio is null
  and (team_intro is not null or specialties is not null);

update schools
set program_name = programs
where program_name is null and programs is not null and programs <> '';

update schools
set program_description = main_activities
where program_description is null and main_activities is not null and main_activities <> '';

-- 3) 여러 개의 SNS/외부링크를 담을 새 테이블 -------------------------
create table if not exists school_contact_links (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  link_type text not null default 'other',
  label text,
  url text not null,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_school_contact_links_school
  on school_contact_links(school_id, display_order);

alter table school_contact_links enable row level security;

drop policy if exists school_contact_links_public_read on school_contact_links;
create policy school_contact_links_public_read
  on school_contact_links for select using (is_visible = true);

-- 기존에 학교마다 하나씩 있던 external_link를 새 테이블로 옮깁니다.
-- (이미 옮겨졌다면 중복 삽입하지 않습니다)
insert into school_contact_links (school_id, link_type, label, url, display_order, is_visible)
select s.id, 'other', null, s.external_link, 0, true
from schools s
where s.external_link is not null
  and s.external_link <> ''
  and not exists (
    select 1 from school_contact_links l
    where l.school_id = s.id and l.url = s.external_link
  );

-- 4) 사이트 기본 주소(선택) - 나중에 자체 도메인 연결 시 사용, QR 생성 기준 --
alter table site_settings add column if not exists site_base_url text;
