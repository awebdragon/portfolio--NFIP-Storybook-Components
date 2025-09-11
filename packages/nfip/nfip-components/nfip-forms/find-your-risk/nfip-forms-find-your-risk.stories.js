import Component from "./_nfip-forms-find-your-risk.twig";
import "./src/find-your-risk.scss";

export default {
  title: "NFIP Components/Forms",
  argTypes: {
    form_placeholder: {
      name: "Placeholder Text",
      defaultValue: "Enter your zip code",
      control: {
        type: "text",
      },
    },
    form_button_text: {
      name: "Button Text",
      defaultValue: "Discover Your Risk",
      control: {
        type: "text",
      },
    },
  },
};

const Template = (args) => Component(args);
export const RiskLevel = Template.bind({});
