# Masar wireframes (rebuild these in Figma)

Use 3 frames per page: desktop 1440, tablet 820, mobile 390. Design the Arabic (RTL) version first and mirror it for English.

Tokens: Fjord #12343B, Teal #1F7A74, Teal soft #D4E8E4, Saffron #EDA81F, Salt #F3F6F4, Mist #DCE5E1. Fonts: IBM Plex Sans Arabic (body, Arabic), Bricolage Grotesque (Latin headings).

## 1. Landing

```
+--------------------------------------------------------------+
| [logo]                                  [العربية] [Sign in]  |
|                                                              |
|  Headline (2 lines)                    o  Your skills today  |
|  One-sentence value proposition        |                     |
|  [ Start your path ]  Watch the intro  o  The gap            |
|                                        |                     |
|                                        *  Your target role   |
+--------------------------------------------------------------+
|######################## FJORD BAND ###########################|
|  See Masar in one minute                                     |
|  +--------------------------------------------------------+  |
|  |                 AI INTRO VIDEO (16:9)                  |  |
|  +--------------------------------------------------------+  |
+--------------------------------------------------------------+
|  Built for            |  What you get                        |
|  | audience 1         |  Feature 1 ------------------------ |
|  | audience 2         |  Feature 2 ------------------------ |
|  | audience 3         |  Feature 3 / Feature 4              |
+--------------------------------------------------------------+
|  [ Find out how far you are today.   [ Start your path ] ]   |
+--------------------------------------------------------------+
```
Mobile: stack everything in one column; the route sits under the headline.

## 2. Auth + Profile / Input

```
Auth:    [ dark panel with route drawing + headline ] | [ form: name, email, password, Google ]
Profile: logo / language / sign out
         Title + subtitle
         Major [________]    Year [1][2][3][4][5+]
         Completed courses [chip][chip][ type... ]
         Technical skills  [chip][chip][ type... ]
         Target role [________]  (role chips: Frontend, Backend, Data...)
         ---- Interests [____]  [Suggest roles for me]
         role rows (title, demand tag, why)
         [ Save and continue ]
```

## 3. Results dashboard

```
 Role title
 Summary paragraph
 | Market outlook note
 87% match   You o=========*---------- Role
 What you have      |  What is missing (with importance stripe)
 Skills vs role: name  [=====|---]   (bar = you, tick = role needs)
 Roadmap:  (1) Step title   [2 weeks]  v
            |   description, topic tags, actions, project to build
           (2) Step ...
 Your readiness over time: line chart + [Update skills] [Re-check]
 Courses to take     |  Certifications
```
