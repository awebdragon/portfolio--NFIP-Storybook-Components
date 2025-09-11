import Component from "./nfip-homepage-hero.twig";
import DefaultContent from "./content/nfip-homepage-hero.json";

import "./nfip-homepage-hero.scss";

export default {
  title: "NFIP Components/Hero/Homepage Hero",
};

const Template = (args) => Component(args);

export const HomepageHero = Template.bind({});
HomepageHero.args = DefaultContent;
