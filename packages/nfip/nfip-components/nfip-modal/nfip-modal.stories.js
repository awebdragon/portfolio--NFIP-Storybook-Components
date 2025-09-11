import Component from "./_nfip-modal.twig";
import "./nfip-modal.scss";
// import nfipHero from "../nfip-hero/content/nfip-hero";

export default {
  title: "NFIP R2 Components/Modal",
};

const Template = (args) => Component(args);
export const Modal = Template.bind({});
Modal.args = {
  triggerText: "Launch Modal",
  modalHeading: "Lorem ipsum dolor sit amet consectetur",
};
