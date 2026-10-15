"use server";

import { getAdminSession } from "@/lib/auth";
import { listAdminLogsPage } from "@/lib/adminData";

// "더보기" 버튼에서 호출: 이전(더 오래된) 수정기록을 이어서 가져옵니다.
export async function loadMoreAdminLogsAction(before: string) {
  const session = await getAdminSession();
  if (!session) throw new Error("로그인이 필요합니다.");
  return listAdminLogsPage({ before });
}
