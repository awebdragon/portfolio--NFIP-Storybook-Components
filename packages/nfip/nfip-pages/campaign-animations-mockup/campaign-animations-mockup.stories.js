import mockupComponent from "./mockup.twig";

export default {
  title: "NFIP Pages/Animated Campaign Mockups",
};

const MockupTemplate = (args) => mockupComponent(args);

export const MockupOne = MockupTemplate.bind({});