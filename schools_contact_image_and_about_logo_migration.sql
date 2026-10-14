-- 1) 마을학교별 "연락처 페이지 대표이미지"를 위한 컬럼
--    (연락처 통합 페이지에서만 쓰는 별도 이미지. 기존 대표자 사진/대표이미지는 그대로 유지됩니다)
alter table public.schools
  add column if not exists contact_image text;

-- 2) 소개페이지 전용 타이틀 로고를 위한 컬럼
--    (기존 site_settings.logo_image는 헤더 로고, 이번에 추가하는 about_logo_image는 /about 페이지 전용)
alter table public.site_settings
  add column if not exists about_logo_image text;
