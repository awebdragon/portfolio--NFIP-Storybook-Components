import Component from "./nfip-colors.twig";
import Content from "./nfip-colors.json";

export default {
  title: "NFIP Design Tokens/Colors",
  argTypes: {
    dhs_colors: {
      table: { disable: true },
    },
    nfip_colors: {
      table: { disable: true },
    },
  },
};

const Template = (args) => Component(args);

export const Colors = Template.bind({});
Colors.args = Content;
