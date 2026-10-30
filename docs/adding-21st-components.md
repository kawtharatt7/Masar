# إضافة مكونات حركة من 21st.dev بدون أخطاء

مشروع مسار يستخدم Next.js (App Router) وTailwind v4 وFramer Motion، وهذا نفس الأساس الذي تُبنى عليه أغلب مكونات 21st.dev. اتبع الخطوات بالترتيب.

## الخطوات

1. **انسخ الكود** من 21st.dev (تبويب Code) إلى ملف جديد في `src/components/ui/`، مثلًا `src/components/ui/animated-card.tsx`.

2. **أضف `'use client';` في أول سطر** من الملف (قبل أي import). أي مكون فيه حركة أو `useState` أو `useEffect` يحتاجها، وبدونها يظهر خطأ: `You're importing a component that needs useState...`.

3. **ثبّت الحزم التي يستوردها الملف.** انظر إلى أسطر `import` في أعلاه:
   - `from 'framer-motion'` → مثبتة بالفعل.
   - `from 'motion/react'` → إما `npm i motion`، أو غيّر السطر إلى `from 'framer-motion'` (المكتبة نفسها).
   - `from 'lucide-react'` → `npm i lucide-react`.
   - `from 'clsx'` و`'tailwind-merge'` و`'@/lib/utils'` → موجودة بالفعل في المشروع.
   - أي حزمة أخرى → `npm i اسم-الحزمة`.
   - إن ظهر خطأ `ERESOLVE` عند التثبيت: `npm i اسم-الحزمة --legacy-peer-deps`.

4. **استورده واستخدمه** في أي صفحة أو مكون:

   ```tsx
   import { AnimatedCard } from '@/components/ui/animated-card';
   // ...
   <AnimatedCard />
   ```

5. **أعد تشغيل `npm run dev`** إذا ثبّتت حزمة جديدة.

## ألوان المكونات

مكونات 21st.dev تستخدم أسماء ألوان مثل `bg-background` و`text-foreground` و`bg-primary` و`border-border`. ربطتها في `globals.css` بألوان مسار، فتظهر بألوان المشروع دون تعديل. وإن أردت لونًا من ألوان مسار مباشرة فهذه متاحة: `fjord` و`teal` و`teal-soft` و`saffron` و`salt` و`mist`، مثل `bg-saffron`.

## أخطاء شائعة وحلولها

| الخطأ | الحل |
|---|---|
| `Module not found: Can't resolve 'motion/react'` | `npm i motion` أو غيّره إلى `framer-motion` |
| `Module not found: Can't resolve 'lucide-react'` | `npm i lucide-react` |
| `You're importing a component that needs useState/useEffect` | أضف `'use client';` في أول الملف |
| المكون يظهر شفافًا أو بدون ألوان | استخدم أسماء الألوان الموجودة أعلاه، أو ضع ألوانك بصيغة `bg-[#12343b]` |
| `Invalid src prop ... hostname is not configured` (صور) | أضف النطاق في `next.config.mjs` ضمن `images.remotePatterns` |
| الأنيميشن `animate-in` / `fade-in` لا يعمل | `npm i tw-animate-css` ثم أضف في أول `globals.css` بعد `@import 'tailwindcss';` السطر `@import 'tw-animate-css';` |
| `Hydration failed` | المكون يستخدم `Math.random()` أو `window` أثناء العرض. ضعه داخل `useEffect`، أو حمّله بـ `dynamic(() => import(...), { ssr: false })` |
| عناصر الحركة تتجه للاتجاه الخطأ في العربية | استخدم خصائص منطقية مثل `ms-4` و`ps-4` و`start-0` بدل `ml-4` و`pl-4` و`left-0` |

## نصائح

- لا تستخدم أمر `npx shadcn add` الذي يظهر أحيانًا في الموقع، لأن المشروع لا يحتوي `components.json`. النسخ اليدوي أضمن.
- ضع مكونًا واحدًا في كل مرة وجرّبه، حتى تعرف مصدر أي خطأ بسرعة.
- احترم المستخدمين الذين يفضلون حركة أقل: المشروع يلف كل شيء بـ `MotionConfig reducedMotion="user"`، وهذا يشمل مكونات framer-motion التي تضيفها.
