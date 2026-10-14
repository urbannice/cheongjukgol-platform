import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { updateSiteSettingsImageAction } from "@/app/admin/site-settings/actions";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { field, path } = await req.json();
  if (!field || !path) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  try {
    await updateSiteSettingsImageAction(field, path);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "저장 중 오류가 발생했습니다." }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
