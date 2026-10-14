import { listAllActivities } from "@/lib/adminData";
import ActivityListView from "@/components/admin/ActivityListView";

export default async function AdminCommunityPage() {
  const activities = await listAllActivities({ type: "community" });
  return <ActivityListView title="연합활동 관리" newHref="/admin/community/new" activities={activities} />;
}
