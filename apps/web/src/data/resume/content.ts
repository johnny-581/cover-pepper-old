import type { FileContent } from "@pepper-apply/shared";

export const templateContent: FileContent = {
  fields: {
    name: "Jake Ryan",
  },
  lists: {},
  inlineLists: {
    contacts: [
      "123-456-7890",
      "jake@su.edu",
      "linkedin.com/in/jake",
      "github.com/jake",
    ],
  },
  groupLists: {
    sections: [
      {
        _key: "e2du7fap",
        fields: { sectionTitle: "Education" },
        lists: {},
        inlineLists: {},
        groupLists: {
          entries: [
            {
              _key: "b9sw3qnx",
              _hidden: ["tags"],
              fields: {
                entryTitle: "Southwestern University",
                subtitle:
                  "Bachelor of Arts in Computer Science, Minor in Business",
                startDate: "Aug 2018",
                endDate: "May 2021",
                location: "Georgetown, TX",
              },
              lists: { highlights: [] },
              inlineLists: { tags: [] },
              groupLists: {},
            },
            {
              _key: "r6ht1kyz",
              _hidden: ["tags"],
              fields: {
                entryTitle: "Blinn College",
                subtitle: "Associate's in Liberal Arts",
                startDate: "Aug 2014",
                endDate: "May 2018",
                location: "Bryan, TX",
              },
              lists: { highlights: [] },
              inlineLists: { tags: [] },
              groupLists: {},
            },
          ],
        },
      },
      {
        _key: "p3vx8cmw",
        fields: { sectionTitle: "Experience" },
        lists: {},
        inlineLists: {},
        groupLists: {
          entries: [
            {
              _key: "f7ag2bnq",
              _hidden: ["tags"],
              fields: {
                entryTitle: "Undergraduate Research Assistant",
                subtitle: "Texas A&M University",
                startDate: "June 2020",
                endDate: "Present",
                location: "College Station, TX",
              },
              lists: {
                highlights: [
                  {
                    style: "bullet",
                    text: "Developed a REST API using <b>FastAPI</b> and PostgreSQL to store data from learning management systems",
                  },
                  {
                    style: "bullet",
                    text: "Developed a full-stack web application using Flask, React, PostgreSQL and Docker to analyze GitHub data",
                  },
                  {
                    style: "bullet",
                    text: "Explored ways to visualize GitHub collaboration in a classroom setting",
                  },
                ],
              },
              inlineLists: { tags: [] },
              groupLists: {},
            },
            {
              _key: "t1mp5rjk",
              _hidden: ["tags"],
              fields: {
                entryTitle: "Information Technology Support Specialist",
                subtitle: "Southwestern University",
                startDate: "Sep 2018",
                endDate: "Present",
                location: "Georgetown, TX",
              },
              lists: {
                highlights: [
                  {
                    style: "bullet",
                    text: "Communicate with managers to set up campus computers used on campus",
                  },
                  {
                    style: "bullet",
                    text: "Assess and troubleshoot computer problems brought by students, faculty and staff",
                  },
                  {
                    style: "bullet",
                    text: "Maintain upkeep of computers, classroom equipment, and 200 printers across campus",
                  },
                ],
              },
              inlineLists: { tags: [] },
              groupLists: {},
            },
            {
              _key: "u8nc4dhv",
              _hidden: ["tags"],
              fields: {
                entryTitle: "Artificial Intelligence Research Assistant",
                subtitle: "Southwestern University",
                startDate: "May 2019",
                endDate: "July 2019",
                location: "Georgetown, TX",
              },
              lists: {
                highlights: [
                  {
                    style: "bullet",
                    text: "Explored methods to generate video game dungeons based off of <i>The Legend of Zelda</i>",
                  },
                  {
                    style: "bullet",
                    text: "Developed a game in Java to test the generated dungeons",
                  },
                  {
                    style: "bullet",
                    text: "Contributed 50K+ lines of code to an established codebase via Git",
                  },
                  {
                    style: "bullet",
                    text: "Conducted a human subject study to determine which video game dungeon generation technique is enjoyable",
                  },
                  {
                    style: "bullet",
                    text: "Wrote an 8-page paper and gave multiple presentations on-campus",
                  },
                  {
                    style: "bullet",
                    text: "Presented virtually to the World Conference on Computational Intelligence",
                  },
                ],
              },
              inlineLists: { tags: [] },
              groupLists: {},
            },
          ],
        },
      },
      {
        _key: "c5jw9plx",
        fields: { sectionTitle: "Projects" },
        lists: {},
        inlineLists: {},
        groupLists: {
          entries: [
            {
              _key: "z2ky6tqm",
              _hidden: ["location"],
              fields: {
                entryTitle: "Gitlytics",
                subtitle: "",
                startDate: "June 2020",
                endDate: "Present",
                location: "",
              },
              lists: {
                highlights: [
                  {
                    style: "bullet",
                    text: "Developed a full-stack web application using Flask serving a REST API with React as the frontend",
                  },
                  {
                    style: "bullet",
                    text: "Implemented GitHub OAuth to get data from user's repositories",
                  },
                  {
                    style: "bullet",
                    text: "Visualized GitHub data to show collaboration",
                  },
                  {
                    style: "bullet",
                    text: "Used Celery and Redis for asynchronous tasks",
                  },
                ],
              },
              inlineLists: {
                tags: ["Python", "Flask", "React", "PostgreSQL", "Docker"],
              },
              groupLists: {},
            },
            {
              _key: "w4fb3ens",
              _hidden: ["location"],
              fields: {
                entryTitle: "Simple Paintball",
                subtitle: "",
                startDate: "May 2018",
                endDate: "May 2020",
                location: "",
              },
              lists: {
                highlights: [
                  {
                    style: "bullet",
                    text: "Developed a Minecraft server plugin to entertain kids during free time for a previous job",
                  },
                  {
                    style: "bullet",
                    text: "Published plugin to websites gaining 2K+ downloads and an average 4.5/5-star review",
                  },
                  {
                    style: "bullet",
                    text: "Implemented continuous delivery using TravisCI to build the plugin upon a new release",
                  },
                  {
                    style: "bullet",
                    text: "Collaborated with Minecraft server administrators to suggest features and get feedback about the plugin",
                  },
                ],
              },
              inlineLists: {
                tags: ["Spigot API", "Java", "Maven", "TravisCI", "Git"],
              },
              groupLists: {},
            },
          ],
        },
      },
      {
        _key: "n6qr1hbt",
        fields: { sectionTitle: "Technical Skills" },
        lists: {},
        inlineLists: {},
        groupLists: {
          entries: [
            {
              _key: "o9xd5avp",
              _hidden: ["location", "tags"],
              fields: {
                entryTitle: "",
                subtitle: "",
                startDate: "",
                endDate: "",
                location: "",
              },
              lists: {
                highlights: [
                  {
                    style: "plain",
                    text: "<b>Languages:</b> Java, Python, C/C++, SQL (Postgres), JavaScript, HTML/CSS, R",
                  },
                  {
                    style: "plain",
                    text: "<b>Frameworks:</b> React, Node.js, Flask, JUnit, WordPress, Material-UI, FastAPI",
                  },
                  {
                    style: "plain",
                    text: "<b>Developer Tools:</b> Git, Docker, TravisCI, Google Cloud Platform, VS Code, Visual Studio, PyCharm, IntelliJ, Eclipse",
                  },
                  {
                    style: "plain",
                    text: "<b>Libraries:</b> pandas, NumPy, Matplotlib",
                  },
                ],
              },
              inlineLists: { tags: [] },
              groupLists: {},
            },
          ],
        },
      },
    ],
  },
};
