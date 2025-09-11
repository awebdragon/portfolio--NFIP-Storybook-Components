import Component from "./_nfip-hero.twig";
import Content from "./content/nfip-hero";

import "./styles/nfip-hero.scss";

export default {
  title: "NFIP Components/Hero/Interior Hero",
  argTypes: { ...Content },
};
const Template = (args) => Component(args);
export const InteriorHero = Template.bind({});
