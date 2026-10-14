import { getSiteSettingsAdmin } from "@/lib/siteSettings";
import { createSignedViewUrl } from "@/lib/storage";
import { resolveSiteBaseUrl } from "@/lib/siteUrl";
import { updateSiteSettingsAction } from "@/app/admin/site-settings/actions";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import ContactQrPanel from "@/components/admin/ContactQrPanel";

export default async function SiteSettingsPage() {
  const settings = await getSiteSettingsAdmin();

  const [logoUrl, heroUrl, aboutUrl, aboutLogoUrl, communityUrl, orgLogoUrl, org2LogoUrl] = await Promise.all([
    settings?.logo_image ? createSignedViewUrl(settings.logo_image) : Promise.resolve(null),
    settings?.hero_image ? createSignedViewUrl(settings.hero_image) : Promise.resolve(null),
    settings?.about_image ? createSignedViewUrl(settings.about_image) : Promise.resolve(null),
    settings?.about_logo_image ? createSignedViewUrl(settings.about_logo_image) : Promise.resolve(null),
    settings?.community_image ? createSignedViewUrl(settings.community_image) : Promise.resolve(null),
    settings?.org_logo_image ? createSignedViewUrl(settings.org_logo_image) : Promise.resolve(null),
    settings?.org2_logo_image ? createSignedViewUrl(settings.org2_logo_image) : Promise.resolve(null),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold mb-1">사이트 설정</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-8">
        홈페이지의 사진과 문구를 여기서 직접 수정할 수 있습니다. 사진은 올리는 즉시, 문구는 맨 아래
        "저장하기"를 눌러야 반영됩니다. 같은 항목의 사진과 문구를 같은 묶음 안에 모아뒀습니다.
        (디자인/레이아웃은 여기서 바꿀 수 없고, 사진과 글자 내용만 바꿀 수 있어요.)
      </p>

      <SiteSettingsForm
        settings={settings}
        action={updateSiteSettingsAction}
        images={{ logoUrl, heroUrl, aboutUrl, aboutLogoUrl, communityUrl, orgLogoUrl, org2LogoUrl }}
      />

      <div className="mt-10">
        <ContactQrPanel contactUrl={`${resolveSiteBaseUrl(settings?.site_base_url)}/contact`} />
      </div>
    </div>
  );
}
