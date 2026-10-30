export type QuizKey = 'enjoy' | 'environment' | 'values' | 'style';
type Opt = { en: string; ar: string };

export const QUIZ: { key: QuizKey; en: string; ar: string; options: Opt[] }[] = [
  {
    key: 'enjoy',
    en: 'What do you enjoy doing?',
    ar: 'ما الذي تستمتع بفعله؟',
    options: [
      { en: 'Solving problems', ar: 'حل المشكلات' },
      { en: 'Creating and designing', ar: 'الإبداع والتصميم' },
      { en: 'Helping people', ar: 'مساعدة الناس' },
      { en: 'Leading and organizing', ar: 'القيادة والتنظيم' },
      { en: 'Working with data and numbers', ar: 'العمل مع البيانات والأرقام' },
      { en: 'Researching and writing', ar: 'البحث والكتابة' },
      { en: 'Hands-on work with tools or equipment', ar: 'العمل العملي بالأدوات والمعدات' },
      { en: 'Teaching and explaining', ar: 'التعليم والشرح' },
    ],
  },
  {
    key: 'environment',
    en: 'Where do you see yourself working?',
    ar: 'أين ترى نفسك تعمل؟',
    options: [
      { en: 'Office', ar: 'المكتب' },
      { en: 'Remote or from home', ar: 'عن بُعد أو من المنزل' },
      { en: 'Field or outdoors', ar: 'الميدان أو الهواء الطلق' },
      { en: 'Hospital or lab', ar: 'مستشفى أو مختبر' },
      { en: 'Startup', ar: 'شركة ناشئة' },
      { en: 'Large company', ar: 'شركة كبيرة' },
      { en: 'Government', ar: 'جهة حكومية' },
      { en: 'My own business', ar: 'مشروعي الخاص' },
    ],
  },
  {
    key: 'values',
    en: 'What matters most to you at work?',
    ar: 'ما أهم ما يهمك في العمل؟',
    options: [
      { en: 'High salary', ar: 'راتب مرتفع' },
      { en: 'Job stability', ar: 'استقرار وظيفي' },
      { en: 'Creativity', ar: 'الإبداع' },
      { en: 'Impact on society', ar: 'الأثر في المجتمع' },
      { en: 'Flexible hours', ar: 'مرونة في الوقت' },
      { en: 'Fast growth', ar: 'تطور سريع' },
      { en: 'Travel', ar: 'السفر' },
    ],
  },
  {
    key: 'style',
    en: 'How do you like to work?',
    ar: 'كيف تفضل العمل؟',
    options: [
      { en: 'Alone', ar: 'بمفردي' },
      { en: 'In a team', ar: 'ضمن فريق' },
      { en: 'Leading a team', ar: 'أقود فريقًا' },
      { en: 'With clients or the public', ar: 'مع العملاء أو الجمهور' },
    ],
  },
];
