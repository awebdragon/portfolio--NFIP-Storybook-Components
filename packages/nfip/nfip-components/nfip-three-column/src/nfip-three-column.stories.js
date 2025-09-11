import Component from "./nfip-three-column.twig";
import DefaultContent from "./content/nfip-three-column.json";
import "./nfip-three-column.scss";

export default {
  title: "NFIP Components/ 3 columns",
};

const Template = (args) => Component(args);

export const threecolumn = Template.bind({});
threecolumn.args = DefaultContent;
