import { createClient } from "@supabase/supabase-js";

// 방문자(공개) 화면에서 쓰는 클라이언트입니다.
// Publishable key만 사용하며, DB의 RLS 규칙에 따라 공개된 데이터만 조회할 수 있습니다.
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
