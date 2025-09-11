import Component from "./nfip-footer.twig";
import ComponentStatic from "./nfip-footer-static.twig";
import "./nfip-footer.scss";

export default {
  title: "NFIP Components/Footer",
};
const Template = (args) => Component(args);
export const NFIPFooter = Template.bind({});

const TemplateStatic = (args) => ComponentStatic(args);
export const NFIPFooterStatic = TemplateStatic.bind({});
