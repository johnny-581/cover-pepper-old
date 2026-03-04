# Repo Structure

## Root

```
pepper-apply/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   └── shared/
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## `packages/shared`

Shared types, Zod schemas, and constants imported by both `web` and `api`. No runtime dependencies — pure TypeScript.

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── template.ts        # TemplateSchema, FieldDef, ListDef, GroupDef, LayoutRow, BlockStyle, OutputStyle
│   │   ├── content.ts         # FileContent, GroupInstance
│   │   ├── file.ts            # File, FileVersion
│   │   ├── application.ts     # Application, ApplicationMetadata
│   │   └── index.ts
│   ├── schemas/               # Zod schemas mirroring the types above (used for API validation + AI output validation)
│   │   ├── template.ts
│   │   ├── content.ts
│   │   ├── file.ts
│   │   ├── application.ts
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

## `apps/api`

Fastify server. tRPC router. Prisma for DB access. All routes behind Clerk.

```
apps/api/
├── src/
│   ├── index.ts                   # Fastify server bootstrap, plugin registration
│   ├── trpc.ts                    # tRPC init, context (Clerk auth), base router
│   ├── router.ts                  # Root router — merges all feature routers
│   │
│   ├── features/
│   │   ├── applications/
│   │   │   ├── router.ts          # CRUD for applications
│   │   │   └── service.ts
│   │   ├── files/
│   │   │   ├── router.ts          # CRUD for files + versions
│   │   │   └── service.ts
│   │   ├── templates/
│   │   │   ├── router.ts          # CRUD for templates (user-editable)
│   │   │   └── service.ts
│   │   ├── profile/
│   │   │   ├── router.ts
│   │   │   └── service.ts
│   │   └── ai/
│   │       ├── router.ts          # AI tailoring endpoint
│   │       └── service.ts         # Selects best prior app, clones version, calls LLM, validates output
│   │
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── clerk.ts               # Clerk middleware for Fastify
│   │   ├── templating-engine/
│   │   │   ├── index.ts           # Entry: takes LaTeX template + FileContent → final LaTeX string
│   │   │   ├── parser.ts          # LaTeX AST parser — validates \begin/\end pairs, reports line errors
│   │   │   ├── renderer.ts        # AST walker with scope stack (\field, \begin{each}, \begin{if})
│   │   │   └── html-to-latex.ts   # Richtext HTML → LaTeX; escapes special chars in text nodes
│   │   ├── schema-sync/
│   │   │   ├── index.ts           # Entry: diffs LaTeX parse against TemplateSchema + layout
│   │   │   ├── validator.ts       # Checks layout fieldIds/groupIds exist in schema; warns on missing
│   │   │   └── reconciler.ts      # Auto-adds/removes fields from schema + layout on LaTeX save
│   │   └── output-style.ts        # Wraps rendered LaTeX content with \textbf{}, \textit{}, \underline{} per outputStyle flags
│   │
│   └── middleware/
│       └── auth.ts                # Clerk JWT verification, attaches userId to request context
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                    # Seeds default resume + cover letter templates
│
├── package.json
└── tsconfig.json
```

### Key API decisions

- The **templating engine** and **schema-sync** live in `api/lib` — they are server-side operations triggered on save and on PDF compilation. They are not shared with the frontend.
- `ai/service.ts` is the only place that calls the LLM. It imports `FileContent` + `TemplateSchema` Zod schemas from `shared` to validate the AI's structured JSON output before saving.
- The PDF compilation call is a thin HTTP call to the separate PDF service — one function in `files/service.ts`, no dedicated module needed yet.

---

## `apps/web`

Vite + React. Feature-based. tRPC client pulls the router type from `apps/api`.

```
apps/web/
├── src/
│   ├── main.tsx
│   ├── app.tsx                    # Root layout, routing (TanStack Router)
│   │
│   ├── features/
│   │   │
│   │   ├── applications/          # Left sidebar — list, create, search
│   │   │   ├── components/
│   │   │   │   ├── ApplicationSidebar.tsx
│   │   │   │   ├── ApplicationItem.tsx
│   │   │   │   └── NewApplicationModal.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useApplications.ts
│   │   │   └── store.ts           # Active application selection (Zustand)
│   │   │
│   │   ├── editor/                # Shell that owns the right panel — tab bar, coordinates sub-features
│   │   │   ├── components/
│   │   │   │   ├── EditorShell.tsx          # Application tab bar (Application | File | Versions | AI Auto Fill)
│   │   │   │   ├── FileTabBar.tsx           # Resume / Cover Letter switcher
│   │   │   │   └── EditorModeSwitcher.tsx   # Content / Layout mode toggle
│   │   │   └── store.ts           # Active file, active mode (content/layout), active tab
│   │   │
│   │   ├── content-editor/        # The block-based field editor (Content mode)
│   │   │   ├── components/
│   │   │   │   ├── ContentEditor.tsx        # Walks layout tree, renders rows + sections
│   │   │   │   ├── FieldRow.tsx             # Flex row of FieldBlocks + DecoratorBlocks
│   │   │   │   ├── FieldBlock.tsx           # Single Tiptap instance; applies outputStyle as base CSS
│   │   │   │   ├── DecoratorBlock.tsx       # Static text (e.g. " – ", " | ")
│   │   │   │   ├── GroupSection.tsx         # Recursive; renders drag handles + add button for group lists
│   │   │   │   ├── ListField.tsx            # List-of-fields (bullets): Enter/Backspace behaviour
│   │   │   │   └── RichTextToolbar.tsx      # Floating Notion-style toolbar (B / I / U / Link)
│   │   │   ├── hooks/
│   │   │   │   ├── useFieldContent.ts       # Reads/writes a single field value in the Zustand content store
│   │   │   │   └── useGroupInstances.ts     # CRUD + reorder for group instance arrays
│   │   │   └── store.ts           # FileContent state (Immer), dirty flag, optimistic updates
│   │   │
│   │   ├── layout-editor/         # Layout mode — deferred; scaffold only
│   │   │   ├── components/
│   │   │   │   └── LayoutEditor.tsx         # Placeholder: "Layout editing coming soon"
│   │   │   └── store.ts
│   │   │
│   │   ├── latex-editor/          # Raw LaTeX template editor
│   │   │   ├── components/
│   │   │   │   ├── LaTeXEditor.tsx          # Monaco instance
│   │   │   │   ├── ForkTemplateModal.tsx    # "This will affect all files — fork?" dialog
│   │   │   │   └── SchemaSyncWarnings.tsx   # Inline warnings from schema-sync on save
│   │   │   ├── hooks/
│   │   │   │   └── useLatexEditor.ts        # Save handler: calls tRPC, surfaces sync errors/warnings
│   │   │   └── monaco/
│   │   │       ├── language.ts              # Monaco language definition for \field{}, \begin{each}, etc.
│   │   │       ├── highlighting.ts          # Syntax highlighting rules for pseudo-commands
│   │   │       └── autocomplete.ts          # Suggests field/list/group IDs from schema
│   │   │
│   │   ├── versions/              # Versions tab
│   │   │   ├── components/
│   │   │   │   ├── VersionsPanel.tsx
│   │   │   │   ├── VersionItem.tsx          # Label, created date, active badge, delete button
│   │   │   │   └── NewVersionModal.tsx      # Clone active + name it
│   │   │   └── hooks/
│   │   │       └── useVersions.ts
│   │   │
│   │   ├── ai-tailoring/          # AI Auto Fill tab
│   │   │   ├── components/
│   │   │   │   ├── AITailoringPanel.tsx
│   │   │   │   ├── JobDescriptionInput.tsx
│   │   │   │   └── TailoringStatusCard.tsx  # Shows which prior application was selected, version created
│   │   │   └── hooks/
│   │   │       └── useAITailoring.ts        # Calls tRPC ai.tailor, handles loading/error/success
│   │   │
│   │   ├── preview/               # PDF preview panel (right side)
│   │   │   ├── components/
│   │   │   │   ├── PreviewPanel.tsx         # react-pdf renderer
│   │   │   │   └── PreviewToolbar.tsx       # Zoom, page count
│   │   │   └── hooks/
│   │   │       └── usePreview.ts            # Triggers compile on save, manages PDF blob URL
│   │   │
│   │   ├── templates/             # Template management (user-editable)
│   │   │   ├── components/
│   │   │   │   ├── TemplateList.tsx
│   │   │   │   ├── TemplateItem.tsx
│   │   │   │   └── NewTemplateModal.tsx
│   │   │   └── hooks/
│   │   │       └── useTemplates.ts
│   │   │
│   │   └── profile/
│   │       ├── components/
│   │       │   └── ProfileForm.tsx
│   │       └── hooks/
│   │           └── useProfile.ts
│   │
│   ├── lib/
│   │   ├── trpc.ts                # tRPC client setup; imports AppRouter type from apps/api
│   │   ├── utils.ts               # cn(), nanoid wrappers, etc.
│   │   └── constants.ts
│   │
│   ├── components/                # Truly shared UI — not feature-specific
│   │   ├── ui/                    # shadcn/ui component re-exports
│   │   └── layout/
│   │       └── AppLayout.tsx      # Sidebar + main panel shell
│   │
│   └── styles/
│       └── globals.css
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

