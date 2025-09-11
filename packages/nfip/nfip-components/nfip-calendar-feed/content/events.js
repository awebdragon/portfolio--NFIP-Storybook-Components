const generateDateWithinDays = (x, h) => {
  const today = new Date();
  const targetDate = new Date(today);

  // Add x days to the current date
  targetDate.setDate(today.getDate() + x);
  targetDate.setHours(h, 0, 0);

  return targetDate;
};

const generateEvent = (event) => {
  const daysAhead = Math.round(Math.random() * 183);
  const numDays = Math.round(Math.random() * 10) - 4;

  const startTime = Math.round(Math.random() * 16) + 6;
  const hours = Math.round(Math.random() * 14) - 6;

  const endTime = startTime + (hours > 0 ? hours : 0);

  return {
    ...event,
    startDate: generateDateWithinDays(daysAhead, startTime),
    endDate: generateDateWithinDays(
      daysAhead + (numDays > 0 ? numDays : 0),
      endTime
    ),
    endTime: hours,
  };
};

const eventList = [
  {
    headline: "Webinar: Understanding Your Flood Risk",
    teaser:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore...",
    type: "Virtual",
  },
  {
    headline: "National Flood Conference | Washington, D.C.",
    type: "In-Person",
  },
  {
    headline: "Two-part Key Fundamentals of Flood Insurance Webinar",
    type: "Virtual",
  },
  {
    headline:
      "Managing Floodplain Development through the NFIP (3-day in person event)",
    type: "In-Person",
  },
  {
    headline: "Preparing for Natural Disasters",
    teaser:
      "Emergencies and disasters can strike quickly and without warning and can force you to evacuate your neighborhood...",
    type: "Virtual",
  },
  {
    headline: "Two-part Key Fundamentals of Flood Insurance Webinar",
    type: "Virtual",
  },
];

export const events = Array.from(eventList, generateEvent).sort(
  (a, b) => a.startDate - b.startDate
);
