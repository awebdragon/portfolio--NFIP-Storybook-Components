import Component from "./nfip-accordion.twig";
import DefaultContent from "./content/nfip-accordion.json"
import IconContent from "./content/nfip-icon-accordion.json"
import "./styles/nfip-accordion.scss";
import "./styles/nfip-icon-accordion.scss";

export default {
  title: "NFIP Components/Accordion",
  argTypes: {
    expand_first: {
      defaultValue: false,
      name: "Expand the first item by default",
      control: {
        type: "boolean"
      }
    },
    multiselectable: {
      defaultValue: false,
      name: "Multiselectable",
      control: {
        type: "boolean"
      }
    },
    accordions_bg_color: {
      defaultValue: "",
      name: "Accordion Titles Background Color (Overridden by individual color settings in nfipAccordions array)",
      control: {
        type: 'text',
      }
    },
    accordions_content_bg_color: {
      defaultValue: "",
      name: "Accordion Content Background Color (Overridden by individual color settings in nfipAccordions array)",
      control: {
        type: 'text',
      }
    },
    "container_id": {
      defaultValue: "",
      name: "Accordion Container ID",
      control: {
        type: 'text',
      }
    },
    "extra_classes": {
      defaultValue: "",
      name: "Accordion Container Extra Classes",
      control: {
        type: 'text',
      }
    },
    "accordions_heading_level": {
      defaultValue: "h3",
      name: "Accordion Titles Heading Level",
      options: [
        "h2",
        "h3",
        "h4",
        "h5"
      ],
      control: {
        type: 'radio',
      }
    },
  }
};

export const Default = {
  render: (args) => Component(args),
  argTypes: {
    accordion_style: {
      defaultValue: 'Default',
      table: {
        disable: true,
      }
    },
  },
}
Default.args = DefaultContent;

export const Icon = {
  render: (args) => Component(args),
  argTypes: {
    accordion_style: {
      defaultValue: 'Icon',
      table: {
        disable: true,
      }
    },
  },
}
Icon.args = IconContent;