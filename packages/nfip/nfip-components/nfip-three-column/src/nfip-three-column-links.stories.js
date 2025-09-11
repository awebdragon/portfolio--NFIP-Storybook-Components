import Component from "./nfip-three-column-links.twig";
import LinkContent from "./content/nfip-three-column~links.json";
import "./nfip-three-column.scss";

export default {
  title: "NFIP Components/ 3 columns",
};

const Template = (args) => Component(args);

export const links = Template.bind({});
links.args = LinkContent;
links.storyName = "Arrow Links"