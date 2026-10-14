import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { createAdminClient } from "@/lib/supabase/adminClient";

const COOKIE_NAME = "cjg_admin_session";
const SESSION_HOURS = 8;

function getSecretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET 환경변수가 설정되지 않았습니다.");
  }
  return new TextEncoder().encode(secret);
}

export interface AdminSession {
  editorName: string;
  editorOrg: string;
}

// 관리자 세션 쿠키를 만들어 브라우저에 저장합니다.
// HttpOnly + Secure + SameSite=Lax 로 설정해, 자바스크립트로 훔쳐가거나
// 다른 사이트에서 위조 요청을 보내는 것을 막습니다.
export async function createAdminSession(session: AdminSession) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.editorName !== "string" || typeof payload.editorOrg !== "string") {
      return null;
    }
    return { editorName: payload.editorName, editorOrg: payload.editorOrg };
  } catch {
    return null;
  }
}

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 5;

// 관리자번호 입력 시도를 IP 기준으로 제한합니다 (짧은 시간에 반복 입력 방지).
export async function checkRateLimit(ip: string): Promise<boolean> {
  const supabase = createAdminClient();
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("admin_login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("attempted_at", windowStart);

  return (count ?? 0) < MAX_ATTEMPTS;
}

export async function recordLoginAttempt(ip: string) {
  const supabase = createAdminClient();
  await supabase.from("admin_login_attempts").insert({ ip });
}

export async function verifyPasscode(passcode: string): Promise<boolean> {
  const real = process.env.ADMIN_PASSCODE;
  if (!real) {
    throw new Error("ADMIN_PASSCODE 환경변수가 설정되지 않았습니다.");
  }
  return passcode === real;
}
