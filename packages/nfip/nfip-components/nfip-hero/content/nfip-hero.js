import Breadcrumbs from "../../nfip-breadcrumb/src/content/nfip-breadcrumb-content";
import backgroundColors from "../../nfip-section/src/background-colors";

export default {
  hero_title: {
    name: "Hero Title",
    defaultValue: "Headline Here",
    control: {
      type: "text",
    },
  },
  description: {
    name: "Description",
    defaultValue: `
      <p>Lorem ipsum dolor sit amet consectetur. Id sit tempus hac dolor massa in sit nibh sed. Consectetur purus lorem velit at enim pellentesque. Hendrerit arcu eros eu interdum. In tellus.</p>
    `,
    control: {
      type: "text",
    },
  },
  hero_image: {
    name: "Image",
    defaultValue: `https://picsum.photos/480/380?r=${
      Math.random() * 10000000000000000
    }`,
    control: {
      type: "text",
    },
  },
  hero_image_alt: {
    name: "Hero Image Alt",
    defaultValue: "An image that represents the content of the page",
    control: { type: "text" },
  },
  backgroundColor: {
    name: "Background Color",
    options: backgroundColors.backgroundColors,
    defaultValue: "primary-darker",
    control: {
      type: "select",
    },
  },
  breadcrumbs: {
    name: "Breadcrumbs",
    defaultValue: Breadcrumbs.breadcrumbs,
    control: {
      type: "object",
    },
  },
  aria_label: {
    name: "Breadcrumbs Aria Label",
    defaultValue: Breadcrumbs.aria_label,
    control: {
      type: "text",
    },
  },
  bc_modifier: {
    name: "Breadcrumbs Modifier",
    defaultValue: Breadcrumbs.modifier,
    control: {
      type: "text",
    },
  },
};
