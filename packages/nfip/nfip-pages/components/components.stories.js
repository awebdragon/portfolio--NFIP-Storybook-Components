import Component from "./components.twig";
import Hero from "../../nfip-components/nfip-hero/content/nfip-hero";

import Quotes from "../../nfip-components/nfip-quote/src/content/nfip-quotes";
const { quotes, options: quoteOptions } = Quotes;

import tableContent from "../../nfip-components/nfip-table/content/table-content";
import buildTable from "../../nfip-components/nfip-table/content/buildTable";

import imageCarousel from "../../nfip-components/nfip-image/content/nfip-image-carousel";

import cardContent from "../../nfip-components/nfip-wave-cards/content/cardContent";

import summaryContent from "../../nfip-components/nfip-summary-box/content/nfip-summary-box.json";

export default {
  title: "NFIP Pages/Components",
  argTypes: {
    ...Hero,
    quotes: {
      defaultValue: quotes,
      control: { type: "object" },
    },
    quoteOptions: { defaultValue: quoteOptions, control: { type: "object" } },
    table: {
      defaultValue: buildTable(tableContent),
      control: { type: "text" },
    },
    images: {
      defaultValue: imageCarousel.images,
      control: { type: "object" },
    },
    resource_classes: {
      defaultValue: cardContent.default_classes,
      control: { type: "text" },
    },
    resource_cards: {
      defaultValue: cardContent.cards,
      control: { type: "object" },
    },
  },
};

const Template = (args) => Component(args);
export const Components = Template.bind({});
Components.args = summaryContent;
