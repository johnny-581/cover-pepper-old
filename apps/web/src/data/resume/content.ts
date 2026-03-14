import type { FileContent } from "@pepper-apply/shared";

export const templateContent: FileContent = {
  fields: {
    name: "<b>Jake Ryan</b>",
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
        fields: { sectionTitle: "<b>Education</b>" },
        lists: {},
        inlineLists: {},
        groupLists: {
          entries: [
            {
              _key: "b9sw3qnx",
              _hidden: ["highlights", "location"],
              fields: {
                entryTitle: "<b>Southwestern University</b>",
                entrySubtitle:
                  "<i>Bachelor of Arts in Computer Science, Minor in Business</i>",
                startDate: "<i>Aug 2018</i>",
                endDate: "<i>May 2021</i>",
                location: "<i>Georgetown, TX</i>",
              },
              lists: { highlights: [] },
              inlineLists: {},
              groupLists: {},
            },
            {
              _key: "r6ht1kyz",
              _hidden: ["highlights"],
              fields: {
                entryTitle: "<b>Blinn College</b>",
                entrySubtitle: "<i>Associate's in Liberal Arts</i>",
                startDate: "<i>Aug 2014</i>",
                endDate: "<i>May 2018</i>",
                location: "<i>Bryan, TX</i>",
              },
              lists: { highlights: [] },
              inlineLists: {},
              groupLists: {},
            },
          ],
        },
      },
      {
        _key: "p3vx8cmw",
        fields: { sectionTitle: "<b>Experience</b>" },
        lists: {},
        inlineLists: {},
        groupLists: {
          entries: [
            {
              _key: "f7ag2bnq",
              fields: {
                entryTitle: "<b>Undergraduate Research Assistant</b>",
                entrySubtitle: "<i>Texas A&M University</i>",
                startDate: "<i>June 2020</i>",
                endDate: "<i>Present</i>",
                location: "<i>College Station, TX</i>",
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
              inlineLists: {},
              groupLists: {},
            },
            {
              _key: "t1mp5rjk",
              fields: {
                entryTitle: "<b>Information Technology Support Specialist</b>",
                entrySubtitle: "<i>Southwestern University</i>",
                startDate: "<i>Sep 2018</i>",
                endDate: "<i>Present</i>",
                location: "<i>Georgetown, TX</i>",
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
              inlineLists: {},
              groupLists: {},
            },
            {
              _key: "u8nc4dhv",
              fields: {
                entryTitle: "<b>Artificial Intelligence Research Assistant</b>",
                entrySubtitle: "<i>Southwestern University</i>",
                startDate: "<i>May 2019</i>",
                endDate: "<i>July 2019</i>",
                location: "<i>Georgetown, TX</i>",
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
              inlineLists: {},
              groupLists: {},
            },
          ],
        },
      },
      {
        _key: "c5jw9plx",
        fields: { sectionTitle: "<b>Projects</b>" },
        lists: {},
        inlineLists: {},
        groupLists: {
          entries: [
            {
              _key: "z2ky6tqm",
              _hidden: ["location"],
              fields: {
                entryTitle: "<b>Gitlytics</b>",
                entrySubtitle: "<i>Python, Flask, React, PostgreSQL, Docker</i>",
                startDate: "<i>June 2020</i>",
                endDate: "<i>Present</i>",
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
              inlineLists: {},
              groupLists: {},
            },
            {
              _key: "w4fb3ens",
              _hidden: ["location"],
              fields: {
                entryTitle: "<b>Simple Paintball</b>",
                entrySubtitle: "<i>Spigot API, Java, Maven, TravisCI, Git</i>",
                startDate: "<i>May 2018</i>",
                endDate: "<i>May 2020</i>",
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
              inlineLists: {},
              groupLists: {},
            },
          ],
        },
      },
      {
        _key: "n6qr1hbt",
        fields: { sectionTitle: "<b>Technical Skills</b>" },
        lists: {},
        inlineLists: {},
        groupLists: {
          entries: [
            {
              _key: "o9xd5avp",
              _hidden: [
                "entrySubtitle",
                "startDate",
                "endDate",
                "location",
                "entryTitle",
              ],
              fields: {
                entryTitle: "",
                entrySubtitle: "",
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
              inlineLists: {},
              groupLists: {},
            },
          ],
        },
      },
    ],
  },
};
