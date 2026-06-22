import type { Metadata } from "next";

import { Section } from "@/components/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE, SITE_DEFAULT_DESCRIPTION, SMART_UI } from "@/lib/constants";
import { PLATFORM, PLATFORM_TERMS } from "@/lib/platform-copy";
import { webPageJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { redirectIfAuthenticated } from "@/lib/server/redirect-if-authenticated";

export const metadata: Metadata = buildPageMetadata({
  title: "About",
  description: `${PLATFORM.aboutIntro}`,
  path: "/about",
});

export default async function AboutPage() {
  await redirectIfAuthenticated();

  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: "/about",
          title: `About ${SITE.name}`,
          description: SITE_DEFAULT_DESCRIPTION,
        })}
      />
      <Section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">About</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
            About {SITE.name}
          </h1>
          <div className="mt-8 space-y-5 text-base leading-relaxed text-brand-700">
            <p>{PLATFORM.aboutIntro}</p>
            <p>
              {SITE.name} is a {PLATFORM_TERMS.drivingEducationPlatform.toLowerCase()} that combines Pass Pilot
              Score assessments, {SMART_UI.personalisedReports.toLowerCase()}, {SMART_UI.insights}, {PLATFORM_TERMS.coachingTools}{" "}
              and a growing {PLATFORM_TERMS.learningCentre}. It is not an official DVSA product and should always
              be reviewed alongside your instructor and on-road performance.
            </p>
            <p>
              Learners, supervisors and instructors each have a dedicated workspace so the right people see the
              right information at the right time.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
