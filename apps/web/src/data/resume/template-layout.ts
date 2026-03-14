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
                sizing: "hug",
                placeholder: "Title",
                size: "small",
                hideable: true,
              },
              {
                type: "group",
                sizing: "fill",
                blocks: [
                  {
                    type: "decorator",
                    text: "@",
                  },
                  {
                    type: "field",
                    fieldId: "location",
                    sizing: "hug",
                    placeholder: "Location",
                    size: "small",
                    hideable: true,
                  },
                ],
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
                    hideable: true,
                  },
                  { type: "decorator", text: " – " },
                  {
                    type: "field",
                    fieldId: "endDate",
                    sizing: "hug",
                    placeholder: "End",
                    size: "small",
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
                type: "field",
                fieldId: "entrySubtitle",
                sizing: "fill",
                placeholder: "Company",
                size: "small",
                hideable: true,
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
