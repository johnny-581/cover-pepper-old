# Resume — Data Schema

## Template LaTeX

```latex
\documentclass{resume}

\name{\field{name}}
\contact{\field{email}}{\field{phone}}{\field{website}}

\begin{list}{sections}
\section{\field{heading}}

\begin{list}{entries}
  \entry{\field{title}}{\field{subtitle}}{\field{startDate} -- \field{endDate}}

  \begin{if}{location}
    \location{\field{location}}
  \end{if}

  \begin{if}{tags}
    \begin{list}{tags}
    \tag{\field{tag}}
    \end{list}
  \end{if}

  \begin{if}{highlights}
  \begin{itemize}
  \begin{list}{highlights}
    \item \field{highlight}
  \end{list}
  \end{itemize}
  \end{if}

\end{list}
\end{list}
```

## Template Schema

```json
{
  "fields": [
    { "id": "name" },
    { "id": "email" },
    { "id": "phone" },
    { "id": "website", "optional": true }
  ],
  "lists": [],
  "groups": [
    {
      "id": "sections",
      "fields": [{ "id": "heading" }],
      "lists": [],
      "groups": [
        {
          "id": "entries",
          "fields": [
            { "id": "title" },
            { "id": "subtitle" },
            { "id": "startDate" },
            { "id": "endDate" },
            { "id": "location", "optional": true }
          ],
          "lists": [
            { "id": "tags", "itemId": "tag" },
            { "id": "highlights", "itemId": "highlight" }
          ],
          "groups": []
        }
      ]
    }
  ],
  "layout": [
    {
      "type": "fieldRow",
      "blocks": [
        {
          "type": "field",
          "fieldId": "name",
          "sizing": "fill",
          "placeholder": "Full Name",
          "style": {
            "font": "sans-lg",
            "background": "none",
            "display": "normal"
          },
          "outputStyle": { "bold": true, "italic": false, "underline": false }
        }
      ]
    },
    {
      "type": "fieldRow",
      "blocks": [
        {
          "type": "field",
          "fieldId": "email",
          "sizing": "hug",
          "placeholder": "Email",
          "style": {
            "font": "sans-sm",
            "background": "grey",
            "display": "normal"
          },
          "outputStyle": { "bold": false, "italic": false, "underline": false }
        },
        { "type": "decorator", "text": " | " },
        {
          "type": "field",
          "fieldId": "phone",
          "sizing": "hug",
          "placeholder": "Phone",
          "style": {
            "font": "sans-sm",
            "background": "grey",
            "display": "normal"
          },
          "outputStyle": { "bold": false, "italic": false, "underline": false }
        },
        { "type": "decorator", "text": " | " },
        {
          "type": "field",
          "fieldId": "website",
          "sizing": "fill",
          "placeholder": "Website",
          "style": {
            "font": "sans-sm",
            "background": "grey",
            "display": "normal"
          },
          "outputStyle": { "bold": false, "italic": false, "underline": false }
        }
      ]
    },
    {
      "type": "groupSection",
      "groupId": "sections",
      "layout": [
        {
          "type": "fieldRow",
          "blocks": [
            {
              "type": "field",
              "fieldId": "heading",
              "sizing": "fill",
              "placeholder": "Section Name",
              "style": {
                "font": "sans-md",
                "background": "yellow",
                "display": "normal"
              },
              "outputStyle": {
                "bold": true,
                "italic": false,
                "underline": false
              }
            }
          ]
        },
        {
          "type": "groupSection",
          "groupId": "entries",
          "layout": [
            {
              "type": "fieldRow",
              "blocks": [
                {
                  "type": "field",
                  "fieldId": "title",
                  "sizing": "fill",
                  "placeholder": "Title / Degree",
                  "style": {
                    "font": "serif-md",
                    "background": "none",
                    "display": "normal"
                  },
                  "outputStyle": {
                    "bold": true,
                    "italic": false,
                    "underline": false
                  }
                },
                {
                  "type": "field",
                  "fieldId": "startDate",
                  "sizing": "hug",
                  "placeholder": "Start",
                  "style": {
                    "font": "sans-sm",
                    "background": "grey",
                    "display": "normal"
                  },
                  "outputStyle": {
                    "bold": false,
                    "italic": true,
                    "underline": false
                  }
                },
                { "type": "decorator", "text": " – " },
                {
                  "type": "field",
                  "fieldId": "endDate",
                  "sizing": "hug",
                  "placeholder": "End",
                  "style": {
                    "font": "sans-sm",
                    "background": "grey",
                    "display": "normal"
                  },
                  "outputStyle": {
                    "bold": false,
                    "italic": true,
                    "underline": false
                  }
                }
              ]
            },
            {
              "type": "fieldRow",
              "blocks": [
                {
                  "type": "field",
                  "fieldId": "subtitle",
                  "sizing": "hug",
                  "placeholder": "Company / School",
                  "style": {
                    "font": "sans-sm",
                    "background": "none",
                    "display": "normal"
                  },
                  "outputStyle": {
                    "bold": false,
                    "italic": false,
                    "underline": false
                  }
                },
                { "type": "decorator", "text": " · " },
                {
                  "type": "field",
                  "fieldId": "location",
                  "sizing": "fill",
                  "placeholder": "Location",
                  "style": {
                    "font": "sans-sm",
                    "background": "none",
                    "display": "normal"
                  },
                  "outputStyle": {
                    "bold": false,
                    "italic": true,
                    "underline": false
                  }
                }
              ]
            },
            {
              "type": "fieldRow",
              "blocks": [
                {
                  "type": "field",
                  "fieldId": "tags",
                  "sizing": "fill",
                  "placeholder": "Add a tag...",
                  "style": {
                    "font": "sans-sm",
                    "background": "grey",
                    "display": "normal"
                  },
                  "outputStyle": {
                    "bold": false,
                    "italic": false,
                    "underline": false
                  }
                }
              ]
            },
            {
              "type": "fieldRow",
              "blocks": [
                {
                  "type": "field",
                  "fieldId": "highlights",
                  "sizing": "fill",
                  "placeholder": "Add a highlight...",
                  "style": {
                    "font": "serif-sm",
                    "background": "none",
                    "display": "bulleted"
                  },
                  "outputStyle": {
                    "bold": false,
                    "italic": false,
                    "underline": false
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## File Content

```json
{
  "version": "v_a1b2c3d4",
  "fields": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "(555) 123-4567",
    "website": "janesmith.dev"
  },
  "lists": {},
  "groups": {
    "sections": [
      {
        "_key": "k8f2j1mx",
        "fields": {
          "heading": "Experience"
        },
        "lists": {},
        "groups": {
          "entries": [
            {
              "_key": "a3nq9wvp",
              "fields": {
                "title": "Senior Software Engineer",
                "subtitle": "Stripe",
                "startDate": "2022",
                "endDate": "Present",
                "location": "San Francisco, CA"
              },
              "lists": {
                "tags": ["Go", "Kafka", "PostgreSQL"],
                "highlights": [
                  "Led migration of payments pipeline to <b>event-driven architecture</b>",
                  "Reduced p99 latency by 40% through query optimization"
                ]
              },
              "groups": {}
            },
            {
              "_key": "v7tb4rkc",
              "fields": {
                "title": "Software Engineer",
                "subtitle": "Shopify",
                "startDate": "2019",
                "endDate": "2022",
                "location": "Ottawa, ON"
              },
              "lists": {
                "tags": ["TypeScript", "React", "Ruby"],
                "highlights": [
                  "Built merchant analytics dashboard serving 2M+ stores"
                ]
              },
              "groups": {}
            }
          ]
        }
      },
      {
        "_key": "m2dp8yfn",
        "fields": {
          "heading": "Education"
        },
        "lists": {},
        "groups": {
          "entries": [
            {
              "_key": "q5xc3heg",
              "fields": {
                "title": "B.Sc. Computer Science",
                "subtitle": "University of Waterloo",
                "startDate": "2015",
                "endDate": "2019",
                "location": ""
              },
              "lists": {
                "tags": [],
                "highlights": []
              },
              "groups": {}
            }
          ]
        }
      },
      {
        "_key": "h9wk6ztb",
        "fields": {
          "heading": "Skills"
        },
        "lists": {},
        "groups": {
          "entries": [
            {
              "_key": "j4rm2ayn",
              "fields": {
                "title": "Languages & Frameworks",
                "subtitle": "",
                "startDate": "",
                "endDate": "",
                "location": ""
              },
              "lists": {
                "tags": [
                  "TypeScript",
                  "Python",
                  "Rust",
                  "Go",
                  "React",
                  "Node.js"
                ],
                "highlights": []
              },
              "groups": {}
            }
          ]
        }
      }
    ]
  }
}
```
