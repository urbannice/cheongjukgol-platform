import { listTrashedActivities, listTrashedMedia, listTrashedSchools } from "@/lib/adminData";
import TrashRow from "@/components/admin/TrashRow";
import {
  permanentlyDeleteSchoolAction,
  restoreSchoolAction,
} from "@/app/admin/schools/actions";
import {
  permanentlyDeleteActivityAction,
  restoreActivityAction,
} from "@/app/admin/activities/actions";
import {
  permanentlyDeleteMediaAction,
  restoreMediaAction,
} from "@/app/admin/media/actions";

export default async function AdminTrashPage() {
  const [schools, activities, media] = await Promise.all([
    listTrashedSchools(),
    listTrashedActivities(),
    listTrashedMedia(),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-bold mb-2">휴지통</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          삭제한 항목은 바로 사라지지 않고 이곳에 보관됩니다. 복구하거나, 확인 후 영구삭제할 수
          있습니다.
        </p>
      </div>

      <section>
        <p className="font-semibold mb-3">마을학교</p>
        <div className="space-y-2">
          {schools.map((s) => (
            <TrashRow
              key={s.id}
              id={s.id}
              label={s.name}
              restoreAction={restoreSchoolAction}
              deleteAction={permanentlyDeleteSchoolAction}
            />
          ))}
          {schools.length === 0 && <EmptyRow />}
        </div>
      </section>

      <section>
        <p className="font-semibold mb-3">활동</p>
        <div className="space-y-2">
          {activities.map((a) => (
            <TrashRow
              key={a.id}
              id={a.id}
              label={a.title}
              restoreAction={restoreActivityAction}
              deleteAction={permanentlyDeleteActivityAction}
            />
          ))}
          {activities.length === 0 && <EmptyRow />}
        </div>
      </section>

      <section>
        <p className="font-semibold mb-3">사진·영상·문서·링크</p>
        <div className="space-y-2">
          {media.map((m) => (
            <TrashRow
              key={m.id}
              id={m.id}
              label={m.title ?? m.original_file_name ?? m.external_url ?? "자료"}
              restoreAction={restoreMediaAction}
              deleteAction={permanentlyDeleteMediaAction}
            />
          ))}
          {media.length === 0 && <EmptyRow />}
        </div>
      </section>
    </div>
  );
}

function EmptyRow() {
  return <p className="text-sm text-[var(--color-text-muted)]">휴지통이 비어 있습니다.</p>;
}
