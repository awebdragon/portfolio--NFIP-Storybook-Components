import Component from "./_nfip-three-up.twig";
import DefaultContent from "./content/nfip-three-up.json";
import "./src/nfip-three-up.scss";

export default {
  title: "NFIP Components",
};

const Template = (args) => Component(args);
export const ThreeUp = Template.bind({});
ThreeUp.args = DefaultContent;
