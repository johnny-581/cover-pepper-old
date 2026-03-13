# Cover Letter — Data Schema (Johnny Dong)

## Template LaTeX

```latex
\documentclass{coverletter}

\name{\field{name}}
\contact{\inlinelist{contacts}{ | }}

\date{\field{date}}
\recipient{\field{company}}{\field{address}}
\subject{\field{subject}}

\opening{\field{greeting}}

\list{body}

\closing{\field{closing}}
```

## Template Spec

```json
{
  "fields": [
    { "id": "name" },
    { "id": "date" },
    { "id": "company" },
    { "id": "address" },
    { "id": "subject" },
    { "id": "greeting" },
    { "id": "closing" }
  ],
  "lists": [{ "id": "body" }],
  "inlineLists": [{ "id": "contacts" }],
  "groupLists": []
}
```

## Template Layout

```json
[
  {
    "type": "row",
    "blocks": [
      {
        "type": "field",
        "fieldId": "name",
        "sizing": "fill",
        "placeholder": "Full Name",
        "defaultFormat": { "bold": true }
      }
    ]
  },
  {
    "type": "row",
    "blocks": [
      {
        "type": "inlinelist",
        "listId": "contacts",
        "sizing": "fill",
        "placeholder": "Add a contact",
        "size": "small"
      }
    ]
  },
  {
    "type": "row",
    "blocks": [
      {
        "type": "field",
        "fieldId": "company",
        "sizing": "fill",
        "placeholder": "Company Name",
        "size": "small",
        "background": "grey"
      },
      {
        "type": "field",
        "fieldId": "date",
        "sizing": "hug",
        "placeholder": "Date",
        "size": "small",
        "background": "grey"
      }
    ]
  },
  {
    "type": "row",
    "blocks": [
      {
        "type": "field",
        "fieldId": "address",
        "sizing": "fill",
        "placeholder": "Address (optional)",
        "size": "small",
        "background": "grey"
      }
    ]
  },
  {
    "type": "row",
    "blocks": [
      {
        "type": "field",
        "fieldId": "subject",
        "sizing": "fill",
        "placeholder": "Position Title",
        "size": "small",
        "background": "grey",
        "defaultFormat": { "bold": true }
      }
    ]
  },
  {
    "type": "row",
    "blocks": [
      {
        "type": "field",
        "fieldId": "greeting",
        "sizing": "fill",
        "placeholder": "Dear Hiring Manager,",
        "font": "serif"
      }
    ]
  },
  {
    "type": "list",
    "listId": "body",
    "sizing": "fill",
    "placeholder": "Write a paragraph...",
    "font": "serif",
    "size": "small"
  },
  {
    "type": "row",
    "blocks": [
      {
        "type": "field",
        "fieldId": "closing",
        "sizing": "fill",
        "placeholder": "Sincerely,",
        "font": "serif"
      }
    ]
  }
]
```

Notice that **contacts** is an `inlinelist` inside a `row` (renders horizontally with separators), while **body** is a standalone `list` (renders vertically with per-item style control).

## File Version

```json
{
  "id": "v_x9y8z7w6",
  "createdAt": "2026-02-16T00:00:00.000Z",
  "content": {
    "fields": {
      "name": "Johnny Dong",
      "date": "February 16, 2026",
      "company": "UBC Cloud Innovation Centre",
      "address": "Vancouver, BC Canada",
      "subject": "CIC Developer",
      "greeting": "Dear Hiring Manager,",
      "closing": "Sincerely,"
    },
    "lists": {
      "body": [
        {
          "style": "plain",
          "text": "I'm a fourth-year UBC Computer Science student writing to express my strong interest in the CIC Developer role at the UBC Cloud Innovation Centre. I'm driven by the challenge of bridging technical depth with intuitive software design to solve community challenges, and I'm ready to contribute to the CIC's mission of applying emerging technology to pressing community issues."
        },
        {
          "style": "plain",
          "text": "Currently, as a Software Engineer at Customer Maps, I manage the full lifecycle of an AI shopping assistant Shopify app. I'm redesigning the multi-agent orchestration using Google's ADK to optimize for performance and response, which has honed my ability to research potential solution options and learn new technologies quickly."
        },
        {
          "style": "plain",
          "text": "My technical approach is deeply user-centric. At the UBC UX Hub, I built an end-to-end event registration portal on Supabase and Next.js, streamlining community engagement. I also co-created \"Access Buddy\", a voice-controlled Chrome extension that won the <b>Potential Community Impact Award</b> at nwHacks 2025, reinforcing my belief that innovation must be accessible and solve real-world problems. This term, I lead a team of 5 developers and 2 designers to build a project for the <b>Gemini Hackathon</b>. I handled technical documentation and PR reviews, ensuring that we produced well-documented code while developing a realtime AI live-chat feature."
        },
        {
          "style": "plain",
          "text": "Beyond code, roles like my time as a Jump Start Orientation Leader have taught me that clear oral and written communication is vital for project success. I'm excited to bring my background in full-stack development and my passion for cloud innovation to the CIC to help deliver meaningful solutions to your sponsors and clients."
        }
      ]
    },
    "inlineLists": {
      "contacts": ["dongjiayang123@gmail.com", "672 855 3538"]
    },
    "groupLists": {}
  }
}
```
