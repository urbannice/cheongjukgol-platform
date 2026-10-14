import { notFound } from "next/navigation";
import { getSchoolByIdAdmin, getSchoolContactLinksAdmin } from "@/lib/adminData";
import { getSchoolMedia } from "@/lib/publicData";
import { createSignedViewUrl } from "@/lib/storage";
import SchoolForm from "@/components/admin/SchoolForm";
import HeroImageUploader from "@/components/admin/HeroImageUploader";
import SchoolImageUploader from "@/components/admin/SchoolImageUploader";
import SchoolGalleryManager from "@/components/admin/SchoolGalleryManager";
import { updateSchoolAction } from "@/app/admin/schools/actions";

export default async function EditSchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const school = await getSchoolByIdAdmin(id);
  if (!school) notFound();

  const [heroUrl, representativeUrl, activistUrl, contactImageUrl, contactLinks, galleryMedia] =
    await Promise.all([
      school.hero_image ? createSignedViewUrl(school.hero_image) : Promise.resolve(null),
      school.representative_photo ? createSignedViewUrl(school.representative_photo) : Promise.resolve(null),
      school.activist_photo ? createSignedViewUrl(school.activist_photo) : Promise.resolve(null),
      school.contact_image ? createSignedViewUrl(school.contact_image) : Promise.resolve(null),
      getSchoolContactLinksAdmin(id),
      getSchoolMedia(id),
    ]);

  const boundAction = updateSchoolAction.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">{school.name} 수정</h1>

      <div className="max-w-2xl mb-8">
        <p className="text-sm font-medium mb-1">마을학교 대표이미지</p>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">
          이 사진이 어디에 표시되나요? → 학교 상세페이지 맨 위 Hero 영역에 크게 표시됩니다.
        </p>
        <HeroImageUploader schoolId={id} currentUrl={heroUrl} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mb-10">
        <div>
          <SchoolImageUploader
            schoolId={id}
            field="representative_photo"
            label="대표자 프로필 사진"
            aspect="1/1"
            currentUrl={representativeUrl}
          />
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            이 사진이 어디에 표시되나요? → 학교 상세페이지의 대표자 소개 영역에 표시됩니다. 정사각형 사진을
            권장합니다.
          </p>
        </div>
        <div>
          <SchoolImageUploader
            schoolId={id}
            field="activist_photo"
            label="프로그램 활동 대표사진 (선택)"
            aspect="4/3"
            currentUrl={activistUrl}
          />
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            이 사진이 어디에 표시되나요? → 학교 상세페이지 프로그램 영역에, 현장 분위기를 보여주는 사진으로
            표시됩니다.
          </p>
        </div>
        <div>
          <SchoolImageUploader
            schoolId={id}
            field="contact_image"
            label="연락처 페이지 대표이미지 (선택)"
            aspect="1/1"
            currentUrl={contactImageUrl}
          />
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            이 사진이 어디에 표시되나요? → 통합 연락처(/contact) 페이지의 이 학교 카드에 표시됩니다. 대표자
            사진, 활동 현장사진, 학교 대표사진 중 원하는 것을 자유롭게 올리시면 됩니다. 등록하지 않으면
            대표자 사진 → 학교 대표이미지 순서로 자동으로 대신 표시됩니다.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mb-10">
        <p className="text-sm font-medium mb-1">활동 갤러리</p>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          마을학교의 여러 활동사진을 보여줍니다. 여러 장을 한 번에 선택해서 올릴 수 있습니다.
        </p>
        <SchoolGalleryManager schoolId={id} initialMedia={galleryMedia as any} />
      </div>

      <SchoolForm school={school} contactLinks={contactLinks} action={boundAction} />
    </div>
  );
}
