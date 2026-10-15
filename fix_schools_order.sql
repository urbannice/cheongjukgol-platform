-- =========================================================
-- 1) 늘푸름수북마을학교가 홈페이지에 다시 보이도록 복구
--    (비공개로 되어 있거나 휴지통에 있었다면 되돌립니다)
-- =========================================================
update schools
set is_visible = true,
    deleted_at = null
where slug = 'neulpureum-subuk';

-- =========================================================
-- 2) 마을학교 이름 가나다 순으로 노출 순서(display_order) 재정렬
-- =========================================================
update schools set display_order = 1 where slug = 'kkumkkuneun';        -- 꿈꾸는마을학교
update schools set display_order = 2 where slug = 'neulpureum-subuk';   -- 늘푸름수북마을학교
update schools set display_order = 3 where slug = 'mujeong-sarang';     -- 무정사랑마을학교
update schools set display_order = 4 where slug = 'bongwoori';          -- 봉우리마을학교
update schools set display_order = 5 where slug = 'saemmul';            -- 샘물마을학교
update schools set display_order = 6 where slug = 'sonagi';             -- 소나기마을학교
update schools set display_order = 7 where slug = 'slow';               -- 슬로우마을학교
update schools set display_order = 8 where slug = 'wolsan-hygge';       -- 월산휘게마을학교
update schools set display_order = 9 where slug = 'inmun-changjak';     -- 인문창작마을학교
update schools set display_order = 10 where slug = 'chuwolsan';         -- 추월산마을학교

-- 확인용: 지금 순서대로 조회
select name, slug, display_order, is_visible, deleted_at from schools order by display_order;
