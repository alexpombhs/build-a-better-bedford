/**
 * BBB Community is a curated index of ORIGINAL publisher links, not BBB-written
 * news articles. Prefer the publisher's exact headline and dated source URL.
 * Do not imply that this static list updates in real time.
 * Town notices checked against bedfordma.gov on November 13, 2026.
 */
export type CommunityStory = {
  id: string
  label: string
  publishedAt?: string // YYYY-MM-DD: only an actual publication/update date
  date?: string // Optional event or admission date, never labeled "published"
  title: string
  summary: string // A one-sentence factual excerpt/description
  source: string
  href: string // Direct link to the publisher's original announcement/resource
}

export type CommunitySection = {
  id: 'bedford' | 'industry' | 'universities'
  title: string
  description: string
  topics: string
  stories: CommunityStory[]
  directoryLabel: string
  directoryHref: string
}

export const communitySections: CommunitySection[] = [
  {
    id: 'bedford',
    title: 'Bedford News',
    description: 'School events, community happenings, construction and town projects worth knowing about.',
    topics: 'SCHOOLS · EVENTS · CONSTRUCTION · HOLIDAYS',
    directoryLabel: 'More local news from The Bedford Citizen',
    directoryHref: 'https://thebedfordcitizen.org/latest/',
    stories: [
      {
        id: 'bedford-weekend-calendar',
        label: 'AROUND TOWN',
        publishedAt: '2026-11-12',
        title: 'What’s on the Calendar? — Bedford Events Through Nov. 14',
        summary: 'This weekend’s lineup includes the BHS play and a Scandinavian Christmas Fair.',
        source: 'The Bedford Citizen · Community',
        href: 'https://thebedfordcitizen.org/2026/11/whats-on-the-calendar-bedford-events-through-nov-14/',
      },
      {
        id: 'bhs-radium-girls',
        label: 'BEDFORD HIGH SCHOOL',
        publishedAt: '2026-11-09',
        title: 'Bedford High School Students Share ‘Radium Girls’ Experience',
        summary: 'Students share their experiences putting on the play, with performances Nov. 13 and 14.',
        source: 'The Bedford Citizen · Schools',
        href: 'https://thebedfordcitizen.org/2026/11/bedford-high-school-students-share-radium-girls-experience/',
      },
      {
        id: 'jgms-roof',
        label: 'MIDDLE SCHOOL · CONSTRUCTION',
        publishedAt: '2026-11-06',
        title: 'Facilities, School District Capital Requests Include Technology, JGMS Roof Restoration',
        summary: 'Bedford officials are considering funding for roof restoration and other school building improvements.',
        source: 'The Bedford Citizen · Schools',
        href: 'https://thebedfordcitizen.org/2026/11/facilities-school-district-capital-requests-include-technology-jgms-roof-restoration/',
      },
      {
        id: 'great-road',
        label: 'ROADS & CROSSWALKS',
        publishedAt: '2026-11-02',
        title: 'Great Road Improvement Project',
        summary: 'The town reports remaining road striping, rail-trail work and new traffic signal installation.',
        source: 'Town of Bedford · Public Works',
        href: 'https://www.bedfordma.gov/1033/Great-Road-Improvement-Project',
      },
      {
        id: 'bedford-heat-pump',
        label: 'COMMUNITY EVENT · ENERGY',
        publishedAt: '2026-10-14',
        title: "RSVP for Bedford’s Heat Pump Pizza Party!",
        summary: 'The town announced a Nov. 17 event at BHS about heat pumps and home heating technology.',
        source: 'Town of Bedford · Planning',
        href: 'https://bedfordma.gov/m/newsflash/home/detail/818',
      },
      {
        id: 'springs-water',
        label: 'CONSTRUCTION · UTILITIES',
        publishedAt: '2026-10-05',
        title: 'NOTICE OF WATER MAIN REPLACEMENT PROJECT',
        summary: 'Water-main work on Springs Road affects the area near Middlesex Community College.',
        source: 'Town of Bedford · Public Works',
        href: 'https://www.bedfordma.gov/m/NewsFlash/Home/Detail/809',
      },
      {
        id: 'town-hall-ada',
        label: 'TOWN PROJECT',
        publishedAt: '2026-09-15',
        title: 'Town Hall Front Entrance ADA Improvements',
        summary: 'The front entrance reconstruction affects how visitors and public meetings access Town Hall.',
        source: 'Town of Bedford · Latest News',
        href: 'https://www.bedfordma.gov/m/newsflash/home/detail/796',
      },
    ],
  },
  {
    id: 'industry',
    title: 'Engineering Industry',
    description: 'Direct links to professional societies, conferences and technical events.',
    topics: 'CONFERENCES · TRADE SHOWS · TECHNICAL EVENTS',
    directoryLabel: 'Browse ASCE events and conferences',
    directoryHref: 'https://www.asce.org/education-and-events',
    stories: [
      {
        id: 'asce2027',
        label: 'CONFERENCE',
        date: 'MAR 1–5, 2027',
        title: 'ASCE2027',
        summary: 'Conference information and event program from the American Society of Civil Engineers.',
        source: 'American Society of Civil Engineers',
        href: 'https://www.asce.org/education-and-events/events/meetings/asce2027',
      },
      {
        id: 'structural-congress',
        label: 'PROFESSIONAL EVENTS',
        title: 'Structural Engineering Institute Events',
        summary: 'Official event listings for structural engineering research, standards and professional development.',
        source: 'ASCE · Structural Engineering Institute',
        href: 'https://www.asce.org/communities/institutes-and-technical-groups/structural-engineering-institute/events/',
      },
      {
        id: 'world-of-asphalt',
        label: 'TRADE SHOW',
        date: 'MAR 15–17, 2027',
        title: 'World of Asphalt',
        summary: 'Information about the pavement and road-construction industry exhibition.',
        source: 'World of Asphalt',
        href: 'https://www.worldofasphalt.com/press/event-fact-sheet',
      },
    ],
  },
  {
    id: 'universities',
    title: 'Colleges & Universities',
    description: 'Official degree-program information and admissions resources for prospective civil engineers.',
    topics: 'PROGRAMS · ACCREDITATION · APPLICATIONS',
    directoryLabel: 'Search ABET-accredited programs',
    directoryHref: 'https://www.abet.org/accreditation/find-programs/',
    stories: [
      {
        id: 'umass-civil',
        label: 'DEGREE PROGRAM',
        title: 'Bachelor of Science in Civil Engineering',
        summary: 'Degree and curriculum information published by UMass Amherst’s College of Engineering.',
        source: 'UMass Amherst',
        href: 'https://www.umass.edu/engineering/academics/bachelor-science-civil-engineering',
      },
      {
        id: 'wpi-civil',
        label: 'DEGREE PROGRAM',
        title: 'Civil Engineering (BS)',
        summary: 'Official program details, projects and degree requirements at Worcester Polytechnic Institute.',
        source: 'WPI',
        href: 'https://www.wpi.edu/academics/study/civil-engineering-bs',
      },
      {
        id: 'mit-cee',
        label: 'ACADEMIC DEPARTMENT',
        title: 'Civil & Environmental Engineering',
        summary: 'MIT’s overview of the department and undergraduate fields of study.',
        source: 'MIT School of Engineering',
        href: 'https://engineering.mit.edu/department/civil-environmental-engineering',
      },
    ],
  },
]

