import Component from "./_nfip-section.twig";
import "./nfip-section.scss";
import backgroundColors from "./src/background-colors";

setTimeout(() => {
  console.log(backgroundColors);
}, 200);

const padding = [0, "05", 1, 2, 4, 6, 8, 9, 10, 15];
const paddingLabels = {
  0: "0 - None",
  "05": "05 - 3XS",
  1: "1 - 2XS",
  2: "2 - Extra Small",
  4: "4 - Small",
  6: "6 - Medium",
  8: "8 - Large",
  9: "9 - XLarge",
  10: "10 - 2XL",
  15: "15 - 3XL",
};

export default {
  title: "NFIP Components",
  argTypes: {
    backgroundColor: {
      name: "Background Color",
      options: backgroundColors.backgroundColors,
      defaultValue: "white",
      control: {
        type: "select",
      },
    },
    paddingTop: {
      name: "Padding Top",
      defaultValue: 8,
      options: padding,
      control: {
        type: "select",
        labels: paddingLabels,
      },
    },
    paddingBottom: {
      name: "Padding Bottom",
      defaultValue: 8,
      options: padding,
      control: {
        type: "select",
        labels: paddingLabels,
      },
    },
    containerWidth: {
      name: "Container Width",
      defaultValue: "desktop",
      options: [
        "mobile ",
        "mobile-lg",
        "tablet",
        "tablet-lg",
        "desktop",
        "desktop-lg",
        "widescreen",
        "full",
      ],
      control: {
        type: "select",
      },
    },
  },
};

const Template = (args) => Component(args);
export const Section = Template.bind({});
Section.storyName = "Content Container"