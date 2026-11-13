import bedfordRoad from './assets/roadwalks.png'
import bridgePhoto from './assets/bridge_photo_64.png'
import bridgeBlueprint from './assets/bridge_blueprint_64.jpeg'
import bridgeSketch from './assets/bridge_sketch_64.png'
import bedfordIllustration from './assets/bedford-home.jpg'

/**
 * Editorial starter content for the Community page.
 * These are curated, attributed links, not an automatically refreshed news feed.
 * Review details periodically and add verified articles here.
 */
export const communityCategories = ['All updates', 'Around Bedford', 'Student life', 'Engineering', 'Opportunities'] as const
export type CommunityCategory = (typeof communityCategories)[number]
export type StoryCategory = Exclude<CommunityCategory, 'All updates'>
export type CommunityStory = {
  id: string
  category: StoryCategory
  eyebrow: string
  title: string
  summary: string
  date: string
  image: string
  imageAlt: string
  source: string
  href: string
  internal?: boolean
}

export const communityFeature: CommunityStory = {
  id: 'great-road-2026',
  category: 'Around Bedford',
  eyebrow: 'LOCAL INFRASTRUCTURE',
  title: 'What’s changing on Great Road?',
  summary: 'New signals, crosswalk markings, and improvements to walking and cycling connections: a closer look at Bedford’s road project and the everyday engineering behind it.',
  date: 'NOVEMBER 2026',
  image: bedfordRoad,
  imageAlt: 'Illustration of road infrastructure, not a photograph of the construction site',
  source: 'Town of Bedford',
  href: 'https://www.bedfordma.gov/1033/Great-Road-Improvement-Project',
}

export const communityStories: CommunityStory[] = [
  {
    id: 'club-collaboration',
    category: 'Student life',
    eyebrow: 'CLUB COLLABORATIONS',
    title: 'Ideas grow stronger together',
    summary: 'What could BBB create with art, history, environmental, and STEM clubs? Explore the projects that could start a conversation.',
    date: 'FROM BBB',
    image: bridgePhoto,
    imageAlt: 'Bridge structure illustrating the club’s hands-on engineering focus',
    source: 'Explore club projects',
    href: 'projects',
    internal: true,
  },
  {
    id: 'asce-bridge-learning',
    category: 'Engineering',
    eyebrow: 'ENGINEERING WORLD',
    title: 'Inside tomorrow’s bridges',
    summary: 'What makes a bridge work? Explore structural thinking and resources for students curious about civil engineering.',
    date: 'LEARNING',
    image: bridgeBlueprint,
    imageAlt: 'Blueprint-style structural bridge drawing',
    source: 'ASCE',
    href: 'https://www.asce.org/career-growth/pre-college-outreach',
  },
  {
    id: 'msef-2027',
    category: 'Opportunities',
    eyebrow: 'STUDENT OPPORTUNITIES',
    title: 'Put an engineering idea to the test',
    summary: 'The 2027 Massachusetts Science & Engineering Fair offers students a chance to share original research and engineering work.',
    date: 'APRIL 8, 2027',
    image: bridgeSketch,
    imageAlt: 'Conceptual sketch of a bridge design',
    source: 'Massachusetts Science & Engineering Fair',
    href: 'https://scifair.com/hsstatefair/',
  },
  {
    id: 'town-hall-access',
    category: 'Around Bedford',
    eyebrow: 'ACCESSIBLE DESIGN',
    title: 'Rethinking the Town Hall entrance',
    summary: 'Bedford’s entrance renovation shows how accessibility requirements shape the design of public spaces and everyday access.',
    date: 'OCTOBER 2026',
    image: bedfordIllustration,
    imageAlt: 'Illustrative Bedford community image, not a photo of Town Hall renovation',
    source: 'Town of Bedford',
    href: 'https://bedfordma.gov/m/newsflash/Home/Detail/796',
  },
  {
    id: 'school-play-2026',
    category: 'Student life',
    eyebrow: 'STUDENT SPOTLIGHT',
    title: 'The people behind Radium Girls',
    summary: 'BHS students are bringing history to the stage. Performances bring their own challenges in lighting, acoustics, and accessible public spaces.',
    date: 'NOVEMBER 13–14, 2026',
    image: bridgeSketch,
    imageAlt: 'Engineering sketch used as a thematic illustration, not an image of the play',
    source: 'The Bedford Citizen',
    href: 'https://thebedfordcitizen.org/2026/11/bedford-high-school-students-share-radium-girls-experience/',
  },
  {
    id: 'asce-outreach',
    category: 'Opportunities',
    eyebrow: 'MEET AN ENGINEER',
    title: 'Discover the people behind the projects',
    summary: 'ASCE has pre-college resources and information about connecting students with real civil engineers.',
    date: 'CAREER EXPLORATION',
    image: bridgePhoto,
    imageAlt: 'Close-up of bridge structure representing civil engineering careers',
    source: 'ASCE pre-college outreach',
    href: 'https://www.asce.org/career-growth/pre-college-outreach',
  },
]

export type CommunityEvent = {
  id: string
  title: string
  detail: string
  startDate: string
  lastDate: string
  dateLabel: string
  href: string
  source: string
}

/** Dates deliberately have expiry rules so past events don't remain "upcoming". */
export const communityEvents: CommunityEvent[] = [
  {
    id: 'radium-girls',
    title: 'BHS fall play',
    detail: 'Radium Girls · Bedford High School',
    startDate: '2026-11-13',
    lastDate: '2026-11-14',
    dateLabel: 'NOV\n13–14',
    href: 'https://thebedfordcitizen.org/2026/10/guest-column-bedford-high-school-presents-radium-girls-nov-13-and-14/',
    source: 'The Bedford Citizen',
  },
  {
    id: 'sat-december',
    title: 'December SAT',
    detail: 'A busy weekend for student schedules',
    startDate: '2026-12-05',
    lastDate: '2026-12-05',
    dateLabel: 'DEC\n05',
    href: 'https://satsuite.collegeboard.org/sat/dates-deadlines',
    source: 'College Board',
  },
  {
    id: 'msef-april',
    title: 'MSEF High School State Fair',
    detail: 'Student research · Worcester, MA',
    startDate: '2027-04-08',
    lastDate: '2027-04-08',
    dateLabel: 'APR\n08',
    href: 'https://scifair.com/hsstatefair/',
    source: 'Massachusetts Science & Engineering Fair',
  },
]
