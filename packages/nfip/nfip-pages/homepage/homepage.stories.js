import Component from "./homepage.twig";
import DefaultContent from "./homepage.json";
import "./homepage.scss";
import "./homepage";

export default {
  title: "NFIP Pages/Homepage",
};

const Template = (args) => Component(args);
const TemplateOld = (args) => ComponentOld(args);

export const NFIPHomePage = Template.bind({});
NFIPHomePage.args = DefaultContent;