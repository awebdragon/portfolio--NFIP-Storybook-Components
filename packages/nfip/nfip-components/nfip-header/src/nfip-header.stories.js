import Component from "./nfip-header.twig";
import DefaultContent from "./content/nfip-header.json";

import "./nfip-header.scss";

export default {
  title: "NFIP Components/ Header",
};

const Template = (args) => Component(args);

export const content = Template.bind({});
content.args = DefaultContent;