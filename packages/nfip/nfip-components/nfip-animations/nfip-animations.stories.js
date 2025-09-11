import LPComponent from "./nfip-animations.twig";
import BasicComponent from "./nfip-animations-basic.twig";
import SectionComponent from "./nfip-animations-section.twig";
// import GSAPTestComponent from "./nfip-animations-gsap-test.twig";

import "./src/nfip-animations";

export default {
  title: "NFIP Components/Animations",
  parameters: {
    layout: 'fullscreen',
  }
};

// export const GSAPTest = {
//   render: (args) => GSAPTestComponent(args),
// }

export const AnimationsLandingPage = {
  render: (args) => LPComponent(args),
}

export const BasicAnimations = {
  render: (args) => BasicComponent(args),
}

export const SectionAnimations = {
  render: (args) => SectionComponent(args),
}
SectionAnimations.storyName = 'Section and Parallax Animations';