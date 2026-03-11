import type { TemplateSpec } from "@pepper-apply/shared";

export const templateSpec: TemplateSpec = {
  fields: [{ id: "name" }],
  lists: [],
  inlineLists: [{ id: "contacts" }],
  groupLists: [
    {
      id: "sections",
      fields: [{ id: "sectionTitle" }],
      lists: [],
      inlineLists: [],
      groupLists: [
        {
          id: "entries",
          fields: [
            { id: "entryTitle" },
            { id: "subtitle" },
            { id: "startDate" },
            { id: "endDate" },
            { id: "location", optional: true },
          ],
          lists: [{ id: "highlights" }],
          inlineLists: [{ id: "tags" }],
          groupLists: [],
        },
      ],
    },
  ],
};
