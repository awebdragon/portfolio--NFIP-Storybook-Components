import Component from "./nfip-floodzones.twig";
import DefaultContent from "./content/nfip-floodzones.yml";
import "./nfip-floodzones.scss";

DefaultContent.nfipTabs.forEach((tab, index) => {
  tab.image += `?i=${index}`;
});

export default {
  title: "NFIP Components/Tabs",
};

const Template = (args) => Component(args);

export const FloodZones = Template.bind({});
FloodZones.args = DefaultContent;
FloodZones.storyName = "Vertical Image";
