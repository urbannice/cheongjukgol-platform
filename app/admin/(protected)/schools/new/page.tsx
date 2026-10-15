import SchoolForm from "@/components/admin/SchoolForm";
import { createSchoolAction } from "@/app/admin/schools/actions";

export default function NewSchoolPage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">새 마을학교 추가</h1>
      <SchoolForm action={createSchoolAction} />
    </div>
  );
}
