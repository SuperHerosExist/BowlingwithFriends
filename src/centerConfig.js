// Bowling Center Configuration
export const BOWLING_CENTERS = [
  {
    id: '668e3aca-5106-4c24-a9c1-2bd89926ebad',
    name: 'Default Center', // Update with actual name
    url: 'https://livescore.lanetalk.com/livescoring/668e3aca-5106-4c24-a9c1-2bd89926ebad',
  },
  {
    id: '15903a3d-a2f1-48d8-ab8b-97c9476b688a',
    name: 'Enterprise Lanes',
    url: 'https://livescore.lanetalk.com/livescoring/15903a3d-a2f1-48d8-ab8b-97c9476b688a',
  },
];

export const DEFAULT_CENTER = BOWLING_CENTERS[0];

// Get URLs for a specific center
export const getCenterUrls = (centerId) => {
  const center = BOWLING_CENTERS.find(c => c.id === centerId) || DEFAULT_CENTER;
  return {
    finished: `${center.url}?tab=finished&q=&order=date&sort=asc`,
    scores: `${center.url}?tab=scores`,
    live: center.url,
  };
};

// Get center by ID
export const getCenterById = (centerId) => {
  return BOWLING_CENTERS.find(c => c.id === centerId) || DEFAULT_CENTER;
};
