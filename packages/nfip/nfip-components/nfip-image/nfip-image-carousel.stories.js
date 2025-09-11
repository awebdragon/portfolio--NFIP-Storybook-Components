import Component from "./nfip-image-carousel.twig";
import images from "./content/nfip-image-carousel";

export default {
  title: "NFIP Components/Carousel",
};

const Template = (args) => Component(args);

export const Image = Template.bind({});
Image.args = images;
