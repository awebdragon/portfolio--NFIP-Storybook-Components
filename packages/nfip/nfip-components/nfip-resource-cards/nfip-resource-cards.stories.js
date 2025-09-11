import Component from "./nfip-resource-cards.twig";
import CardContent from "./content/cardContent";

export default {
  title: "NFIP R2 Components/Resource Cards",
  argTypes: {
    heading_level: {
      defaultValue: "h6",
      options: ["h1", "h2", "h3", "h4", "h5", "h6"],
      control: {
        type: "select",
      },
    },
  },
};

const Template = (args) => Component(args);

export const ResourceCards = Template.bind({});
ResourceCards.storyName = "Resource Cards Vertical";
ResourceCards.args = {
  ...CardContent,
  card__group_class: "nfip-resource-card-group",
};

export const ResourceCardsHorizontal = Template.bind({});
ResourceCardsHorizontal.storyName = "Resource Cards Horizontal";

const { media_inset, cards } = CardContent;
const twoCards = cards.map((card) => {
  return {
    ...card,
    container_classes: "nfip-resource-card nfip-resource-card-horizontal",
  };
});
twoCards.pop();
setTimeout(() => {
  console.log(twoCards);
}, 250);

ResourceCardsHorizontal.args = {
  media_inset: media_inset,
  cards: twoCards,
  card__group_class: "nfip-resource-card-group-horizontal",
};
