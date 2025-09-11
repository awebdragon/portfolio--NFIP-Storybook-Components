import Component from "./_nfip-icon-list.twig";
import icon_list from "../../../../usa-icon/src/usa-icon.json";
import "./styles/_index.scss";

// import {
//   DefaultContent,
//   CustomRichContent,
//   CustomSizeContent,
//   RichContent,
//   SimpleContent,
// } from "./content";

const DefaultContent = {
  items: [
    {
      icon: {
        name: "rain",
      },
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et ",
    },
    {
      icon: {
        name: "flooding",
      },
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco ",
    },
    {
      icon: {
        name: "attach_money",
      },
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et ",
    },
  ],
  img_path: "./img",
};

export default {
  title: "NFIP R2 Components/Icon List",
};

const Template = (args) => Component(args);

export const Default = Template.bind({});
Default.args = { ...DefaultContent, icons: icon_list.icons.items };

// export const CustomRich = Template.bind({});
// CustomRich.args = CustomRichContent;

// export const CustomSize = Template.bind({});
// CustomSize.args = CustomSizeContent;

// export const Rich = Template.bind({});
// Rich.args = RichContent;

// export const Simple = Template.bind({});
// Simple.args = SimpleContent;