---

## What lives where — quick reference

| Concern                             | Location                                                           |
| ----------------------------------- | ------------------------------------------------------------------ |
| Domain types + Zod schemas          | `packages/shared/src/`                                             |
| tRPC router type (exported for web) | `apps/api/src/router.ts`                                           |
| LaTeX → PDF (future)                | Separate service, HTTP call from `api/features/files/service.ts`   |
| LaTeX template parsing + rendering  | `apps/api/src/lib/templating-engine/`                              |
| HTML → LaTeX conversion + escaping  | `apps/api/src/lib/templating-engine/html-to-latex.ts`              |
| Layout ↔ schema sync                | `apps/api/src/lib/schema-sync/`                                    |
| `outputStyle` wrapping              | `apps/api/src/lib/output-style.ts`                                 |
| Tiptap rich text fields             | `apps/web/src/features/content-editor/`                            |
| Monaco LaTeX editor                 | `apps/web/src/features/latex-editor/`                              |
| dnd-kit drag handles                | `apps/web/src/features/content-editor/components/GroupSection.tsx` |
| Zustand stores                      | One `store.ts` per feature slice                                   |
| shadcn/ui components                | `apps/web/src/components/ui/`                                      |
| Clerk auth (server)                 | `apps/api/src/middleware/auth.ts`                                  |
| Clerk auth (client)                 | Clerk React provider in `apps/web/src/app.tsx`                     |
| DB seed (default templates)         | `apps/api/prisma/seed.ts`                                          |
