import Component from "./nfip-table.twig";
import tableContent from "./content/table-content";
import buildTable from "./content/buildTable";

import "./nfip-table.scss";

export default {
  title: "NFIP Components/Table",
  argTypes: {
    caption: {
      defaultValue: "Table Caption",
      control: { type: "text" },
    },
    hiddenCaption: {
      defaultValue: false,
      control: { type: "boolean" },
    },
    table: {
      defaultValue: buildTable(tableContent),
      control: { type: "text" },
    },
  },
};

const Template = (args) => Component(args);

export const Table = Template.bind({});
