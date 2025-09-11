import Component from "./_nfip-quote.twig";
import QuoteContent from "./content/nfip-quotes";
import "./nfip-profile-quote.scss";
const { quotes } = QuoteContent;

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
      defaultValue: "",
      control: {
        type: "text",
      },
    },
  },
};

const Template = (args) => Component(args);

export const TestimonialNoImage = Template.bind({});
