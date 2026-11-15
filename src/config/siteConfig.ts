export const siteConfig = {
  headerText: 'GREYSON BEIMERS',
  siteTitle: 'Greyson Beimers — Software Engineer',
  tagline:
    'Building clean, interactive web experiences and resilient software systems from the Netherlands.',
  description:
    'Greyson Beimers is a software engineer based in Amsterdam, the Netherlands (52.37°N, 4.90°E), crafting modern web applications, interactive 3D experiences, and high-performance software.',
  siteUrl: 'https://greyson.nl',
  keywords: [
    'Greyson Beimers',
    'Software Engineer',
    'Full-Stack Developer',
    'TypeScript',
    'React',
    'Three.js',
    'Web Engineering',
    'Amsterdam',
    'Netherlands',
  ],
  birthDate: '2000-05-29T00:00:00',
  role: 'software engineer',
  email: 'grey.beimers@gmail.com',
  linkedinUrl: 'https://www.linkedin.com/in/greyson-beimers-68749b1a1/',
  location: {
    label: '52.37°N, 4.90°E',
    city: 'Amsterdam',
    country: 'Netherlands',
    lat: 52.37,
    lon: 4.9,
  },
  colors: {
    bgBase: '#121316',
    bgElevated: '#1A1C22',
    primaryPastelRed: '#F28B82',
    secondaryPastelRed: '#FFAFB0',
    textPrimary: '#F5F5F7',
    textSecondary: '#D4D4D8',
    textMuted: '#9E9EA8',
  },
} as const;

export type SiteConfig = typeof siteConfig;

