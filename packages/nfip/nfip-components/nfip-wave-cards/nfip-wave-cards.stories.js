import Component from "./nfip-wave-cards.twig";
import CardContent from "./content/cardContent";

CardContent.cards.forEach((card) => {
  card.media.image_src += `?r=${Math.random() * 10000000000000000}`;
});

export default {
  title: "NFIP Components/Cards",
  argTypes: {
    heading_level: {
      defaultValue: "h5",
      options: ["h1", "h2", "h3", "h4", "h5", "h6"],
      control: {
        type: "select",
      },
    },
  },
};

const Template = (args) => Component(args);

export const WaveCards = Template.bind({});
WaveCards.storyName = "Wave Image";
WaveCards.args = CardContent;
