# Resume — Data Schema (Jake Ryan)

## Template LaTeX

```latex
\documentclass{resume}

\name{\field{name}}
\contact{\begin{each}{contacts}\field{contact}\end{each}}

\begin{each}{sections}
\section{\field{sectionTitle}}

\begin{each}{entries}
  \entry{\field{entryTitle}}{\field{subtitle}}{\field{startDate} -- \field{endDate}}

  \begin{if}{location}
    \location{\field{location}}
  \end{if}

  \begin{if}{tags}
    \begin{each}{tags}
    \tag{\field{tag}}
    \end{each}
  \end{if}

  \begin{if}{highlights}
  \begin{itemize}
  \begin{each}{highlights}
    \item \field{highlight}
  \end{each}
  \end{itemize}
  \end{if}

\end{each}
\end{each}
```

## Template Spec

```json
{
  "fields": [{ "id": "name" }],
  "lists": [{ "id": "contacts", "itemId": "contact" }],
  "groupLists": [
    {
      "id": "sections",
      "fields": [{ "id": "sectionTitle" }],
      "lists": [],
      "groupLists": [
        {
          "id": "entries",
          "fields": [
            { "id": "entryTitle" },
            { "id": "subtitle" },
            { "id": "startDate" },
            { "id": "endDate" },
            { "id": "location", "optional": true }
          ],
          "lists": [
            { "id": "tags", "itemId": "tag" },
            { "id": "highlights", "itemId": "highlight" }
          ],
          "groupLists": []
        }
      ]
    }
  ]
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
        "style": { "font": "sans-sm", "background": "none" },
        "outputStyle": { "bold": true, "italic": false, "underline": false }
      }
    ]
  },
  {
    "type": "row",
    "blocks": [
      {
        "type": "list",
        "listId": "contacts",
        "sizing": "fill",
        "placeholder": "Add a contact",
        "display": "plain",
        "itemStyle": {
          "font": "sans-sm",
          "outputStyle": { "bold": false, "italic": false, "underline": false }
        }
      }
    ]
  },
  {
    "type": "groupList",
    "groupListId": "sections",
    "layout": [
      {
        "type": "row",
        "blocks": [
          {
            "type": "field",
            "fieldId": "sectionTitle",
            "sizing": "fill",
            "placeholder": "Section Title",
            "style": { "font": "sans-sm", "background": "yellow" },
            "outputStyle": {
              "bold": true,
              "italic": false,
              "underline": false
            }
          }
        ]
      },
      {
        "type": "groupList",
        "groupListId": "entries",
        "layout": [
          {
            "type": "row",
            "blocks": [
              {
                "type": "field",
                "fieldId": "entryTitle",
                "sizing": "fill",
                "placeholder": "Title",
                "style": { "font": "sans-sm", "background": "none" },
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
                "style": { "font": "sans-sm", "background": "grey" },
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
                "style": { "font": "sans-sm", "background": "grey" },
                "outputStyle": {
                  "bold": false,
                  "italic": true,
                  "underline": false
                }
              }
            ]
          },
          {
            "type": "row",
            "blocks": [
              {
                "type": "field",
                "fieldId": "subtitle",
                "sizing": "hug",
                "placeholder": "Company",
                "style": { "font": "sans-sm", "background": "none" },
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
                "style": { "font": "sans-sm", "background": "none" },
                "outputStyle": {
                  "bold": false,
                  "italic": true,
                  "underline": false
                }
              }
            ]
          },
          {
            "type": "row",
            "blocks": [
              {
                "type": "list",
                "listId": "tags",
                "sizing": "fill",
                "placeholder": "Add a tag",
                "display": "plain",
                "itemStyle": {
                  "font": "sans-sm",
                  "outputStyle": {
                    "bold": false,
                    "italic": false,
                    "underline": false
                  }
                }
              }
            ]
          },
          {
            "type": "list",
            "listId": "highlights",
            "sizing": "fill",
            "placeholder": "Add a highlight",
            "display": "plain",
            "itemStyle": {
              "font": "sans-sm",
              "outputStyle": {
                "bold": false,
                "italic": false,
                "underline": false
              }
            }
          }
        ]
      }
    ]
  }
]
```

Notice that **tags** are a `list` inside a `row` (renders horizontally), while **highlights** are a standalone `list` (renders vertically).

## File Version

