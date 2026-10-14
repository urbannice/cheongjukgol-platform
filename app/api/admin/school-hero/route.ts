import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { updateSchoolHeroImageAction } from "@/app/admin/schools/actions";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { schoolId, path } = await req.json();
  if (!schoolId || !path) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  await updateSchoolHeroImageAction(schoolId, path);
  return NextResponse.json({ success: true });
}
