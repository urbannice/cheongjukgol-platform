@AGENTS.md

# 청죽골(담양마을학교 연합회) 플랫폼 — 작업 규칙

이 저장소는 **실제 운영 중인 사이트**입니다: https://cheongjukgol-platform.netlify.app
`main`에 합쳐지는 순간 Netlify가 자동으로 운영에 배포합니다.

## 작업 순서 (반드시 지킬 것)

1. `main`에서 직접 작업하지 말고 작업 브랜치를 만든다.
2. 커밋 → 푸시 → PR을 연다. Netlify가 PR마다 Deploy Preview(`https://deploy-preview-<PR번호>--cheongjukgol-platform.netlify.app`)를 만든다.
3. 미리보기 주소를 사용자에게 주고, 확인할 페이지를 안내한다.
4. **사용자가 명시적으로 승인한 뒤에만** `main`에 병합한다. 승인 전에는 절대 병합·운영 배포하지 않는다.
5. 병합 후 운영 주소에서 주요 페이지(홈, 소개, 학교 목록·상세, 연합활동, 활동 상세, /admin)와 사진이 정상인지 확인하고 결과를 알린다.

문제가 생기면 Netlify의 이전 배포를 다시 게시(롤백)할 수 있다.

## 절대 바꾸면 안 되는 것

- 사이트 주소와 Netlify 프로젝트 이름 `cheongjukgol-platform`
- Supabase DB 테이블·컬럼 구조 (스키마 변경이 꼭 필요하면 먼저 사용자에게 설명하고 승인받기)
- 사진 보관함 `media`의 경로 규칙: `schools/{id}/…`, `activities/{id}/…`, `settings/{field}/…` (`lib/storage.ts`의 `buildStoragePath`)
- 마을학교 주소: 표시 이름(`name`)과 주소(`slug`)는 분리. slug가 바뀌면 `slug_history`로 예전 주소가 새 주소로 이동해야 한다. 이미 인쇄·배포된 QR 주소(`/schools/{slug}` 등)가 깨지면 안 된다.
- 메뉴 이름은 "연합활동"으로 통일

## 비밀값

- 비밀번호·API 키·토큰은 **절대 커밋하지 않는다** (저장소가 공개 상태). 값은 Netlify 환경변수에만 있다.
- 필요한 환경변수 이름은 `.env.example` 참고. 로컬 실행 시 `.env.local`에 값을 넣는다(Git 제외).

## 구조 메모

- Next.js 16(App Router) + React 19 + Tailwind v4, 배포는 Netlify(`@netlify/plugin-nextjs`)
- 공개 페이지는 `revalidate = 60`. 관리자 저장 시 관련 페이지를 즉시 갱신(revalidatePath).
- 데이터 읽기: 공개 화면 `lib/publicData.ts`(publishable key, RLS 적용), 관리자 `lib/adminData.ts`(secret key, 서버 전용)
- 관리자 로그인: 공동 비밀번호를 서버에서만 확인(`lib/auth.ts`), 쿠키 `cjg_admin_session`, `/admin/*`는 `proxy.ts`에서 보호, 5분에 5회 실패 시 잠시 차단, 저장 시 수정자 이름·소속을 `admin_logs`에 기록
- **사진 주소**: 공개 화면에는 Supabase 임시 주소를 넣지 않는다. `lib/mediaUrl.ts`의 `mediaUrl()`로 `/media/<보관경로>`를 넣으면, `app/media/[...path]/route.ts`가 열 때마다 새 임시 주소로 연결한다. 공개 화면에 쓰이는 파일만 열리도록 `lib/publicMedia.ts`에서 검사한다. 새 종류의 공개 이미지를 추가하면 이 검사에도 반영할 것.
- 공유 미리보기 이미지(`opengraph-image.tsx`)는 `downloadMedia()`로 보관함에서 직접 읽는다.

## 주의

- Deploy Preview도 **운영과 같은 DB·사진 보관함**을 쓴다. 미리보기의 관리자 화면에서 저장하면 운영 내용이 바뀐다는 점을 사용자에게 알린다.

## 사용자와 소통

- 사용자는 개발자가 아니다. **한국어로 쉽게** 설명한다.
- 사용자가 직접 해야 하는 일(로그인, 승인, 설정 화면 조작 등)은 어디서 무엇을 누르는지 **단계별로** 안내한다.
