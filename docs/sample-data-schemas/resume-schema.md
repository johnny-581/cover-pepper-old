# Resume — Data Schema (Jake Ryan)

## Template LaTeX

```latex
\documentclass{resume}

\name{\field{name}}
\contact{\field{email}}{\field{phone}}{\field{website}}

\begin{each}{sections}
\section{\field{heading}}

\begin{each}{entries}
  \entry{\field{title}}{\field{subtitle}}{\field{startDate} -- \field{endDate}}

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

## Template

```json
{
  "fields": [
    { "id": "name" },
    { "id": "email" },
    { "id": "phone" },
    { "id": "website", "optional": true }
  ],
  "lists": [],
  "groupLists": [
    {
      "id": "sections",
      "fields": [{ "id": "heading" }],
      "lists": [],
      "groupLists": [
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
          "groupLists": []
        }
      ]
    }
  ],
  "layout": [
    {
      "type": "row",
      "blocks": [
        {
          "type": "field",
          "fieldId": "name",
          "sizing": "fill",
          "placeholder": "Full Name",
          "style": { "font": "sans-lg", "background": "none" },
          "outputStyle": { "bold": true, "italic": false, "underline": false }
        }
      ]
    },
    {
      "type": "row",
      "blocks": [
        {
          "type": "field",
          "fieldId": "email",
          "sizing": "hug",
          "placeholder": "Email",
          "style": { "font": "sans-sm", "background": "grey" },
          "outputStyle": { "bold": false, "italic": false, "underline": false }
        },
        { "type": "decorator", "text": " | " },
        {
          "type": "field",
          "fieldId": "phone",
          "sizing": "hug",
          "placeholder": "Phone",
          "style": { "font": "sans-sm", "background": "grey" },
          "outputStyle": { "bold": false, "italic": false, "underline": false }
        },
        { "type": "decorator", "text": " | " },
        {
          "type": "field",
          "fieldId": "website",
          "sizing": "fill",
          "placeholder": "Website",
          "style": { "font": "sans-sm", "background": "grey" },
          "outputStyle": { "bold": false, "italic": false, "underline": false }
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
              "fieldId": "heading",
              "sizing": "fill",
              "placeholder": "Section Name",
              "style": { "font": "sans-md", "background": "yellow" },
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
                  "fieldId": "title",
                  "sizing": "fill",
                  "placeholder": "Title / Degree",
                  "style": { "font": "serif-md", "background": "none" },
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
                  "placeholder": "Company / School",
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
                  "placeholder": "Add a tag...",
                  "display": "plain",
                  "itemStyle": {
                    "font": "sans-sm",
                    "background": "grey",
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
              "placeholder": "Add a highlight...",
              "display": "bulleted",
              "itemStyle": {
                "font": "serif-sm",
                "background": "none",
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
}
```

Notice that **tags** are a `list` inside a `row` (renders horizontally), while **highlights** are a standalone `list` (renders vertically with bullet markers).

## File Version

```json
{
  "id": "v_j4k3r5m6",
  "createdAt": "2026-02-01T00:00:00.000Z",
  "content": {
    "fields": {
      "name": "Jake Ryan",
      "email": "jake@su.edu",
      "phone": "123-456-7890",
      "website": "linkedin.com/in/jake"
    },
    "lists": {},
    "groupLists": {
      "sections": [
        {
          "_key": "e2du7fap",
          "fields": {
            "heading": "Education"
          },
          "lists": {},
          "groupLists": {
            "entries": [
              {
                "_key": "b9sw3qnx",
                "fields": {
                  "title": "Bachelor of Arts in Computer Science, Minor in Business",
                  "subtitle": "Southwestern University",
                  "startDate": "Aug. 2018",
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
                  "title": "Associate's in Liberal Arts",
                  "subtitle": "Blinn College",
                  "startDate": "Aug. 2014",
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
            "heading": "Experience"
          },
          "lists": {},
          "groupLists": {
            "entries": [
              {
                "_key": "f7ag2bnq",
                "fields": {
                  "title": "Undergraduate Research Assistant",
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
                  "title": "Information Technology Support Specialist",
                  "subtitle": "Southwestern University",
                  "startDate": "Sep. 2018",
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
                  "title": "Artificial Intelligence Research Assistant",
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
            "heading": "Projects"
          },
          "lists": {},
          "groupLists": {
            "entries": [
              {
                "_key": "z2ky6tqm",
                "fields": {
                  "title": "Gitlytics",
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
                  "title": "Simple Paintball",
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
            "heading": "Technical Skills"
          },
          "lists": {},
          "groupLists": {
            "entries": [
              {
                "_key": "o9xd5avp",
                "fields": {
                  "title": "Languages",
                  "subtitle": "",
                  "startDate": "",
                  "endDate": "",
                  "location": ""
                },
                "lists": {
                  "tags": [
                    "Java",
                    "Python",
                    "C/C++",
                    "SQL (Postgres)",
                    "JavaScript",
                    "HTML/CSS",
                    "R"
                  ],
                  "highlights": []
                },
                "groupLists": {}
              },
              {
                "_key": "l3mc8uzw",
                "fields": {
                  "title": "Frameworks",
                  "subtitle": "",
                  "startDate": "",
                  "endDate": "",
                  "location": ""
                },
                "lists": {
                  "tags": [
                    "React",
                    "Node.js",
                    "Flask",
                    "JUnit",
                    "WordPress",
                    "Material-UI",
                    "FastAPI"
                  ],
                  "highlights": []
                },
                "groupLists": {}
              },
              {
                "_key": "g7ij2kcn",
                "fields": {
                  "title": "Developer Tools",
                  "subtitle": "",
                  "startDate": "",
                  "endDate": "",
                  "location": ""
                },
                "lists": {
                  "tags": [
                    "Git",
                    "Docker",
                    "TravisCI",
                    "Google Cloud Platform",
                    "VS Code",
                    "Visual Studio",
                    "PyCharm",
                    "IntelliJ",
                    "Eclipse"
                  ],
                  "highlights": []
                },
                "groupLists": {}
              },
              {
                "_key": "s1ve4rgy",
                "fields": {
                  "title": "Libraries",
                  "subtitle": "",
                  "startDate": "",
                  "endDate": "",
                  "location": ""
                },
                "lists": {
                  "tags": ["pandas", "NumPy", "Matplotlib"],
                  "highlights": []
                },
                "groupLists": {}
              }
            ]
          }
        }
      ]
    }
  }
}
```
