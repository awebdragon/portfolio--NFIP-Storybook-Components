import Component from "./nfip-uswds.twig";
import Content from "./nfip-uswds.json";

export default {
  title: "NFIP Design Tokens/USWDS Utility Classes",
};

const Template = (args) => Component(args);

export const USWDSUtilityClasses = Template.bind({});
USWDSUtilityClasses.args = Content;
