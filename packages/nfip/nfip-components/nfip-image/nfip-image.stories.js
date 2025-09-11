import Component from "./_nfip-image.twig";

export default {
  title: "NFIP Components/Image",
  argTypes: {
    image: {
      name: "Image",
      defaultValue: `https://picsum.photos/960/422?r=${
        Math.random() * 100000000000000000
      }`,
      control: {
        type: "text",
      },
    },
    image_alt: {
      name: "Image Alt",
      defaultValue: "A beautiful photo",
      control: {
        type: "text",
      },
    },
    caption: {
      name: "Caption",
      defaultValue:
        "Image caption ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud.",
      control: {
        type: "text",
      },
    },
  },
};

const Template = (args) => Component(args);

export const Image = Template.bind({});
