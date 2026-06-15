# ResumeForge — Resume / CV Builder

A React + TypeScript + Vite app for building, customizing, and downloading resumes.

## Features

- ✍️ **Live editor** with a flexible, block-based model — header plus any number of sections.
- 🧩 **Custom blocks** — the **Create block** button in the navbar opens a popup where you name a section (e.g. Languages, Certifications) and add fields of any type: **short text, paragraph, tags, image, or list of items** (a repeatable group). Creating blocks requires Google sign-in; clicking it while signed out prompts you to sign in first. The created block is added to the left-side editor.
- 🔒 **Extend built-in blocks** — Experience, Projects, Education, etc. let you *add* extra fields, but their core fields can't be deleted (they show a "built-in" badge).
- 🖱️ **Drag to reorder everything** — whole sections (put Projects above Experience), repeater entries, contact rows, and the grip handle is shown on each.
- 🎨 **Customization** — 3 templates (Modern, Classic, Compact), accent color presets + custom color picker, font family, and font size.
- 🔗 **Contact icons** — email, phone, location, website, LinkedIn, and GitHub each show an icon in the resume header.
- 🌓 **Light / dark theme** for the app UI (toggle in the top bar; remembers your choice). The resume page itself always renders on white for printing.
- 👀 **Live A4 preview** that updates as you type.
- ⬇️ **Download PDF** — uses the browser's native print-to-PDF (pixel-perfect, no dependencies). Click **Download PDF**, then choose "Save as PDF" as the destination.
- 🔐 **Google sign-in** via Firebase Auth.
- ☁️ **Cloud save** — your resume auto-saves to Firestore when signed in, and reloads next time. Works offline too (also cached in `localStorage`).

## Getting started

```bash
npm install
npm run dev
```

The app works immediately with local-only storage. Google sign-in and cloud sync require a Firebase project (below).

## Enabling Google sign-in + cloud save

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication → Sign-in method →** enable **Google**.
3. **Firestore Database →** create a database (start in production or test mode).
4. **Project settings → Your apps →** add a **Web app** and copy the config.
5. Copy `.env.example` to `.env.local` and fill in the values:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

6. Add this Firestore security rule so each user can only read/write their own resume:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /resumes/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

7. Restart `npm run dev`. The "Sign in with Google" button is now live.

> If `.env.local` is missing, the app still runs — auth is disabled and data is saved locally only.

> **Profile photos** are compressed in the browser and stored inline with your resume (no Firebase Storage / paid plan required). Images are downscaled and kept small so they fit within Firestore's document size limit.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

## Project structure

```
src/
  lib/firebase.ts          Firebase init (auth + firestore)
  auth/AuthContext.tsx     Google sign-in provider + useAuth()
  useResume.ts             State + localStorage + Firestore auto-save/load + migration
  useTheme.ts              Light/dark theme, persisted
  useDragList.ts           Generic HTML5 drag-to-reorder hook
  types.ts                 Schema-driven block model, field helpers, sample data
  lib/photo.ts             Firebase Storage photo upload/delete + image validation
  components/              Atomic Design structure
    atoms/
      icons.tsx            Inline SVG icon set (no emoji)
      Modal.tsx            Reusable modal shell
    molecules/
      AddFieldBar.tsx      Compact add-field chip row
      LayoutControls.tsx   Image align/width + repeater direction controls
      FieldInput.tsx       Renders one field by type (text/textarea/tags/image/repeater)
      Customizer.tsx       Template / color / font controls
    organisms/
      Editor.tsx           Header editor + draggable block list + add-section
      BlockEditor.tsx      One block (content-only, collapsible)
      CreateBlockModal.tsx Create/edit a block's structure
      BlockManagerModal.tsx "My blocks" — list, insert, edit, delete templates
      ResumePreview.tsx    A4 page; renders blocks generically (print target)
      SignInPrompt.tsx     Google sign-in gate modal
  App.tsx                  Layout, top bar, theme toggle, PDF download
  App.css                  All UI + resume + @media print styles
```

## Data model (blocks)

A resume is a `header` plus an ordered list of **blocks**. Each block has a
`fields` array (the schema) and a `values` map. A field has a `type`
(`text` | `textarea` | `tags` | `image` | `repeater`) and an optional
`locked: true` for built-in fields that can't be removed. Repeater fields carry
their own nested `fields` schema for each row. This is what makes both custom
sections and "extend-but-don't-delete" built-in sections work from one code path.

When the schema changes in future, bump `SCHEMA_VERSION` in `types.ts`; the
loader in `useResume.ts` discards docs it can't read and falls back to the sample.

## How PDF export works

Clicking **Download PDF** calls `window.print()`. The `@media print` rules in `App.css` hide all UI chrome and render only the `#resume-page` element at A4 size. In the print dialog, choose **Save as PDF**. Enabling "Background graphics" in the dialog preserves accent colors.
