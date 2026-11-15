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
    bgBase: '#F7F5F2',
    bgElevated: '#FFFFFF',
    primaryPastelRed: '#D94F48',
    secondaryPastelRed: '#F28B82',
    textPrimary: '#18191C',
    textSecondary: '#3A3D45',
    textMuted: '#5C606B',
  },
  cvSummary: {
    title: 'Curriculum Vitae — Greyson Beimers',
    role: 'Software Engineer — Full-Stack Web & Practical AI Automation',
    location: 'Amsterdam & Friesland, Netherlands',
    availability:
      'Available for Friesland SME automation & full-stack engineering projects',
    coreStack: [
      'TypeScript',
      'React',
      'Node.js',
      'Python',
      'Three.js / WebGL',
      'AI & Workflow Automation',
    ],
    highlights: [
      'Builds fast, accessible TypeScript & React web applications, customer portals, and interactive Three.js / WebGL experiences.',
      'Designs practical AI and workflow automations for Dutch SMEs (MKB) with strong attention to data privacy and maintainability.',
      'Ships end-to-end production software from UI/UX and frontend architecture to CI/CD, security hardening, and performance telemetry.',
    ],
  },
} as const;

export type SiteConfig = typeof siteConfig;

