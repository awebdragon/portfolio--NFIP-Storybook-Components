import Component from "./_nfip-section-bg.twig";
import "./src/nfip-section-bg.scss";
import backgroundColors from "../nfip-section/src/background-colors";

export default {
  title: "NFIP Components/Landing Pages",
  argTypes: {
    backgroundImage: {
      defaultValue: "https://picsum.photos/1650/767",
      control: {
        type: "text",
      },
    },
    containerWidth: {
      description: "Container Width",
      defaultValue: "desktop-lg",
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
    contentBackground: {
      description: "Background Color",
      options: backgroundColors.backgroundColors,
      defaultValue: "primary-dark",
      control: {
        type: "select",
      },
    },
    contentWidth: {
      description: "Content Width",
      defaultValue: "half",
      options: ["half", "full"],
      control: {
        type: "select",
      },
    },
    extraClasses: {
      control: { type: "text" },
    },
  },
};

const Template = (args) => Component(args);
export const SectionBG = Template.bind({});
SectionBG.storyName = "Landing Page Section with Background Image";