/** Verified, future-facing event dates and deadlines for the All tab.
 * End dates are local to the event/organization. The page hides expired
 * entries automatically; maintainers must still review sources for updates.
 */
export type CommunityUpcomingItem = {
  id: string
  date: string
  endDate?: string
  label: string
  title: string
  detail: string
  href: string
}
export const communityUpcoming: CommunityUpcomingItem[] = [
  {
    id: 'bhs-play-2026',
    date: '2026-11-13',
    endDate: '2026-11-14',
    label: 'SCHOOL EVENT',
    title: 'BHS · Radium Girls',
    detail: 'Nov. 13–14 · BHS auditorium',
    href: 'https://thebedfordcitizen.org/event/bhs-production-of-radium-girls/2026-11-14/1/',
  },
  {
    id: 'christmas-fair-2026',
    date: '2026-11-14',
    label: 'HOLIDAY EVENT',
    title: 'Scandinavian Christmas Fair',
    detail: 'Bedford community event',
    href: 'https://thebedfordcitizen.org/2026/11/whats-on-the-calendar-bedford-events-through-nov-14/',
  },
  {
    id: 'heat-pump-event-2026',
    date: '2026-11-17',
    label: 'COMMUNITY EVENT',
    title: 'Bedford Heat Pump Pizza Party',
    detail: '5:30–7 PM · Bedford High School',
    href: 'https://thebedfordcitizen.org/2026/11/icymi-reminders-from-the-bedford-citizen-nov-9/',
  },
  {
    id: 'mit-2027-regular-action',
    date: '2027-01-04',
    label: 'ADMISSIONS DEADLINE',
    title: 'MIT · Regular Action',
    detail: 'First-year applications',
    href: 'https://mitadmissions.org/apply/firstyear/deadlines-requirements/',
  },
  {
    id: 'umass-2027-regular-decision',
    date: '2027-01-15',
    label: 'ADMISSIONS DEADLINE',
    title: 'UMass Amherst · Regular Decision',
    detail: 'First-year applications',
    href: 'https://www.umass.edu/admissions/important-dates-deadlines',
  },
  {
    id: 'wpi-2027-regular-decision',
    date: '2027-02-01',
    label: 'ADMISSIONS DEADLINE',
    title: 'WPI · Regular Decision',
    detail: 'First-year applications',
    href: 'https://www.wpi.edu/admissions/undergraduate/apply',
  },
  {
    id: 'asce-2027',
    date: '2027-03-01',
    endDate: '2027-03-05',
    label: 'INDUSTRY CONFERENCE',
    title: 'ASCE2027',
    detail: 'Philadelphia · Mar 1–5',
    href: 'https://www.asce.org/education-and-events/events/meetings/asce2027',
  },
  {
    id: 'world-of-asphalt-2027',
    date: '2027-03-15',
    endDate: '2027-03-17',
    label: 'TRADE SHOW',
    title: 'World of Asphalt',
    detail: 'New Orleans · Mar 15–17',
    href: 'https://www.worldofasphalt.com/press/event-fact-sheet',
  },
  {
    id: 'msef-2027',
    date: '2027-04-08',
    label: 'ENGINEERING FAIR',
    title: 'MSEF High School State Fair',
    detail: 'DCU Center · Worcester',
    href: 'https://scifair.com/hsstatefair/',
  },
]
