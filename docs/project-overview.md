# Overview

A LaTeX-based resume and cover letter editor.

**Philosophy:** Intuitive editing and easy management of job application files, giving users full control over their documents through direct access to the LaTeX template.

# Data Model

Content and presentation are kept separate. The LaTeX template contains no content; the content contains no styles (apart from inline formatting like bold and italic).

**Application** — The top-level container. Holds artifacts and metadata like company name, position title, date, email, phone, and job description.

**Artifact** — A renderable output (PDF or file) stored within an application.

**File** — Has a content (JSON) and a reference to a template. Can be a resume, cover letter, or anything else. Each file supports multiple versions — versions are editable branches that share a template, and the latest is shown by default.

**Content** — The JSON data for a file. Contains named fields (e.g. greeting, paragraph 1, paragraph 2 for a cover letter).

**Template** — Stored as tagged LaTeX strings. Combined with content via a templating engine. Each template has a type (e.g. resume, cover letter) and should only be applied to files of the matching type.

**User Profile** - There is a global user profile, but it is not directly referenced by application metadata or file contents.

# The Content Editor

A block-based editor for individual files in an application. Displayed to the right when an application is selected in the left sidebar, defaulting to the resume view.

The editor has two modes: **Content** and **Layout**. Content mode is for everyday editing. Layout mode is for arranging how fields appear in the editor (not in the PDF) and is primarily used by template creators.

## Content Mode

Each block is an editable field. Fields show grey placeholder text when empty and support bold, italic, underline, and hyperlink styling via a Notion-like toolbar that appears on text selection.

Blocks can be arranged side by side on the same line (useful for resume layouts). In this mode, block positions and the set of available fields are fixed — they're determined by the template. You can't add, remove, or rearrange blocks here, except within lists.

**Standalone fields vs. lists**

A field can either be standalone or part of a list — this is defined by the template, not the editor.

- **List of fields:** A repeating single field (e.g. a list of bullet points). Press Enter in a field to add a new item; press Delete in an empty field to remove it (the last item cannot be deleted).
- **List of groups:** A repeating set of multiple fields (e.g. a job entry with title, company, date, and bullets). These show Notion-like drag and add handles on hover and support drag-and-drop reordering.

Cross-block text selection in a list of fields works just like in Notion. For example, If I select parts of bullet A and bullet B simultaneously and press delete, the editor should combine A and B to a single bullet with the selected text portions deleted.

Decorative texts (e.g. a "–" between two date fields) can appear between blocks as defined in the layout.

## Layout Mode

> Primarily for template creators. Most users won't need this.

Layout mode controls how fields are arranged in the content editor — not in the final PDF (which is controlled by the LaTeX template).

In this mode you can:

- **Reorder fields** via drag and drop
- **Edit placeholder strings** by clicking into a field
- **Add decorative Texts** between fields (e.g. " – " between Start Date and End Date)
- **Style fields** — font (sans/serif, lg/md/sm), background colour (grey/yellow/none), and display style (bulleted or normal)

**Layout rules:** Every line must be fully covered by blocks — no empty horizontal space. If multiple blocks share a line, one is marked as **fill** (stretches to fill remaining space) and the rest **hug** their content. This ensures clicking anywhere on the canvas lands your cursor in a field.

The layout is stored in the template JSON and stays in sync with the fields defined in the LaTeX template.

# The LaTeX Editor

Allows direct editing of the raw LaTeX template. Shows only the template — not the content.

Edits apply to all files using the same template. If you want to change the template for just one file, you can fork it into a new template.

Fields are represented by named tags. A field's tag name (e.g. "Section Heading") is separate from its placeholder string in the content editor (e.g. "School Name") — this separation is necessary because lists are condensed in the LaTeX view.

The editor also supports logic flow tags: loop tags and conditional display tags.

# AI Tailoring

AI Tailoring is per-application and can be removed without affecting the core user flow.

The user pastes in a job description. The AI selects the most relevant previous application, clones it, and tailors the clone to match the job description.