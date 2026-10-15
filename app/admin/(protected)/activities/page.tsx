import { listAllActivities } from "@/lib/adminData";
import ActivityListView from "@/components/admin/ActivityListView";

export default async function AdminActivitiesPage() {
  const activities = await listAllActivities({ type: "school" });
  return <ActivityListView title="마을학교 활동 관리" newHref="/admin/activities/new" activities={activities} />;
}
