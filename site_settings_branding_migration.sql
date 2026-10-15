-- 공식 명칭을 "청죽골마을교육공동체/청죽골연합회"에서 "담양마을학교 연합회"로 바꾸고,
-- 지원기관(담양교육지원청) 표기를 별도로 관리하기 위한 migration입니다.
-- 기존 데이터는 지우지 않고, 새 컬럼만 추가합니다.

-- 1) 연합회 공식 명칭/슬로건, 지원기관 컬럼 추가
alter table public.site_settings
  add column if not exists association_name text default '담양마을학교 연합회',
  add column if not exists association_slogan text default '마을과 함께, 마음이 자랍니다.',
  add column if not exists org_name text default '담양교육지원청',
  add column if not exists org_logo_image text,
  add column if not exists org_support_text text default '지원 · 담양교육지원청';

update public.site_settings
  set association_name = '담양마을학교 연합회'
  where association_name is null;

update public.site_settings
  set association_slogan = '마을과 함께, 마음이 자랍니다.'
  where association_slogan is null;

update public.site_settings
  set org_name = '담양교육지원청'
  where org_name is null;

update public.site_settings
  set org_support_text = '지원 · 담양교육지원청'
  where org_support_text is null;

-- 2) 이미 "청죽골" 기본 문구로 저장되어 있던 값만 안전하게 새 명칭으로 갱신합니다.
--    (관리자가 이미 다른 내용으로 직접 수정한 값은 절대 건드리지 않습니다 — 정확히 예전 기본값과
--    같은 경우에만 바뀝니다)
update public.site_settings
  set about_title = '담양마을학교 연합회 소개'
  where about_title = '청죽골마을교육공동체 소개';

update public.site_settings
  set community_title = '담양마을학교 연합회 연합활동'
  where community_title = '청죽골연합회 연합활동';

update public.site_settings
  set footer_text = '담양마을학교 연합회는 담양 지역 마을학교들이 함께 만들어가는 교육공동체입니다.'
  where footer_text = '청죽골마을교육공동체는 전남 담양 지역 마을학교들이 함께 만들어가는 교육공동체입니다.';

update public.site_settings
  set copyright_text = '© 담양마을학교 연합회'
  where copyright_text = '© 청죽골마을교육공동체';

update public.site_settings
  set about_body = '담양마을학교 연합회는 담양 지역의 마을학교들이 서로의 경험과 활동을 나누고 함께 성장하기 위해 만들어진 마을교육 네트워크입니다.

각 마을학교는 지역의 특성과 사람, 자연을 바탕으로 학교 밖 다양한 경험을 만들어갑니다.

담양교육지원청의 지원을 바탕으로 마을학교 간 공동활동과 역량강화, 네트워크 활동을 이어갑니다.

참여하는 마을학교의 수와 이름은 시간이 지나며 달라질 수 있으며, 이 아카이브는 그 변화의 과정을 함께 기록해 나갑니다.'
  where about_body = '청죽골마을교육공동체는 전남 담양 지역의 여러 마을학교가 함께 모여 구성한 지역교육공동체입니다. 각 마을학교는 저마다의 자리에서 아이들과 어른들을 위한 배움의 자리를 만들어가고 있으며, 청죽골연합회는 이 마을학교들이 서로 연결되고 함께 성장할 수 있도록 공동의 활동과 프로그램을 이어가고 있습니다.

이 사이트는 참여 마을학교를 소개하고, 각 마을학교와 청죽골연합회가 걸어온 활동을 사진과 기록으로 남기는 공간입니다. 참여하는 마을학교의 수와 이름은 시간이 지나며 달라질 수 있으며, 이 아카이브는 그 변화의 과정을 함께 기록해 나갑니다.';
