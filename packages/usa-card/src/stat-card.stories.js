import StatComponent from "./stat-card.twig";

import { StatContent } from "./nfip/content";

export default {
  title: "Components/Card",
};

const Template = (args) => StatComponent(args);

export const Stat = Template.bind({});
Stat.args = StatContent;

