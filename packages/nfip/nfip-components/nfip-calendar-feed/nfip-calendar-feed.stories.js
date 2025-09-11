import Component from "./_nfip-calendar-feed.twig";
import { events } from "./content/events";
import "./nfip-calendar-feed.scss";

console.log(events);

export default {
  title: "NFIP R2 Components/Calendar Feed",
};

const Template = (args) => Component(args);

export const calendarFeed = Template.bind({});
calendarFeed.args = { events: events };
