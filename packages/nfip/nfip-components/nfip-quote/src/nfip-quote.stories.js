import Component from "./_nfip-quote.twig";
import QuoteContent from "./content/nfip-quotes";
const { quotes } = QuoteContent;
// import "./nfip-quote.scss";

export default {
  title: "NFIP Components/Testimonial",
  argTypes: {
    quote: {
      defaultValue: quotes[0].quote,
      control: {
        type: "text",
      },
    },
    name: {
      defaultValue: quotes[0].name,
      control: {
        type: "text",
      },
    },
    quote_title: {
      defaultValue: quotes[0].quote_title,
      control: {
        type: "text",
      },
    },
    image: {
      defaultValue: `${quotes[0].image}?r=${Math.random() * 10000000000000000}`,
      control: {
        type: "text",
      },
    },
    image_alt: {
      defaultValue: "",
      control: { type: "text" },
    },
  },
};

const Template = (args) => Component(args);

export const Testimonial = Template.bind({});
