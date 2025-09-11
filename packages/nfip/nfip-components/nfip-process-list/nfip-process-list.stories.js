import Component from "./_nfip-process-list.twig";
import { processListContent } from "./content/process-list";
import "./nfip-process-list.scss";

export default {
  title: "NFIP R2 Components/Process List",
  argTypes: {
    headingSize: {
      control: { type: "select" },
      options: ["h2", "h3", "h4", "h5", "h6"],
      name: "Custom Heading Size",
    },
  },
};

const Template = (args) => Component(args);

export const processList = Template.bind({});
processList.args = {
  headingSize: "h4",
  ...processListContent,
};

// export const processListCustomSize = Template.bind({});
// processListCustomSize.args = {
//   headingSize: "h3",

//   ...processListContent,
// };

export const processListNoText = Template.bind({});
processListNoText.args = {
  process: processListContent.process.map(({ body, ...rest }) => rest),
  headingSize: "h3",
};
