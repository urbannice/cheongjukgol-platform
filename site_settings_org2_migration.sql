-- 담양군 로고/기관명을 담양교육지원청과 별도로 관리하기 위한 컬럼 추가
-- 기존 데이터에는 영향을 주지 않으며, 새 컬럼만 추가합니다.

alter table public.site_settings
  add column if not exists org2_name text default '담양군',
  add column if not exists org2_logo_image text;

update public.site_settings set org2_name = '담양군' where org2_name is null;
