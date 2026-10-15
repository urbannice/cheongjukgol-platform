import "server-only";
import { createClient } from "@supabase/supabase-js";

// 관리자(서버 전용) 클라이언트입니다.
// Secret key를 사용하며 RLS 규칙을 우회해 모든 데이터를 읽고 쓸 수 있습니다.
// 절대 브라우저로 전달되는 코드에서 import하면 안 됩니다. (파일 상단의 "server-only"가 이를 강제합니다)
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SECRET_KEY!;
  if (!key) {
    throw new Error(
      "SUPABASE_SECRET_KEY 환경변수가 설정되지 않았습니다. Netlify 환경변수 설정을 확인해주세요."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
