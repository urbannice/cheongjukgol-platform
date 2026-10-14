-- =========================================================
-- 사이트 설정 (홈페이지 메인 콘텐츠) - 싱글톤 테이블
-- 사이트가 하나이므로 항상 id='main' 딱 한 행만 존재합니다.
-- =========================================================
create table if not exists site_settings (
  id text primary key default 'main',

  -- Hero
  hero_image text,
  hero_title text not null default '마을에서 배우고, 마을과 함께 성장합니다.',
  hero_description text not null default '전남 담양 지역의 여러 마을학교가 함께 모여, 각자의 마을에서 아이들과 어른들이 배우고 성장하는 이야기를 만들어가고 있습니다.',
  hero_cta_text text not null default '마을학교 만나보기',
  hero_cta_url text not null default '/schools',

  -- 청죽골 소개
  about_title text not null default '청죽골마을교육공동체 소개',
  about_text text not null default '전남 담양 지역의 여러 마을학교가 함께 모여, 각자의 마을에서 아이들과 어른들이 배우고 성장하는 이야기를 만들어가고 있습니다.',
  about_image text,

  -- 청죽골 공동활동 소개
  community_title text not null default '청죽골연합회 공동활동',
  community_text text not null default '각자의 마을에서 시작해, 함께 더 큰 배움의 연결을 만듭니다.',
  community_image text,

  -- Community Message (마지막 강조문구)
  closing_message text not null default '각자의 마을에서 시작해, 함께 더 큰 배움의 연결을 만듭니다.',

  -- Footer
  footer_text text not null default '청죽골마을교육공동체는 전남 담양 지역 마을학교들이 함께 만들어가는 교육공동체입니다.',
  footer_contact text,
  copyright_text text not null default '© 청죽골마을교육공동체',

  -- 섹션 노출 여부
  show_about boolean not null default true,
  show_recent_activities boolean not null default true,
  show_community boolean not null default true,

  updated_at timestamptz not null default now(),
  updated_by text
);

-- 싱글톤 행이 항상 하나는 존재하도록 기본값 삽입
insert into site_settings (id) values ('main')
on conflict (id) do nothing;

alter table site_settings enable row level security;

-- 방문자는 읽기만 가능 (관리자 쓰기는 서버의 Secret key로 RLS 우회)
drop policy if exists "site_settings_public_read" on site_settings;
create policy "site_settings_public_read" on site_settings
  for select using (true);
