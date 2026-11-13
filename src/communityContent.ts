/**
 * Community is an editorial directory, not a general news feed or a live alert
 * service. Each item must explain the civil engineering relevance and point to
 * a reliable primary source.
 *
 * Source details reviewed: November 13, 2026. Update or archive deadline/event
 * announcements after their dates; always verify deadlines before publication.
 */
export type CommunityStory = {
  id: string
  label: string
  date?: string
  title: string
  summary: string
  source: string
  href: string
}

export type CommunitySection = {
  id: 'bedford' | 'industry' | 'universities'
  number: string
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
    number: '01',
    title: 'Bedford infrastructure',
    description: 'Projects and decisions shaping our streets, buildings and public spaces.',
    topics: 'CONSTRUCTION · CIVIC EVENTS · WEATHER',
    directoryLabel: 'Town engineering & project updates',
    directoryHref: 'https://www.bedfordma.gov/378/Public-Works',
    stories: [
      {
        id: 'great-road',
        label: 'CONSTRUCTION',
        date: 'NOV 2026',
        title: 'What’s changing on Great Road?',
        summary: 'Traffic signals, crosswalks, bike connections and stormwater work are part of the town’s current improvement project.',
        source: 'Town of Bedford',
        href: 'https://www.bedfordma.gov/1033/Great-Road-Improvement-Project',
      },
      {
        id: 'bedford-events',
        label: 'PUBLIC EVENT PLANNING',
        title: 'What does it take to plan a town event?',
        summary: 'Bedford’s parade and event permitting process considers traffic, road closures, safety and severe weather.',
        source: 'Bedford parade / event permit',
        href: 'https://bedfordma.gov/DocumentCenter/View/701/Parade---Event-Permit-PDF',
      },
      {
        id: 'bedford-winter',
        label: 'WEATHER & ROADS',
        title: 'How does Bedford prepare for winter weather?',
        summary: 'Snow and ice response depends on road priorities, staffing, equipment and changing weather conditions.',
        source: 'Bedford Public Works',
        href: 'https://www.bedfordma.gov/465/Winter-Operations',
      },
    ],
  },
  {
    id: 'industry',
    number: '02',
    title: 'Engineering industry',
    description: 'Conferences, trade shows and the technologies engineers are discussing.',
    topics: 'CONFERENCES · TRADE SHOWS · RESEARCH',
    directoryLabel: 'ASCE conference & event calendar',
    directoryHref: 'https://www.asce.org/education-and-events',
    stories: [
      {
        id: 'asce2027',
        label: 'INDUSTRY CONFERENCE',
        date: 'MAR 1–5, 2027',
        title: 'ASCE2027 brings civil engineers together',
        summary: 'The national conference will cover infrastructure, resilience, emerging technology and engineering practice.',
        source: 'American Society of Civil Engineers',
        href: 'https://www.asce.org/education-and-events/events/meetings/asce2027',
      },
      {
        id: 'structural-congress',
        label: 'STRUCTURAL ENGINEERING',
        title: 'Bridges, buildings and evolving design standards',
        summary: 'ASCE’s Structural Engineering Institute shares technical events about research, materials, standards and practice.',
        source: 'Structural Engineering Institute',
        href: 'https://www.asce.org/communities/institutes-and-technical-groups/structural-engineering-institute/events/',
      },
      {
        id: 'world-of-asphalt',
        label: 'CONSTRUCTION TRADE SHOW',
        date: 'MAR 15–17, 2027',
        title: 'World of Asphalt: roads, materials and equipment',
        summary: 'The industry exhibition brings together paving, maintenance and traffic-safety technology under one roof.',
        source: 'World of Asphalt · event listing',
        href: 'https://www.conexpoconagg.com/construction-expos',
      },
    ],
  },
  {
    id: 'universities',
    number: '03',
    title: 'Colleges & universities',
    description: 'Civil engineering programs, curriculum benchmarks and admissions timelines.',
    topics: 'PROGRAMS · ACCREDITATION · DEADLINES',
    directoryLabel: 'Compare official program information',
    directoryHref: 'https://www.abet.org/accreditation/find-programs/',
    stories: [
      {
        id: 'umass-civil',
        label: 'UMASS AMHERST',
        date: 'REGULAR: JAN 15',
        title: 'Civil engineering: traffic, water and structures',
        summary: 'An ABET-accredited BS with coursework including traffic engineering and soil mechanics. Check first-year admissions deadlines.',
        source: 'UMass Amherst · official program',
        href: 'https://www.umass.edu/engineering/academics/bachelor-science-civil-engineering',
      },
      {
        id: 'wpi-civil',
        label: 'WPI',
        date: 'REGULAR: FEB 1',
        title: 'Civil engineering through project-based learning',
        summary: 'Explore WPI’s ABET-accredited degree, project work and application routes; deadlines differ by admission plan.',
        source: 'WPI · official degree page',
        href: 'https://www.wpi.edu/academics/study/civil-engineering-bs',
      },
      {
        id: 'mit-cee',
        label: 'MIT',
        title: 'Civil & Environmental Engineering (Course 1)',
        summary: 'Explore undergraduate work in structural design, urban systems, climate and infrastructure resilience.',
        source: 'MIT School of Engineering',
        href: 'https://engineering.mit.edu/department/civil-environmental-engineering',
      },
    ],
  },
]
