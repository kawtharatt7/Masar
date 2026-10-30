import type { Lang } from './i18n';

export type AchievementKind = 'project' | 'course' | 'certification';

export function buildPost(opts: {
  lang: Lang;
  role: string;
  stepTitle: string;
  projectTitle: string;
  description: string;
  url?: string | null;
  kind?: AchievementKind;
  provider?: string | null;
}) {
  const { lang, role, stepTitle, projectTitle, description, url, kind = 'project', provider } = opts;
  const desc = description.length > 380 ? `${description.slice(0, 377).trimEnd()}…` : description;
  const by = provider ? (lang === 'ar' ? ` من ${provider}` : ` by ${provider}`) : '';

  if (lang === 'ar') {
    if (kind === 'course') {
      return [
        `أنهيت دورة «${projectTitle}»${by} 🎓`,
        '',
        `خطوة جديدة في طريقي نحو أن أصبح ${role}.`,
        ...(desc ? ['', `ما تعلمته: ${desc}`] : []),
        ...(url ? ['', `الشهادة: ${url}`] : []),
        '',
        '#تعلم #تطوير_مهني #مسار #Masar',
      ].join('\n');
    }
    if (kind === 'certification') {
      return [
        `حصلت على شهادة جديدة: ${projectTitle}${by} 🏅`,
        '',
        `إنجاز جديد في طريقي نحو أن أصبح ${role}.`,
        ...(desc ? ['', desc] : []),
        ...(url ? ['', `رابط الاعتماد: ${url}`] : []),
        '',
        '#شهادات #تطوير_مهني #مسار #Masar',
      ].join('\n');
    }
    return [
      `إنجاز جديد في طريقي نحو أن أصبح ${role} 🎯`,
      '',
      `أنهيت مرحلة «${stepTitle}» ونفّذت مشروع «${projectTitle}».`,
      '',
      desc,
      ...(url ? ['', `تفاصيل المشروع: ${url}`] : []),
      '',
      '#تطوير_مهني #مسار #Masar',
    ].join('\n');
  }

  if (kind === 'course') {
    return [
      `Completed "${projectTitle}"${by} 🎓`,
      '',
      `Another step on my path to becoming a ${role}.`,
      ...(desc ? ['', `What I learned: ${desc}`] : []),
      ...(url ? ['', `Certificate: ${url}`] : []),
      '',
      '#Learning #CareerDevelopment #Masar',
    ].join('\n');
  }
  if (kind === 'certification') {
    return [
      `I earned a new certification: ${projectTitle}${by} 🏅`,
      '',
      `A milestone on my path to becoming a ${role}.`,
      ...(desc ? ['', desc] : []),
      ...(url ? ['', `Credential: ${url}`] : []),
      '',
      '#Certification #CareerDevelopment #Masar',
    ].join('\n');
  }
  return [
    `Milestone reached on my path to becoming a ${role} 🎯`,
    '',
    `I just completed "${stepTitle}" and built: ${projectTitle}.`,
    '',
    desc,
    ...(url ? ['', `See the project: ${url}`] : []),
    '',
    '#CareerDevelopment #LearningInPublic #Masar',
  ].join('\n');
}

/** Opens LinkedIn's post composer with the text filled in. */
export function linkedinUrl(text: string) {
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
}

/** Opens LinkedIn's "add certification to profile" form with the fields filled in. */
export function linkedinCertUrl(opts: { name: string; issuer?: string | null; issuedOn?: string | null; url?: string | null }) {
  const d = opts.issuedOn ? new Date(opts.issuedOn) : new Date();
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: opts.name,
    organizationName: opts.issuer ?? '',
    issueYear: String(d.getFullYear()),
    issueMonth: String(d.getMonth() + 1),
  });
  if (opts.url) params.set('certUrl', opts.url);
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}
