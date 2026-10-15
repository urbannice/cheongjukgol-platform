"use client";

import { createClient } from "@supabase/supabase-js";

// 브라우저(관리자 화면)에서 서명된 업로드 URL로 Storage에 직접 파일을 전송할 때 사용합니다.
// Publishable key만 사용하므로 이 파일이 노출되어도 안전합니다.
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}
