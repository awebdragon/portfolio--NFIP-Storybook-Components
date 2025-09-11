import "../packages/uswds-core/src/js/start";

import ExtendedContent from "./nav/header.json";
import navSecondaryContent from "./nav/nav_secondary.json";
import Footer from "./nav/footer.json";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  options: {
    storySort: {
      order: [
        "NFIP Design Tokens",
        "NFIP R2 Components",
        "NFIP Components",
        "NFIP Pages",
        "Design Tokens",
        "Components",
        "Patterns",
        "Pages",
      ],
    },
  },
  layout: 'fullscreen',
};

export const args = {
  ...ExtendedContent,
  ...navSecondaryContent,
  ...Footer,
  search: true,
};

const globalArgs = {};
Object.entries(args).forEach((arg) => {
  globalArgs[arg[0]] = { table: { disable: true } };
});

export const argTypes = { ...globalArgs };
