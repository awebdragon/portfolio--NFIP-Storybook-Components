import Component from "./_nfip-summary-box.twig";
import "./styles/_nfip-summary-box.scss";
import componentContent from "../content/nfip-summary-box.json";

console.log(componentContent);

export default {
  title: "NFIP R2 Components/Summary Box",
  argTypes: {
    summary_tag: {
      control: { type: "text" },
    },
    summary_headline: {
      control: { type: "text" },
    },
    summary_body: {
      control: { type: "text" },
    },
    summary_cta: {
      control: { type: "object" },
    },
  },
};

const Template = (args) => Component(args);

export const SummaryBox = Template.bind({});
SummaryBox.args = componentContent;
