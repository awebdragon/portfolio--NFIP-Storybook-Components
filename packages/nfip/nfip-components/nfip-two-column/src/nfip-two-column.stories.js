import Component from "./nfip-two-column.twig";
import DefaultContent from "./content/nfip-two-column.json";
import "./nfip-two-column.scss";

export default {
  title: "NFIP Components",
  argTypes: {
    columnWidth: {
      defaultValue: "desktop",
      name: "Column width",
      control: {
        type: "text"
      },
    }
  }
};

const Template = (args) => Component(args);

export const twocolumn = Template.bind({});
twocolumn.args = DefaultContent;
twocolumn.storyName = "Text and Media"