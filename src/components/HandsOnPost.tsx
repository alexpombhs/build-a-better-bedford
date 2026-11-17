import { useState } from 'react'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { UiBox, UiIconButton, UiText } from './atoms/MuiPrimitives'
import './HandsOnPost.css'

// Add the meeting photos to src/assets/hands-on/ with these names.
// Empty photo slots are intentionally labeled rather than showing unrelated stock imagery.
const photoAssets = import.meta.glob('../assets/hands-on/*.{jpg,jpeg,png,webp}', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>

const findPhoto = (fileName: string) =>
  Object.entries(photoAssets).find(([path]) => path.toLowerCase().endsWith('/' + fileName))?.[1]

const slidesUrl = 'https://docs.google.com/presentation/d/1T-PsUqX7rKjlaH8VGB-sdETczR-S_ZzWc25VFytdNkU/edit'

const slides = [
  {
    file: '01-triangle-cardboard.jpg',
    alt: 'Cardboard bridge structure reinforced with triangles during a club meeting',
    title: 'Triangles make a difference',
    description: 'A cardboard structure with triangular reinforcement',
  },
  {
    file: '02-spaghetti-load-test.jpg',
    alt: 'Spaghetti bridge model being tested using a cup',
    title: 'The spaghetti challenge',
    description: 'Building and testing structures with spaghetti and tape',
  },
  {
    file: '03-building-process.jpg',
    alt: 'Club member working on a miniature bridge during the hands-on activity',
    title: 'Ideas take shape',
    description: 'Trying different connections, materials, and designs',
  },
]

export default function HandsOnPost() {
  const [active, setActive] = useState(0)
  const slide = slides[active]
  const photoUrl = findPhoto(slide.file)
  const advance = (direction: number) =>
    setActive(current => (current + direction + slides.length) % slides.length)

  return <UiBox className="bbb-hands-post" component="article" aria-labelledby="bbb-hands-title">
    <UiBox className="bbb-hands-gallery">
      <UiBox
        className="bbb-hands-stage"
        role="region"
        aria-roledescription="carousel"
        aria-label="Bridge-building meeting photo gallery"
        tabIndex={0}
        onKeyDown={event => {
          if (event.key === 'ArrowLeft') { event.preventDefault(); advance(-1) }
          if (event.key === 'ArrowRight') { event.preventDefault(); advance(1) }
        }}
      >
        {photoUrl
          ? <img className="bbb-hands-image" src={photoUrl} alt={slide.alt} />
          : <UiBox className="bbb-hands-photo-placeholder">
              <svg className="bbb-hands-bridge-drawing" viewBox="0 0 560 270" fill="none" aria-hidden="true">
                <path d="M50 195H510M80 195V115M480 195V115M80 115H480M80 115L155 195L230 115L305 195L380 115L480 195M80 195L155 115L230 195L305 115L380 195L480 115" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
                <path d="M45 204H515" stroke="currentColor" strokeWidth="13" strokeLinecap="square" />
              </svg>
              <UiText className="bbb-hands-photo-placeholder-label">Meeting photo placeholder</UiText>
              <UiText className="bbb-hands-photo-placeholder-title">{slide.title}</UiText>
            </UiBox>}
        <UiBox className="bbb-hands-image-number">{String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</UiBox>
        <UiIconButton className="bbb-hands-gallery-arrow bbb-hands-gallery-prev" onClick={() => advance(-1)} aria-label="Previous meeting photo" size="small">
          <ArrowBackRoundedIcon fontSize="small" />
        </UiIconButton>
        <UiIconButton className="bbb-hands-gallery-arrow bbb-hands-gallery-next" onClick={() => advance(1)} aria-label="Next meeting photo" size="small">
          <ArrowForwardRoundedIcon fontSize="small" />
        </UiIconButton>
      </UiBox>
      <UiBox className="bbb-hands-gallery-footer">
        <UiText className="bbb-hands-caption" aria-live="polite">{slide.description}</UiText>
        <UiBox className="bbb-hands-gallery-dots" role="group" aria-label="Choose a meeting photo">
          {slides.map((item, index) => <UiIconButton
            key={item.file}
            className={index === active ? 'bbb-hands-dot is-active' : 'bbb-hands-dot'}
            onClick={() => setActive(index)}
            aria-label={`Show photo ${index + 1}: ${item.title}`}
            aria-current={index === active ? 'true' : undefined}
            size="small"
          ><span /></UiIconButton>)}
        </UiBox>
      </UiBox>
    </UiBox>

    <UiBox className="bbb-hands-story">
      <UiBox className="bbb-hands-story-meta">
        <UiText component="span">CLUB WORKSHOP / 01</UiText>
        <UiText component="span">NOV 16, 2026</UiText>
      </UiBox>
      <UiText component="h2" id="bbb-hands-title" className="bbb-hands-story-title">
        Spaghetti, tape &amp; triangles
      </UiText>
      <UiText className="bbb-hands-story-lead">
        What does it actually take to make a miniature bridge stronger?
      </UiText>
      <UiText component="p">
        At our latest meeting, we turned a few everyday materials into a series of bridge-building experiments.
        We compared spaghetti structures with lots of tape and just a little, tried making a bridge entirely
        out of tape, and built cardboard structures with and without triangular supports.
      </UiText>
      <UiText component="p">
        Each approach got us thinking about how materials, connections, and shapes affect stability—and how
        tension and compression show up in real structures.
      </UiText>
      <UiBox className="bbb-hands-next">
        <UiText component="span" className="bbb-hands-next-label">UP NEXT</UiText>
        <UiText component="p">
          We'll revisit the cable video and simulations, then use what we've learned to improve our model bridge.
        </UiText>
      </UiBox>
      <a className="bbb-hands-slides-link" href={slidesUrl} target="_blank" rel="noopener noreferrer">
        Explore the meeting slides <OpenInNewRoundedIcon fontSize="inherit" aria-hidden="true" />
      </a>
    </UiBox>
  </UiBox>
}
