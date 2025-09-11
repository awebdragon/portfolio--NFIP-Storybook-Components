import Component from "./_nfip-breadcrumb.twig";
import DefaultContent from "./content/nfip-breadcrumb-content";
import "./styles/nfip-breadcrumb.scss";
export default {
  title: "NFIP Components/Breadcrumb",
};
const Template = (args) => Component(args);
export const Breadcrumb = Template.bind({});
Breadcrumb.args = DefaultContent;
