# Cover Letter — Data Schema

## Template LaTeX

```latex
\documentclass{coverletter}

\recipient{\field{company}}{\field{hiringManager}}
\date{\field{date}}

\opening{\field{greeting}}

\begin{each}{body}
\field{paragraph}

\end{each}

\closing{\field{closing}}
```

## Template Schema

```json
{
  "fields": [
    { "id": "company" },
    { "id": "hiringManager", "optional": true },
    { "id": "date" },
    { "id": "greeting" },
    { "id": "closing" }
  ],
  "lists": [
    { "id": "body", "itemId": "paragraph" }
  ],
  "groups": [],
  "layout": [
    {
      "type": "fieldRow",
      "blocks": [
        {
          "type": "field",
          "fieldId": "company",
          "sizing": "fill",
          "placeholder": "Company Name",
          "style": { "font": "sans-md", "background": "grey", "display": "normal" },
          "outputStyle": { "bold": true, "italic": false, "underline": false }
        },
        {
          "type": "field",
          "fieldId": "date",
          "sizing": "hug",
          "placeholder": "Date",
          "style": { "font": "sans-sm", "background": "grey", "display": "normal" },
          "outputStyle": { "bold": false, "italic": false, "underline": false }
        }
      ]
    },
    {
      "type": "fieldRow",
      "blocks": [
        {
          "type": "field",
          "fieldId": "hiringManager",
          "sizing": "fill",
          "placeholder": "Hiring Manager (optional)",
          "style": { "font": "sans-sm", "background": "grey", "display": "normal" },
          "outputStyle": { "bold": false, "italic": false, "underline": false }
        }
      ]
    },
    {
      "type": "fieldRow",
      "blocks": [
        {
          "type": "field",
          "fieldId": "greeting",
          "sizing": "fill",
          "placeholder": "Dear Hiring Manager,",
          "style": { "font": "serif-md", "background": "none", "display": "normal" },
          "outputStyle": { "bold": false, "italic": false, "underline": false }
        }
      ]
    },
    {
      "type": "fieldRow",
      "blocks": [
        {
          "type": "field",
          "fieldId": "body",
          "sizing": "fill",
          "placeholder": "Write a paragraph...",
          "style": { "font": "serif-sm", "background": "none", "display": "normal" },
          "outputStyle": { "bold": false, "italic": false, "underline": false }
        }
      ]
    },
    {
      "type": "fieldRow",
      "blocks": [
        {
          "type": "field",
          "fieldId": "closing",
          "sizing": "fill",
          "placeholder": "Sincerely,",
          "style": { "font": "serif-md", "background": "none", "display": "normal" },
          "outputStyle": { "bold": false, "italic": false, "underline": false }
        }
      ]
    }
  ]
}
```

## File Version

```json
{
  "id": "v_x9y8z7w6",
  "createdAt": "2026-02-01T00:00:00.000Z",
  "content": {
    "fields": {
      "company": "Stripe",
      "hiringManager": "John Collison",
      "date": "February 2026",
      "greeting": "Dear Mr. Collison,",
      "closing": "Sincerely,"
    },
    "lists": {
      "body": [
        "I'm writing to express my interest in the Senior Engineer role at Stripe.",
        "In my current role at Shopify, I led the migration of the payments pipeline to an <b>event-driven architecture</b>, reducing p99 latency by 40%.",
        "I'd welcome the opportunity to discuss how my experience aligns with your team's goals."
      ]
    },
    "groups": {}
  }
}
```
