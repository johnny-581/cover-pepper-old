import type { TemplateLayout } from "@pepper-apply/shared";

export const templateLayout: TemplateLayout = [
  {
    type: "row",
    blocks: [
      {
        type: "field",
        fieldId: "name",
        sizing: "fill",
        placeholder: "Full Name",
        style: { font: "sans-sm", background: "none" },
        outputStyle: { bold: true, italic: false, underline: false },
      },
    ],
  },
  {
    type: "row",
    blocks: [
      {
        type: "list",
        listId: "contacts",
        sizing: "fill",
        placeholder: "Add a contact",
        display: "plain",
        itemStyle: {
          font: "sans-sm",
          outputStyle: { bold: false, italic: false, underline: false },
        },
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
            style: { font: "sans-sm", background: "yellow" },
            outputStyle: { bold: true, italic: false, underline: false },
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
                style: { font: "sans-sm", background: "none" },
                outputStyle: { bold: true, italic: false, underline: false },
              },
              {
                type: "field",
                fieldId: "startDate",
                sizing: "hug",
                placeholder: "Start",
                style: { font: "sans-sm", background: "grey" },
                outputStyle: { bold: false, italic: true, underline: false },
              },
              { type: "decorator", text: " – " },
              {
                type: "field",
                fieldId: "endDate",
                sizing: "hug",
                placeholder: "End",
                style: { font: "sans-sm", background: "grey" },
                outputStyle: { bold: false, italic: true, underline: false },
              },
            ],
          },
          {
            type: "row",
            blocks: [
              {
                type: "field",
                fieldId: "subtitle",
                sizing: "hug",
                placeholder: "Company",
                style: { font: "sans-sm", background: "none" },
                outputStyle: {
                  bold: false,
                  italic: false,
                  underline: false,
                },
              },
              { type: "decorator", text: " · " },
              {
                type: "field",
                fieldId: "location",
                sizing: "fill",
                placeholder: "Location",
                style: { font: "sans-sm", background: "none" },
                outputStyle: { bold: false, italic: true, underline: false },
              },
            ],
          },
          {
            type: "row",
            blocks: [
              {
                type: "list",
                listId: "tags",
                sizing: "fill",
                placeholder: "Add a tag",
                display: "plain",
                itemStyle: {
                  font: "sans-sm",
                  outputStyle: {
                    bold: false,
                    italic: false,
                    underline: false,
                  },
                },
              },
            ],
          },
          {
            type: "list",
            listId: "highlights",
            sizing: "fill",
            placeholder: "Add a highlight",
            display: "plain",
            itemStyle: {
              font: "sans-sm",
              outputStyle: {
                bold: false,
                italic: false,
                underline: false,
              },
            },
          },
        ],
      },
    ],
  },
];