```json
{
  "fields": {
    "name": "Jake Ryan"
  },
  "lists": {
    "contacts": ["jake@su.edu", "123-456-7890", "linkedin.com/in/jake"]
  },
  "groupLists": {
    "sections": [
      {
        "_key": "e2du7fap",
        "fields": {
          "sectionTitle": "Education"
        },
        "lists": {},
        "groupLists": {
          "entries": [
            {
              "_key": "b9sw3qnx",
              "fields": {
                "entryTitle": "Bachelor of Arts in Computer Science, Minor in Business",
                "subtitle": "Southwestern University",
                "startDate": "Aug 2018",
                "endDate": "May 2021",
                "location": "Georgetown, TX"
              },
              "lists": {
                "tags": [],
                "highlights": []
              },
              "groupLists": {}
            },
            {
              "_key": "r6ht1kyz",
              "fields": {
                "entryTitle": "Associate's in Liberal Arts",
                "subtitle": "Blinn College",
                "startDate": "Aug 2014",
                "endDate": "May 2018",
                "location": "Bryan, TX"
              },
              "lists": {
                "tags": [],
                "highlights": []
              },
              "groupLists": {}
            }
          ]
        }
      },
      {
        "_key": "p3vx8cmw",
        "fields": {
          "sectionTitle": "Experience"
        },
        "lists": {},
        "groupLists": {
          "entries": [
            {
              "_key": "f7ag2bnq",
              "fields": {
                "entryTitle": "Undergraduate Research Assistant",
                "subtitle": "Texas A&M University",
                "startDate": "June 2020",
                "endDate": "Present",
                "location": "College Station, TX"
              },
              "lists": {
                "tags": [],
                "highlights": [
                  "Developed a REST API using <b>FastAPI</b> and PostgreSQL to store data from learning management systems",
                  "Developed a full-stack web application using Flask, React, PostgreSQL and Docker to analyze GitHub data",
                  "Explored ways to visualize GitHub collaboration in a classroom setting"
                ]
              },
              "groupLists": {}
            },
            {
              "_key": "t1mp5rjk",
              "fields": {
                "entryTitle": "Information Technology Support Specialist",
                "subtitle": "Southwestern University",
                "startDate": "Sep 2018",
                "endDate": "Present",
                "location": "Georgetown, TX"
              },
              "lists": {
                "tags": [],
                "highlights": [
                  "Communicate with managers to set up campus computers used on campus",
                  "Assess and troubleshoot computer problems brought by students, faculty and staff",
                  "Maintain upkeep of computers, classroom equipment, and 200 printers across campus"
                ]
              },
              "groupLists": {}
            },
            {
              "_key": "u8nc4dhv",
              "fields": {
                "entryTitle": "Artificial Intelligence Research Assistant",
                "subtitle": "Southwestern University",
                "startDate": "May 2019",
                "endDate": "July 2019",
                "location": "Georgetown, TX"
              },
              "lists": {
                "tags": [],
                "highlights": [
                  "Explored methods to generate video game dungeons based off of <i>The Legend of Zelda</i>",
                  "Developed a game in Java to test the generated dungeons",
                  "Contributed 50K+ lines of code to an established codebase via Git",
                  "Conducted a human subject study to determine which video game dungeon generation technique is enjoyable",
                  "Wrote an 8-page paper and gave multiple presentations on-campus",
                  "Presented virtually to the World Conference on Computational Intelligence"
                ]
              },
              "groupLists": {}
            }
          ]
        }
      },
      {
        "_key": "c5jw9plx",
        "fields": {
          "sectionTitle": "Projects"
        },
        "lists": {},
        "groupLists": {
          "entries": [
            {
              "_key": "z2ky6tqm",
              "fields": {
                "entryTitle": "Gitlytics",
                "subtitle": "",
                "startDate": "June 2020",
                "endDate": "Present",
                "location": ""
              },
              "lists": {
                "tags": ["Python", "Flask", "React", "PostgreSQL", "Docker"],
                "highlights": [
                  "Developed a full-stack web application using Flask serving a REST API with React as the frontend",
                  "Implemented GitHub OAuth to get data from user's repositories",
                  "Visualized GitHub data to show collaboration",
                  "Used Celery and Redis for asynchronous tasks"
                ]
              },
              "groupLists": {}
            },
            {
              "_key": "w4fb3ens",
              "fields": {
                "entryTitle": "Simple Paintball",
                "subtitle": "",
                "startDate": "May 2018",
                "endDate": "May 2020",
                "location": ""
              },
              "lists": {
                "tags": ["Spigot API", "Java", "Maven", "TravisCI", "Git"],
                "highlights": [
                  "Developed a Minecraft server plugin to entertain kids during free time for a previous job",
                  "Published plugin to websites gaining 2K+ downloads and an average 4.5/5-star review",
                  "Implemented continuous delivery using TravisCI to build the plugin upon a new release",
                  "Collaborated with Minecraft server administrators to suggest features and get feedback about the plugin"
                ]
              },
              "groupLists": {}
            }
          ]
        }
      },
      {
        "_key": "n6qr1hbt",
        "fields": {
          "sectionTitle": "Technical Skills"
        },
        "lists": {},
        "groupLists": {
          "entries": [
            {
              "_key": "o9xd5avp",
              "fields": {
                "entryTitle": "",
                "subtitle": "",
                "startDate": "",
                "endDate": "",
                "location": ""
              },
              "lists": {
                "tags": [],
                "highlights": [
                  "<b>Languages:</b> Java, Python, C/C++, SQL (Postgres), JavaScript, HTML/CSS, R",
                  "<b>Frameworks:</b> React, Node.js, Flask, JUnit, WordPress, Material-UI, FastAPI",
                  "<b>Developer Tools:</b> Git, Docker, TravisCI, Google Cloud Platform, VS Code, Visual Studio, PyCharm, IntelliJ, Eclipse",
                  "<b>Libraries:</b> pandas, NumPy, Matplotlib"
                ]
              },
              "groupLists": {}
            }
          ]
        }
      }
    ]
  }
}
```
