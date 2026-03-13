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
            { id: "entrySubtitle" },
            { id: "startDate" },
            { id: "endDate" },
            { id: "location" },
          ],
          lists: [{ id: "highlights" }],
          inlineLists: [],
          groupLists: [],
        },
      ],
    },
  ],
};
