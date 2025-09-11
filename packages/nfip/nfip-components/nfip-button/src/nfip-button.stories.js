import Component from "./nfip-button.twig";

export default {
  title: "NFIP Components/Button",
  argTypes: {
    button_id: {
      defaultValue: "",
      name: "Button ID",
      control: {
        type: "text",
      },
    },
    button_text: {
      defaultValue: "Learn More",
      name: "Button Text",
      control: {
        type: "text",
      },
    },
    button_markup: {
      defaultValue: "link",
      name: "Button Markup",
      options: ["link", "button"],
      control: {
        type: "radio",
      },
    },
    button_url: {
      defaultValue: "#",
      name: "Button URL or Function",
      control: {
        type: "text",
      },
    },
    button_target: {
      defaultValue: "_self",
      name: "Button Target",
      control: {
        type: "text",
      },
    },
    button_aria_label: {
      defaultValue: "",
      name: "Aria Label",
      control: {
        type: "text",
      },
    },
    button_extra_classes: {
      defaultValue: "",
      name: "Extra Classes",
      control: {
        type: "text",
      },
    },
    button_alignment: {
      defaultValue: "left",
      name: "Alignment",
      options: ["left", "center", "right"],
      control: {
        type: "radio",
      },
    },
  },
};

export const Default = {
  render: (args) => Component(args),
  argTypes: {
    button_type: {
      defaultValue: "default",
      table: {
        disable: true,
      },
    },
  },
};

// export const AccentCoolLighter = {
//   render: (args) => Component(args),
//   argTypes: {
//     button_type: {
//       defaultValue: 'accentCoolLighter',
//       table: {
//         disable: true,
//       }
//     },
//   },
// }

export const Outline = {
  render: (args) => Component(args),
  argTypes: {
    button_type: {
      defaultValue: "outline",
      table: {
        disable: true,
      },
    },
  },
};

export const Arrow = {
  render: (args) => Component(args),
  argTypes: {
    button_type: {
      defaultValue: "arrow",
      table: {
        disable: true,
      },
    },
    button_width: {
      defaultValue: "normal",
      name: "Button Width",
      options: ["normal", "full-width"],
      control: {
        type: "radio",
      },
    },
    button_icon: {
      defaultValue: "arrow_forward",
      name: "SVG Icon",
      control: {
        type: "text",
      },
    },
  },
};
