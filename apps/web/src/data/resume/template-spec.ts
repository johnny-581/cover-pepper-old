import type { TemplateSpec } from "@pepper-apply/shared";

export const templateSpec: TemplateSpec = {
  fields: [{ id: "name" }],
  lists: [{ id: "contacts", itemId: "contact" }],
  groupLists: [
    {
      id: "sections",
      fields: [{ id: "sectionTitle" }],
      lists: [],
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
          lists: [
            { id: "tags", itemId: "tag" },
            { id: "highlights", itemId: "highlight" },
          ],
          groupLists: [],
        },
      ],
    },
  ],
};
