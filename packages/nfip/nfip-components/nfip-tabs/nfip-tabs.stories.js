import Component from "./nfip-tabs.twig";
import HorizontalComponent from "./_nfip-tabs-horizontal.twig";
import HorizontalComponentFR from "./nfip-tabs-horizontal-fr.twig";
import DefaultContent from "./content/nfip-tabs.json";
import NoImageContent from "./content/nfip-tabs-noimg.json";
import HorizontalContentFR from "./content/nfip-tabs-horizontal-fr.json";
import "./nfip-tabs.scss";
import "./nfip-tabs";

DefaultContent.nfipTabs.forEach((tab, index) => {
  if (tab.image) tab.image += `?i=${index}`;
});

export default {
  title: "NFIP Components/Tabs",
  argTypes: {
    nfipTabsClasses: {
      defaultValue: "",
      name: "Extra Container Classes (nfipTabsClasses)",
      control: {
        type: "text",
      },
    },
    tabs_heading_level: {
      defaultValue: "h2",
      name: "Tab button heading levels (508: select a heading level if the button acts as a section header for the tab content)",
      options: ["none", "h2", "h3", "h4", "h5"],
      control: {
        type: "select",
      },
    },
  },
};

const Template = (args) => Component(args);

const TemplateHorizontal = (args) => HorizontalComponent(args);
export const TabsHorizontal = TemplateHorizontal.bind({});
TabsHorizontal.args = {
  nfipTabsClasses: "tabs-default",
  tabs_heading_level: "h4",
  nfipTabs: [
    {
      title: "Flood Zone FAQs",
      tabcolor: "bg-transparent",
      content: "",
      cta: [],
    },
    {
      title: "Flood Map FAQs",
      tabcolor: "bg-transparent",
      content: "",
    },
  ],
};
TabsHorizontal.storyName = "Horizontal";

export const TabsNoImg = Template.bind({});
TabsNoImg.args = NoImageContent;
TabsNoImg.storyName = "Vertical";

const TemplateFR = (args) => HorizontalComponentFR(args);
export const TabsHorizontalFR = TemplateFR.bind({});
TabsHorizontalFR.args = HorizontalContentFR;
TabsHorizontalFR.storyName = "Horizontal Flood Risk";
