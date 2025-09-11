import Component from "./nfip-cta.twig";
import DefaultContent from "./content/nfip-cta.json";
import "./nfip-cta.scss";

export default {
  title: "NFIP Components/CTA",
  argTypes: {
    backgroundColor: {
      description: "Background Color",
      options: [
        "white",
        "black",
        "base-lightest",
        "base-lighter",
        "base-light",
        "base",
        "base-dark",
        "base-darker",
        "base-darkest",
        "primary-lighter",
        "primary-light",
        "primary",
        "primary-dark",
        "primary-darker",
        "secondary-light",
        "secondary",
        "secondary-dark",
        "secondary-darker",
        "accent-warm-lighter",
        "accent-warm-light",
        "accent-warm",
        "accent-warm-dark",
        "accent-warm-darker",
        "accent-cool-lightest",
        "accent-cool-lighter",
        "accent-cool-light",
        "accent-cool",
        "accent-cool-dark",
        "accent-cool-darker",
        "nfip-violet",
        "nfip-violet-30",
        "nfip-violet-60",
        "nfip-teal",
        "nfip-teal-30",
        "nfip-teal-60",
        "nfip-orange",
        "nfip-orange-30",
        "nfip-orange-60",
        "nfip-yellow",
        "nfip-yellow-20",
        "nfip-yellow-30",
        "nfip-yellow-60",
      ],
      defaultValue: "accent-warm-dark",
      control: {
        type: "select",
      },
    },
    extraClasses: {
      name: "Extra Classes",
      defaultValue: "",
      control: {
        type: "text",
      },
    },
  },
};

const Template = (args) => Component(args);

export const CTA = Template.bind({});
CTA.args = DefaultContent;
