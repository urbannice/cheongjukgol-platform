import "server-only";
import { createAdminClient } from "@/lib/supabase/adminClient";
import type { AdminSession } from "@/lib/auth";

export async function writeAdminLog(params: {
  session: AdminSession;
  targetType: string;
  targetId?: string | null;
  targetLabel?: string | null;
  action: string;
  detail?: string | null;
}) {
  const supabase = createAdminClient();
  await supabase.from("admin_logs").insert({
    editor_name: params.session.editorName,
    editor_org: params.session.editorOrg,
    target_type: params.targetType,
    target_id: params.targetId ?? null,
    target_label: params.targetLabel ?? null,
    action: params.action,
    detail: params.detail ?? null,
  });
}
