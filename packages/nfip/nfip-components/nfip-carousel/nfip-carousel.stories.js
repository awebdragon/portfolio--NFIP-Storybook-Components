import Component from "./_nfip-carousel.twig";
import quoteComponent from "./nfip-quote-carousel.twig";
// import quoteContent from "./content/nfip-quote-carousel.json";
import quoteContent from "../nfip-quote/src/content/nfip-quotes";

import "./nfip-carousel";
import "./nfip-carousel.scss";

export default {
  title: "NFIP Components/Carousel",
};

const Template = (args) => Component(args);

export const Default = Template.bind({});
// Default.args = DefaultContent;

quoteContent.quotes.forEach((quote) => {
  quote.image = `${quote.image}?r=${Math.random() * Math.pow(10, 17)}`;
});

const quoteTemplate = (args) => quoteComponent(args);
export const testimonial = quoteComponent.bind({});
testimonial.args = {};
testimonial.args.show_nav = quoteContent.options.show_nav;
testimonial.args.nav_position = quoteContent.options.nav_position;
testimonial.args.quotes = quoteContent.quotes;
