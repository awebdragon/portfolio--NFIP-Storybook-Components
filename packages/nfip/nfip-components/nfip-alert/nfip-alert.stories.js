import Component from "./nfip-alert.twig";
import "./styles/nfip-alert.scss";

export default {
  title: "NFIP Components/Alert",
  argTypes: {
    slim: {
      defaultValue: false,
      name: "Slim Alert (Removes Heading)",
      control: {
        type: 'boolean',
      }
    },
    alert_style: {
      defaultValue: "info",
      name: "Alert Style",
      options: [
        "info",
        "warning",
        "success",
        "error",
        "emergency"
      ],
      control: {
        type: 'radio',
      }
    },
    heading_text: {
      defaultValue: "Alert Heading",
      name: "Heading Text",
      control: {
        type: 'text',
      }
    },
    body_text: {
      defaultValue: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.",
      name: "Body Text",
      control: {
        type: 'text',
      }
    }
  }
}

export const Alert = {
  render: (args) => Component(args),
}