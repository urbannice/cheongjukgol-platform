"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  checkRateLimit,
  createAdminSession,
  destroyAdminSession,
  recordLoginAttempt,
  verifyPasscode,
} from "@/lib/auth";

async function getClientIp() {
  const h = await headers();
  return (
    h.get("x-nf-client-connection-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function loginAction(formData: FormData) {
  const passcode = String(formData.get("passcode") ?? "").trim();
  const editorName = String(formData.get("editorName") ?? "").trim();
  const editorOrg = String(formData.get("editorOrg") ?? "").trim();

  let ip = "unknown";
  try {
    ip = await getClientIp();

    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return { error: "관리자번호를 너무 여러 번 잘못 입력했습니다. 5분 뒤 다시 시도해주세요." };
    }

    if (!editorName || !editorOrg) {
      return { error: "수정자 이름과 소속을 입력해주세요." };
    }

    const ok = await verifyPasscode(passcode);
    await recordLoginAttempt(ip);

    if (!ok) {
      return { error: "관리자번호가 올바르지 않습니다." };
    }

    await createAdminSession({ editorName, editorOrg });
  } catch (err) {
    // 여기서 예상치 못한 오류가 나면 화면이 깨지지 않도록 막고,
    // 실제 원인은 Netlify의 서버 로그(Logs 메뉴)에서 확인할 수 있게 남깁니다.
    console.error("[loginAction] 로그인 처리 중 오류:", err);
    return {
      error:
        "로그인 처리 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요. (문제가 계속되면 Netlify Logs 메뉴의 오류 내용을 확인해주세요)",
    };
  }

  redirect("/admin/dashboard");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin");
}
