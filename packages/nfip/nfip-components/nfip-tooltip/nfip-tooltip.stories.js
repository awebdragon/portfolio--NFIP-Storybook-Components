import Component from "./_nfip-tooltip.twig";
import ComponentModal from "./_nfip-tooltip-modal.twig";
import "./nfip-tooltip.scss";

export default {
  title: "NFIP R2 Components/Tooltip",
};

const Template = (args) => Component(args);
export const NFIPTooltip = Template.bind({});

const TemplateModal = (args) => ComponentModal(args);
export const NFIPTooltipModal = TemplateModal.bind({});
NFIPTooltipModal.args = {
  modalHeading: "Overlay Modal for Tooltip",
  modalBody: `
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. <a href="#">Duis aute irure dolor</a> in reprehenderit in voluptate velit esse cillum dolore eu.</p>
  `,
  actions: [
    {
      type: "default",
      action: "chicken",
      text: "Call to action",
      button_url: "#",
    },
  ],
};
