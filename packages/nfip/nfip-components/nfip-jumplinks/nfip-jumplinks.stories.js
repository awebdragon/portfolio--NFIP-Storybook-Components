import Component from "./_nfip-jumplinks.twig";
import nfipHero from "../nfip-hero/content/nfip-hero";
import "./nfip-jumplinks.scss";

export default {
  title: "NFIP R2 Components/Jump Links",
  argTypes: {
    jumpLinks: {
      control: {
        type: "object",
      },
    },
    ...nfipHero,
  },
};

const Template = (args) => Component(args);
export const JumpLinks = Template.bind({});
JumpLinks.args = {
  jumpLinks: [
    "Why Buy Flood Insurance Lorem Impsum",
    "What’s Covered",
    "Types of Flood Insurance Lorem Ipsum",
    "Find an Insurance Provider",
    "Am I Required to Have Flood Insurance?",
  ],
};
