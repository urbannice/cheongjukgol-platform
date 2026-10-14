-- 사이트 설정(site_settings) 테이블을 만듭니다.
-- 이미 테이블이 있어도, 없는 컬럼만 추가되므로 여러 번 실행해도 안전합니다.

create table if not exists site_settings (
  id text primary key default 'main',
  logo_image text,
  hero_image text,
  hero_title text,
  hero_description text,
  hero_cta_text text,
  hero_cta_url text,
  about_title text,
  about_text text,
  about_body text,
  about_image text,
  community_title text,
  community_text text,
  community_image text,
  closing_message text,
  footer_text text,
  footer_contact text,
  copyright_text text,
  show_about boolean not null default true,
  show_recent_activities boolean not null default true,
  show_community boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- 혹시 테이블은 있었는데 컬럼이 빠져 있던 경우를 대비한 안전장치입니다.
alter table site_settings add column if not exists logo_image text;
alter table site_settings add column if not exists about_body text;

-- 기본 행(main)을 하나 넣습니다. 이미 있으면 건드리지 않습니다.
insert into site_settings (
  id, hero_title, hero_description, hero_cta_text, hero_cta_url,
  about_title, about_text, community_title, community_text,
  closing_message, footer_text, copyright_text
) values (
  'main',
  '마을에서 배우고, 마을과 함께 성장합니다.',
  '청죽골마을교육공동체의 마을학교들을 소개합니다.',
  '마을학교 둘러보기',
  '/schools',
  '청죽골 소개',
  '전남 담양의 여러 마을학교가 함께 모여 만든 지역교육공동체입니다.',
  '청죽골 공동활동',
  '청죽골연합회가 함께 진행하는 활동입니다.',
  '각자의 마을에서 시작해, 함께 더 큰 배움의 연결을 만듭니다.',
  '청죽골마을교육공동체',
  '© 청죽골마을교육공동체'
)
on conflict (id) do nothing;

-- 소개 페이지(/about) 본문이 비어 있으면 기본 문구를 채워둡니다.
update site_settings
set about_body = $body$청죽골마을교육공동체는 전남 담양 지역의 여러 마을학교가 함께 모여 구성한 지역교육공동체입니다. 각 마을학교는 저마다의 자리에서 아이들과 어른들을 위한 배움의 자리를 만들어가고 있으며, 청죽골연합회는 이 마을학교들이 서로 연결되고 함께 성장할 수 있도록 공동의 활동과 프로그램을 이어가고 있습니다.

이 사이트는 참여 마을학교를 소개하고, 각 마을학교와 청죽골연합회가 걸어온 활동을 사진과 기록으로 남기는 공간입니다. 참여하는 마을학교의 수와 이름은 시간이 지나며 달라질 수 있으며, 이 아카이브는 그 변화의 과정을 함께 기록해 나갑니다.$body$
where id = 'main' and (about_body is null or about_body = '');

-- 누구나 홈페이지에서 이 설정을 읽을 수 있도록 허용합니다. (수정은 관리자만 가능)
alter table site_settings enable row level security;

drop policy if exists site_settings_public_read on site_settings;
create policy site_settings_public_read on site_settings for select using (true);
