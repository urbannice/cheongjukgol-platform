-- 사이트 로고 이미지 (상단 헤더) + 소개 페이지 본문 텍스트를 site_settings에 추가합니다.

alter table site_settings add column if not exists logo_image text;

alter table site_settings add column if not exists about_body text;

update site_settings
set about_body = $body$청죽골마을교육공동체는 전남 담양 지역의 여러 마을학교가 함께 모여 구성한 지역교육공동체입니다. 각 마을학교는 저마다의 자리에서 아이들과 어른들을 위한 배움의 자리를 만들어가고 있으며, 청죽골연합회는 이 마을학교들이 서로 연결되고 함께 성장할 수 있도록 공동의 활동과 프로그램을 이어가고 있습니다.

이 사이트는 참여 마을학교를 소개하고, 각 마을학교와 청죽골연합회가 걸어온 활동을 사진과 기록으로 남기는 공간입니다. 참여하는 마을학교의 수와 이름은 시간이 지나며 달라질 수 있으며, 이 아카이브는 그 변화의 과정을 함께 기록해 나갑니다.$body$
where id = 'main' and about_body is null;
