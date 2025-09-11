import Component from "./nfip-large-cta.twig";
import DefaultContent from "./content/nfip-large-cta.json";
import "./nfip-large-cta.scss";

export default {
  title: "NFIP Components/Large CTA",
};

const Template = (args) => Component(args);

export const largeCTA = Template.bind({});
largeCTA.args = DefaultContent;
