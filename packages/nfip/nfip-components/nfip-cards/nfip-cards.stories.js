import Component from "./_nfip-cards.twig";

import DefaultContent from "./content/nfip-cards.json";
import MediaContent from "./content/nfip-cards-media.json";
import StatContent from "./content/nfip-cards-stat.json";
import MoreInfoContent from "./content/nfip-cards-more-info.json";
import "./src/nfip-cards.scss";

export default {
  title: "NFIP Components/Cards",
  argTypes: {
    heading_level:{
      defaultValue: "h5",
      name: "Cards Heading Level (508: only choose None if the title isn't acting like a section heading)",
      options: [
        "h2",
        "h3",
        "h4",
        "h5",
        "none"
      ],
      control: "select",
    },
    column_class: {
      defaultValue: "tablet:grid-col",
      name: "Card Column Classes",
      control: "text",
    },
  },
};

const Template = (args) => Component(args);

export const Default = Template.bind({});
Default.args = DefaultContent;

// export const Media = Template.bind({});
// Media.args = MediaContent;

export const Statistics = Template.bind({});
Statistics.args = StatContent;
Statistics.argTypes = {
  card_style: {
    defaultValue: "stats",
    table: {
      disable: true,
    },
  },
  heading_level:{
    defaultValue: "h2",
  },
  card__group_class:{
    defaultValue: "flsm-stat-cards"
  }
};

export const MoreInfo = Template.bind({});
MoreInfo.storyName = "Arrow";
MoreInfo.args = MoreInfoContent;
MoreInfo.argTypes = {
  card_style: {
    defaultValue: "more-info",
    table: {
      disable: true,
    },
  },
};
