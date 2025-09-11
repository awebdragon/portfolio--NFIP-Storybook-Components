function getRandomFutureDates(numDates) {
  const today = new Date();

  // Function to generate a random number of days in the future
  function randomDaysInFuture() {
    return Math.floor(Math.random() * 365) + 1; // Random number between 1 and 365
  }

  // Generate array of future dates
  const futureDates = Array.from({ length: numDates }, () => {
    const randomDays = randomDaysInFuture();
    const randomDate = new Date(today);
    randomDate.setDate(today.getDate() + randomDays);
    return randomDate;
  });

  // Sort dates in ascending order
  futureDates.sort((a, b) => a - b);

  return futureDates;
}

const randomFutureDates = getRandomFutureDates(3);

const tags = [
  "Metro Flooding",
  "Social Post",
  "Language",
  "Region",
  "Tag 1",
  "Tag 2",
  "Tag 3",
  "Proin",
  "viverra",
  "ligula",
  "sit",
  "amet",
];

function getRandomSelection(arr) {
  // Shuffle the array using Fisher-Yates shuffle algorithm
  let shuffled = arr.slice(); // Copy the array
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Get a random number of items to select
  const randomCount = Math.floor(Math.random() * arr.length);

  // Return the random selection from the shuffled array
  return shuffled.slice(0, randomCount).map((tag) => {
    return {
      tag: tag,
      active: Math.random() > 0.5,
    };
  });
}

const randomSelection = getRandomSelection(tags);

export default {
  media_inset: false,
  cards: [
    {
      title: "Take Inventory",
      eyebrow: randomFutureDates[0].toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      subhead: "",
      container_classes: "nfip-resource-card",
      media: {
        media_classes: "",
        image_classes: "",
        image_src: `https://picsum.photos/560/560?r=${
          Math.random() * 10000000000000000
        }`,
        image_alt_text: "A placeholder image",
      },
      content: "Take photos and videos of household items and valuables.",
      tags: getRandomSelection(tags),
    },
    {
      title: "Check Paperwork",
      eyebrow: randomFutureDates[1].toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      subhead: "",
      container_classes: "nfip-resource-card",
      media: {
        media_classes: "",
        image_classes: "",
        image_src: `https://picsum.photos/560/560?r=${
          Math.random() * 10000000000000000
        }`,
        image_alt_text: "A placeholder image",
      },
      content:
        "Check your mortgage agreement for flood insurance requirements. Check your mortgage agreement for flood insurance requirements.",
      tags: getRandomSelection(tags),
    },
    {
      title: "Waterproof",
      eyebrow: randomFutureDates[2].toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      subhead: "",
      container_classes: "nfip-resource-card",
      media: {
        media_classes: "",
        image_classes: "",
        image_src: `https://picsum.photos/560/560?r=${
          Math.random() * 10000000000000000
        }`,
        image_alt_text: "A placeholder image",
      },
      content: "Waterproof your basement and elevate your utilities",
      tags: getRandomSelection(tags),
    },
  ],
};
