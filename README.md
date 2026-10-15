# 청죽골 플랫폼 (담양마을학교 연합회)

담양 마을학교들과 연합활동을 소개하는 웹사이트입니다.

- 운영 주소: https://cheongjukgol-platform.netlify.app
- 관리자 화면: https://cheongjukgol-platform.netlify.app/admin (공동 비밀번호로 로그인)

## 사이트 구성

| 주소 | 내용 |
|---|---|
| `/` | 홈 |
| `/about` | 연합회 소개 |
| `/schools` | 마을학교 목록 |
| `/schools/{slug}` | 마을학교 상세 (QR 코드로 인쇄·배포되는 주소) |
| `/activities` | 전체활동 목록 |
| `/activities/{id}` | 활동 상세 |
| `/community` | 연합활동 |
| `/contact` | 마을학교 연락처 안내 |
| `/admin` | 관리자 화면 (학교·활동·연합활동·사이트 설정·수정 기록·휴지통) |

## 기술 구성

- Next.js 16(App Router) + React 19 + Tailwind CSS v4
- 데이터·사진 보관: Supabase (DB + 사진 보관함 `media`)
- 배포: Netlify (`@netlify/plugin-nextjs`). `main`에 합쳐지면 운영에 자동 배포되고, PR마다 미리보기(Deploy Preview)가 만들어집니다.

## 폴더 안내

- `app/` — 화면(페이지)과 서버 동작
  - `app/admin/` — 관리자 화면과 저장 동작
  - `app/media/[...path]/` — 공개 사진 주소(`/media/…`)를 보관함의 임시 주소로 연결
- `components/` — 여러 화면에서 함께 쓰는 화면 조각
- `lib/` — 데이터 읽기·로그인·사진 경로 등 공통 기능
  - `publicData.ts` 공개 화면용 데이터 / `adminData.ts` 관리자용 데이터(서버 전용)
  - `auth.ts` 관리자 로그인 / `storage.ts` 사진 보관 경로 규칙
  - `mediaUrl.ts`, `publicMedia.ts` 공개 사진 주소와 공개 허용 검사
  - `slug.ts` 마을학교 주소(slug) 규칙
- `proxy.ts` — `/admin/*` 접근 보호
- 루트의 `*.sql` — 지금까지 DB 구조를 바꿀 때 사용한 기록

## 로컬에서 실행하기

1. `.env.example`을 `.env.local`로 복사하고 값을 채웁니다. 값은 Netlify 환경변수에 있습니다.
2. 아래 명령을 실행합니다.

```bash
npm install
npm run dev
```

3. http://localhost:3000 을 엽니다.

로컬 실행도 운영과 같은 DB·사진 보관함을 사용합니다. 관리자 화면에서 저장하면 운영 내용이 바뀝니다.

## 작업 규칙

자세한 규칙은 [`CLAUDE.md`](./CLAUDE.md)에 있습니다. 핵심만 적으면 다음과 같습니다.

- `main`에서 직접 작업하지 않고, 브랜치 → PR → 미리보기 확인 → 승인 후 병합 순서로 진행합니다.
- 비밀번호·API 키·토큰은 절대 커밋하지 않습니다(공개 저장소).
- 사이트 주소, DB 구조, 사진 보관 경로 규칙, 마을학교 주소(slug)와 예전 주소 이동 규칙은 함부로 바꾸지 않습니다.
