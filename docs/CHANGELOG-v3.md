# Masar v3: change packs (apply in this order)

Each pack is a ZIP that unzips over the project root. Overwrite files when asked.

| Pack | Change | Run after applying |
|---|---|---|
| 1 | Speed: thinking off, analysis in two parallel calls | restart `npm run dev` |
| 2 | Onboarding wizard, 90+ majors, AI suggestions, "I am not sure" questionnaire | restart |
| 3 | Project documentation, congratulations, LinkedIn share, achievements | run `supabase/pack-3-achievements.sql` in Supabase |
| 4 | Motion: roadmap, scroll reveals, page transitions, count-up | none |
| 5 | Tailwind aliases + `cn()` helper for 21st.dev components, docs | `npm install` |
