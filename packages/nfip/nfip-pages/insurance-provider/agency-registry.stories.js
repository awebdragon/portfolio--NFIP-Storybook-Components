import Component from "./agency-registry.twig";
import "./src/scss/agency-registry.scss";
import "./src/js/agency-registry";

export default {
  title: "NFIP Pages/Insurace Provider",
};

const Template = (args) => Component(args);

export const InsuranceProvider = Template.bind({});