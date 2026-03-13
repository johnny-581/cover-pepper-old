import type { TemplateLayout } from "@pepper-apply/shared";

export const templateLayout: TemplateLayout = [
  {
    type: "row",
    blocks: [
      {
        type: "field",
        fieldId: "name",
        sizing: "hug",
        placeholder: "Full Name",
        size: "heading",
        defaultFormat: { bold: true },
      },
    ],
  },
  {
    type: "row",
    blocks: [
      {
        type: "inlinelist",
        listId: "contacts",
        sizing: "hug",
        placeholder: "Add a contact",
        size: "small",
      },
    ],
  },
  {
    type: "groupList",
    groupListId: "sections",
    layout: [
      {
        type: "row",
        blocks: [
          {
            type: "field",
            fieldId: "sectionTitle",
            sizing: "fill",
            placeholder: "Section Title",
            size: "small",
            background: "yellow",
            defaultFormat: { bold: true },
          },
        ],
      },
      {
        type: "groupList",
        groupListId: "entries",
        layout: [
          {
            type: "row",
            blocks: [
              {
                type: "field",
                fieldId: "entryTitle",
                sizing: "fill",
                placeholder: "Title",
                size: "small",
                hideable: true,
                defaultFormat: { bold: true },
              },
              {
                type: "group",
                sizing: "hug",
                blocks: [
                  {
                    type: "field",
                    fieldId: "startDate",
                    sizing: "hug",
                    placeholder: "Start",
                    size: "small",
                    background: "grey",
                    hideable: true,
                  },
                  { type: "decorator", text: " – " },
                  {
                    type: "field",
                    fieldId: "endDate",
                    sizing: "hug",
                    placeholder: "End",
                    size: "small",
                    background: "grey",
                    hideable: true,
                  },
                ],
              },
            ],
          },
          {
            type: "row",
            blocks: [
              {
                type: "group",
                sizing: "fill",
                blocks: [
                  {
                    type: "field",
                    fieldId: "entrySubtitle",
                    sizing: "hug",
                    placeholder: "Company",
                    size: "small",
                    hideable: true,
                    defaultFormat: { italic: true },
                  },
                  { type: "decorator", text: " · " },
                  {
                    type: "field",
                    fieldId: "location",
                    sizing: "fill",
                    placeholder: "Location",
                    size: "small",
                    hideable: true,
                    defaultFormat: { italic: true },
                  },
                ],
              },
            ],
          },
          {
            type: "list",
            listId: "highlights",
            sizing: "fill",
            placeholder: "Add a highlight",
            size: "small",
            hideable: true,
            defaultItemStyle: "bullet",
          },
        ],
      },
    ],
  },
];
