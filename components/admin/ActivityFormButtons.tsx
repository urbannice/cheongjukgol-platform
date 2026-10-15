// 기본정보 입력 폼(ActivityBasicForm)의 저장/공개 버튼입니다.
// HTML의 form="..." 속성을 이용해, 이 폼 바깥(예: 사진 업로드 아래쪽)에서도
// 똑같은 버튼을 하나 더 두어 "사진까지 다 올린 뒤 저장"할 수 있게 만들었습니다.
export default function ActivityFormButtons({
  status,
  formId,
  pending,
}: {
  status?: string;
  formId: string;
  pending?: boolean;
}) {
  const isPublished = status === "published";
  const isArchived = status === "archived";

  return (
    <div className="flex flex-wrap gap-2">
      {!isPublished && (
        <>
          <button type="submit" form={formId} name="intent" value="save" disabled={pending} className="btn-secondary">
            임시저장
          </button>
          <button type="submit" form={formId} name="intent" value="publish" disabled={pending} className="btn-primary">
            공개하기
          </button>
        </>
      )}
      {isPublished && (
        <>
          <button type="submit" form={formId} name="intent" value="save" disabled={pending} className="btn-primary">
            저장
          </button>
          <button
            type="submit"
            form={formId}
            name="intent"
            value="unpublish"
            disabled={pending}
            className="btn-secondary"
          >
            공개 중지 (보관)
          </button>
        </>
      )}
      {isArchived && (
        <button type="submit" form={formId} name="intent" value="publish" disabled={pending} className="btn-primary">
          다시 공개하기
        </button>
      )}
    </div>
  );
}
