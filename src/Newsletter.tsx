import { UiText } from './components/atoms/MuiPrimitives'
import NewsletterSidebarSection from './components/molecules/NewsletterSidebarSection'
import NewsletterRailHeading from './components/atoms/NewsletterRailHeading'
import { createElement, useEffect, useRef, useState } from 'react'
import type { ReactNode, CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { isNewsletterRichBody, newsletterBodyHtml, sanitizedNewsletterHtml } from './components/NewsletterRichEditor'
import PageHeading from './components/PageHeading'
import HalloweenTruss from './components/HalloweenTruss'
import ThanksgivingHorn from './components/ThanksgivingHorn'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { supabase } from './supabase'
import roadSolution from './assets/road_solution.png'
import './newsletterStudio.css'
import './newsletterLayouts.css'

export type NewsletterMedia = {
  id: string
  type: 'image' | 'video'
  asset?: 'road-solution'
  storagePath?: string
  url?: string
  alt?: string
  caption?: string
  /** Inline media floats within the story; undefined is left for older issues. */
  align?: 'left' | 'right'
  /** Percentage of the article column used by the photo (25–100). */
  widthPercent?: number
  cropAspect?: 'natural' | 'square' | 'landscape' | 'portrait' | 'wide'
  cropX?: number
  cropY?: number
  cropZoom?: number
  cropLeft?: number
  cropTop?: number
  cropWidth?: number
  cropHeight?: number
}
export type NewsletterSectionStyle = 'default' | 'club-corner' | 'did-you-know' | 'halloween' | 'thanksgiving'
export type NewsletterColorTheme = 'default' | 'sage' | 'blue' | 'amber' | 'lavender'
export type NewsletterSection = {
  heading: string
  body: string
  media?: NewsletterMedia[]
  placement?: 'main' | 'sidebar'
  style?: NewsletterSectionStyle
  colorTheme?: NewsletterColorTheme
  summary?: string
}

// Legacy October content was displayed with a seasonal look before styles
// were editable. Preserve that rendering until an editor explicitly chooses
// a location or style. New content uses the saved settings only.
const isLegacyHalloween = (section: NewsletterSection) =>
  section.style == null && /halloween/i.test(section.heading) && /joke|skeleton|haunted|ghost/i.test(section.body)
export const newsletterSectionStyle = (section: NewsletterSection): NewsletterSectionStyle =>
  section.style ?? (isLegacyHalloween(section) ? 'halloween' : 'default')
export const newsletterColorTheme = (section: NewsletterSection): NewsletterColorTheme =>
  section.colorTheme ?? 'default'
export const newsletterSectionClass = (section: NewsletterSection) =>
  `newsletter-section-style-${newsletterSectionStyle(section)} newsletter-color-${newsletterColorTheme(section)}`
export const newsletterSectionPlacement = (section: NewsletterSection): 'main' | 'sidebar' =>
  section.placement ?? (isLegacyHalloween(section) ? 'sidebar' : 'main')

/** Editorial ordering rule: factual Did You Know panels always close the rail.
 * Reused by public rendering and Newsletter Studio when saving or loading. */
export const orderNewsletterDetails = (details: NewsletterSection[]): NewsletterSection[] => {
  const main = details.filter(section => newsletterSectionPlacement(section) === 'main')
  const side = details.filter(section => newsletterSectionPlacement(section) === 'sidebar')
  return [
    ...main,
    ...side.filter(section => newsletterSectionStyle(section) !== 'did-you-know'),
    ...side.filter(section => newsletterSectionStyle(section) === 'did-you-know'),
  ]
}
export type NewsletterIssue = {
  id: string
  month: string
  number: string
  title: string
  description: string
  sections: NewsletterSection[]
  details: NewsletterSection[]
  footer: string
  status: 'draft' | 'in_review' | 'published'
  published_at: string | null
}

export const emptyIssue = (): NewsletterIssue => ({
  id: new Date().toISOString().slice(0, 7),
  month: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date()),
  number: '03',
  title: '',
  description: '',
  sections: [],
  details: [{ heading: '', body: '', media: [], placement: 'main', style: 'default', colorTheme: 'default' }],
  footer: '',
  status: 'draft',
  published_at: null,
})

function embeddedVideoUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return null
    const host = url.hostname.toLowerCase()
    if (host === 'youtu.be' || host === 'www.youtu.be') {
      const id = url.pathname.split('/')[1]
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com') {
      const id = url.pathname.startsWith('/shorts/') ? url.pathname.split('/')[2] : url.searchParams.get('v')
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    if (host === 'vimeo.com' || host === 'www.vimeo.com') {
      const id = url.pathname.split('/')[1]
      return /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null
    }
    return null
  } catch {
    return null
  }
}
// A Google Maps contributor video cannot be played in a third-party iframe.
// Offer a labeled preview that takes readers to the exact original clip instead.
function externalGoogleMapsVideoUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !['google.com', 'www.google.com'].includes(url.hostname)) return null
    if (url.pathname !== '/search' || !url.hash.startsWith('#lpg=') || !url.hash.includes(',ik:')) return null
    return url.href
  } catch {
    return null
  }
}
export { embeddedVideoUrl, externalGoogleMapsVideoUrl }


export type MediaDragDestination = { id: string; x: number; y: number }
/** Shared visual photo in both the article editor and the editorial preview.
 *  No resize toolbar: drag a corner, drag the image, or double-click to crop. */
export function NewsletterMediaView({
  media,onResize,onUpdate,onMove,onEdit,
}: {
  media:NewsletterMedia
  onResize?:(id:string,width:number)=>void
  onUpdate?:(id:string,patch:Partial<NewsletterMedia>)=>void
  onMove?:(id:string,x:number,y:number)=>void
  onEdit?: (id:string)=>void
}) {
  const [signedUrl,setSignedUrl]=useState('')
  const [loadingError,setLoadingError]=useState(false)
  const [selected,setSelected]=useState(false)
  const [dragWidth,setDragWidth]=useState<number|null>(null)
  const [cropping,setCropping]=useState(false)
  const [cropDraft,setCropDraft]=useState({left:0,top:0,width:100,height:100})
  const [moving,setMoving]=useState(false)
  const [naturalRatio,setNaturalRatio]=useState<number|null>(null)
  const figureRef=useRef<HTMLElement>(null)
  const stopDrag=useRef<(()=>void)|null>(null)
  useEffect(()=>()=>{stopDrag.current?.()},[])
  useEffect(()=>{
    let active=true
    setSignedUrl('')
    setLoadingError(false)
    if(media.storagePath){
      void supabase.storage.from('newsletter-media').createSignedUrl(media.storagePath,3600).then(({data,error})=>{
        if(!active)return
        setSignedUrl(data?.signedUrl??'')
        setLoadingError(Boolean(error))
      })
    }
    return ()=>{active=false}
  },[media.storagePath])
  const imageUrl=media.asset==='road-solution'?roadSolution:signedUrl
  const embedded=media.type==='video'&&media.url?embeddedVideoUrl(media.url):null
  const googleMapsClip=media.type==='video'&&media.url?externalGoogleMapsVideoUrl(media.url):null
  const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
  const width=clamp(media.widthPercent??42,25,100)
  const displayedWidth=dragWidth??width
  const cropLeft=clamp(media.cropLeft??0,0,95)
  const cropTop=clamp(media.cropTop??0,0,95)
  const cropWidth=clamp(media.cropWidth??100,5,100-cropLeft)
  const cropHeight=clamp(media.cropHeight??100,5,100-cropTop)
  const hasNewCrop=[media.cropLeft,media.cropTop,media.cropWidth,media.cropHeight].some(value=>value!==undefined)
  const hasCrop=hasNewCrop && (cropWidth<99.99||cropHeight<99.99||cropLeft>0||cropTop>0)
  // Older issues store an aspect ratio instead of a crop rectangle.
  // Keep that view intact until the author explicitly changes it.
  const legacyRatio=media.cropAspect==='square'?'1 / 1':media.cropAspect==='landscape'?'4 / 3':media.cropAspect==='portrait'?'3 / 4':media.cropAspect==='wide'?'16 / 9':undefined
  const ratio=(hasCrop&&naturalRatio)?String(naturalRatio*cropWidth/cropHeight):!hasNewCrop?legacyRatio:undefined
  const startCrop=()=>{
    let rect={left:cropLeft,top:cropTop,width:cropWidth,height:cropHeight}
    if(!hasNewCrop&&legacyRatio&&naturalRatio){
      const targetRatio=Number(legacyRatio.split('/')[0])/Number(legacyRatio.split('/')[1])
      const zoom=Math.max(1,media.cropZoom??1)
      let w=100,h=100
      if(naturalRatio>targetRatio)w=100*targetRatio/naturalRatio
      else h=100*naturalRatio/targetRatio
      w/=zoom;h/=zoom
      const centerX=media.cropX??50,centerY=media.cropY??50
      rect={left:clamp(centerX-w/2,0,100-w),top:clamp(centerY-h/2,0,100-h),width:w,height:h}
    }
    setCropDraft(rect)
    setCropping(true)
    setSelected(true)
  }
  const editable=Boolean(onResize || onUpdate || onMove)
  // Track the whole pointer gesture on window, not on the resize handle.
  // React may render a new photo node during text editing. Native window
  // listeners remain stable until pointerup, and we commit size exactly once.
  const grab=(event:ReactPointerEvent<HTMLElement>,kind:'resize'|'move'|'crop'|'crop-size',side=1)=>{
    if(!editable || event.button!==0)return
    event.preventDefault()
    event.stopPropagation()
    stopDrag.current?.()
    setSelected(true)
    const originX=event.clientX,originY=event.clientY
    const column=figureRef.current?.closest('.newsletter-rich-media-layout, .studio-rich-surface')?.getBoundingClientRect().width??600
    const stage=(event.currentTarget.closest('.newsletter-crop-stage') as HTMLElement|null)?.getBoundingClientRect()
    const base={...cropDraft}
    const baseWidth=displayedWidth
    let nextWidth=baseWidth
    let lastX=originX,lastY=originY
    const onMovePointer=(move:PointerEvent)=>{
      lastX=move.clientX;lastY=move.clientY
      const dx=move.clientX-originX,dy=move.clientY-originY
      if(kind==='resize'){
        nextWidth=clamp(Math.round(baseWidth+(side*dx*100)/Math.max(1,column)),25,100)
        setDragWidth(nextWidth)
      }else if(kind==='move'){
        if(Math.hypot(dx,dy)>6)setMoving(true)
      }else if(kind==='crop'){
        setCropDraft({...base,
          left:clamp(base.left+(dx/Math.max(1,stage?.width??1))*100,0,100-base.width),
          top:clamp(base.top+(dy/Math.max(1,stage?.height??1))*100,0,100-base.height)})
      }else if(kind==='crop-size'){
        setCropDraft({...base,
          width:clamp(base.width+dx/Math.max(1,stage?.width??1)*100,8,100-base.left),
          height:clamp(base.height+dy/Math.max(1,stage?.height??1)*100,8,100-base.top)})
      }
    }
    const cleanup=()=>{
      window.removeEventListener('pointermove',onMovePointer)
      window.removeEventListener('pointerup',onEndPointer)
      window.removeEventListener('pointercancel',onCancelPointer)
      stopDrag.current=null
      setMoving(false)
    }
    const onEndPointer=(up:PointerEvent)=>{
      cleanup()
      if(kind==='resize'){
        if(nextWidth!==baseWidth)onResize?.(media.id,nextWidth)
        setDragWidth(null)
      }
      if(kind==='move'&&Math.hypot(up.clientX-originX,up.clientY-originY)>8){
        onMove?.(media.id,up.clientX,up.clientY)
      }
    }
    const onCancelPointer=()=>{cleanup();setDragWidth(null)}
    stopDrag.current=cleanup
    window.addEventListener('pointermove',onMovePointer)
    window.addEventListener('pointerup',onEndPointer)
    window.addEventListener('pointercancel',onCancelPointer)
  }
  return <figure ref={figureRef}
    className={'newsletter-media newsletter-media-aligned-'+(media.align==='right'?'right':'left')+(width===100?' newsletter-media-full-width':'')+(editable&&selected?' newsletter-photo-selected':'')+(moving?' newsletter-photo-moving':'')}
    style={media.type==='image'?{width:displayedWidth+'%', '--bbb-photo-width':displayedWidth+'%'} as CSSProperties:undefined}
    onPointerDown={event=>{if(event.target===figureRef.current)setSelected(true)}}
    onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setSelected(false)}}>
    {media.type==='image'&&imageUrl&&<div
      className={'newsletter-photo-frame'+(cropping?' is-cropping':'')}
      style={ratio?{aspectRatio:ratio}:undefined}
      onDoubleClick={event=>{if(!editable)return;event.preventDefault();event.stopPropagation();if(!cropping)startCrop()}}
      onPointerDown={event=>{if(!cropping)grab(event,'move')}}
>
      <img loading="lazy" draggable={false} src={imageUrl} alt={media.alt||'Newsletter illustration'}
        onLoad={event=>setNaturalRatio(event.currentTarget.naturalWidth/event.currentTarget.naturalHeight)}
        style={hasCrop&&naturalRatio?{position:'absolute',maxWidth:'none',maxHeight:'none',width:(10000/cropWidth)+'%',height:(10000/cropHeight)+'%',left:(-100*cropLeft/cropWidth)+'%',top:(-100*cropTop/cropHeight)+'%',objectFit:'fill',transform:'none'}:!hasNewCrop&&legacyRatio?{height:'100%',objectFit:'cover',objectPosition:(media.cropX??50)+'% '+(media.cropY??50)+'%',transform:'scale('+(media.cropZoom??1)+')'}:undefined}/>

    </div>}
    {media.type==='video'&&media.storagePath&&signedUrl&&<video src={signedUrl} controls playsInline preload="metadata" aria-label={media.alt||'Newsletter video'}/>}
    {media.type==='video'&&embedded&&<div className="newsletter-video-frame"><iframe src={embedded} title={media.alt||'Newsletter video'} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/></div>}
    {googleMapsClip&&<a className="newsletter-external-video" href={googleMapsClip} target="_blank" rel="noopener noreferrer" aria-label={(media.alt||'Bridge video')+' — watch the original clip on Google Maps'}>
      <span className="newsletter-external-video-poster">
        <span className="newsletter-external-video-source">CONTRIBUTOR VIDEO · GOOGLE MAPS · 0:12</span>
        <span className="newsletter-external-video-icon"><PlayCircleOutlineIcon aria-hidden="true"/></span>
        <span className="newsletter-external-video-overlay">Hart–Desiato Bridge</span>
        <span className="newsletter-external-video-subtitle">A look at the timber supports beneath the bridge</span>
      </span>
      <span className="newsletter-external-video-action">Watch the original video on Google Maps <OpenInNewIcon aria-hidden="true" fontSize="inherit"/></span>
      <span className="newsletter-external-video-description">Video opens on Google Maps; it cannot play directly on this site.</span>
    </a>}
    {((!imageUrl&&media.type==='image')||(media.type==='video'&&!signedUrl&&!embedded&&!googleMapsClip))&&
      <p className="newsletter-media-placeholder" role="status">{loadingError?'This attachment could not be loaded.':'Loading attachment…'}</p>}
    {media.caption&&<figcaption>{media.caption}</figcaption>}
    {editable&&media.type==='image'&&<>
      <span className="newsletter-photo-grip newsletter-photo-grip-se" role="slider" tabIndex={0}
        aria-label="Drag the lower right corner to resize photo" aria-valuemin={25} aria-valuemax={100} aria-valuenow={displayedWidth}
        onKeyDown={event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();onResize?.(media.id,clamp(width+(event.key==='ArrowRight'?5:-5),25,100))}}}
        onPointerDown={event=>grab(event,'resize',1)}/>
      <span className="newsletter-photo-grip newsletter-photo-grip-sw" role="slider" tabIndex={0}
        aria-label="Drag the lower left corner to resize photo" aria-valuemin={25} aria-valuemax={100} aria-valuenow={width}
        onKeyDown={event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();onResize?.(media.id,clamp(width+(event.key==='ArrowRight'?5:-5),25,100))}}}
        onPointerDown={event=>grab(event,'resize',-1)}/>
      {cropping&&<div className="newsletter-crop-stage" style={naturalRatio?{aspectRatio:naturalRatio}:undefined}>
        {imageUrl&&<img draggable={false} src={imageUrl} alt="" className="newsletter-crop-source"/>}
        <div className="newsletter-crop-shade"/>
        <div className="newsletter-crop-selection" style={{left:cropDraft.left+'%',top:cropDraft.top+'%',width:cropDraft.width+'%',height:cropDraft.height+'%'}}
          onPointerDown={event=>grab(event,'crop')}>
          {imageUrl&&<img src={imageUrl} draggable={false} alt="" className="newsletter-crop-visible"
            style={{width:(10000/cropDraft.width)+'%',height:(10000/cropDraft.height)+'%',
              left:(-100*cropDraft.left/cropDraft.width)+'%',top:(-100*cropDraft.top/cropDraft.height)+'%'}}/>}
          <span className="newsletter-crop-thirds"/>
          <span className="newsletter-crop-corner" onPointerDown={event=>grab(event,'crop-size')}
/>
        </div>
        <div className="newsletter-crop-actions">
          <button type="button" onClick={()=>setCropDraft({left:0,top:0,width:100,height:100})}>Reset frame</button>
          <button type="button" onClick={()=>setCropping(false)}>Cancel</button>
          <button type="button" onClick={()=>{onUpdate?.(media.id,{cropLeft:cropDraft.left,cropTop:cropDraft.top,cropWidth:cropDraft.width,cropHeight:cropDraft.height});setCropping(false)}}>Apply crop</button>
        </div>
      </div>}
      {selected&&!cropping&&<><span className="newsletter-photo-hint">Drag to move · drag corners to resize · double-click to crop</span>{onEdit&&<button type="button" className="newsletter-photo-context-edit" onClick={()=>onEdit(media.id)}>Replace photo</button>}</>}
    </>}
  </figure>
}

export type NewsletterLayout = 'article' | 'feature'

// Rich content uses a small safe markup subset. Media tokens resolve to the
// issue's own uploaded assets and can appear between paragraphs.
function NewsletterRichBody({body,media=[],onResizeMedia,onUpdateMedia,onMoveMedia,editorPreview=false}:{body:string;media?:NewsletterMedia[];onResizeMedia?:(id:string,width:number)=>void;onUpdateMedia?:(id:string,patch:Partial<NewsletterMedia>)=>void;onMoveMedia?:(id:string,x:number,y:number)=>void;editorPreview?:boolean}){
  const safe=sanitizedNewsletterHtml(newsletterBodyHtml(body))
  const dom=new DOMParser().parseFromString(safe,'text/html')
  let index=0
  const convert=(node:Node):ReactNode=>{
    if(node.nodeType===3)return node.textContent
    if(node.nodeType!==1)return null
    const element=node as Element
    const mediaId=element.getAttribute('data-media-id')
    if(mediaId){
      const asset=media.find(item=>item.id===mediaId)
      return asset ? <NewsletterMediaView key={index++} media={asset} onResize={onResizeMedia} onUpdate={onUpdateMedia} onMove={onMoveMedia?(id,x,y)=>onMoveMedia(id,x,y):undefined}/> : editorPreview ? <p key={index++} role="alert" className="newsletter-media-missing">This photo has no saved attachment. Reinsert it from Edit to display it.</p> : null
    }
    const tag=element.tagName.toLowerCase()
    const tags=new Set(['p','div','h3','h4','strong','em','u','ul','ol','li','blockquote','br','a'])
    if(!tags.has(tag))return null
    const children=Array.from(element.childNodes).map(convert)
    // A media token can be inserted inside a paragraph by contentEditable.
    // Never nest a <figure> inside <p>: it is invalid HTML, and the browser
    // relocates the figure, often placing it above the text unexpectedly.
    if(tag==='p' && Array.from(element.children).some(child=>child.hasAttribute('data-media-id')))
      return createElement('div',{key:index++,className:'newsletter-rich-media-paragraph'},...children)
    if(tag==='a')return createElement('a',{key:index++,href:element.getAttribute('href') ?? undefined,target:'_blank',rel:'noopener noreferrer'},...children)
    return createElement(tag,{
      key:index++,
      // One safe, semantic newsletter introduction style survives sanitization.
      className:tag==='div' && element.classList.contains('newsletter-intro-block')
        ? 'newsletter-intro-block' : tag==='div' && element.classList.contains('newsletter-photo-row') ? 'newsletter-photo-row' : undefined,
    },...children)
  }
  const nodes=Array.from(dom.body.childNodes)
  const renderNodes:ReactNode[]=[]
  // Adjacent photo tokens become a two-column gallery without changing saved HTML.
  for(let i=0;i<nodes.length;i++){
    const getPhoto=(n:Node)=>{if(n.nodeType!==1)return undefined;const el=n as Element;if(el.classList.contains('newsletter-photo-row'))return undefined;const id=el.getAttribute('data-media-id')??el.querySelector('[data-media-id]')?.getAttribute('data-media-id');return media.find(m=>m.id===id&&m.type==='image')}
    const first=getPhoto(nodes[i]),second=i+1<nodes.length?getPhoto(nodes[i+1]):undefined
    if(first&&second){renderNodes.push(<div className="newsletter-photo-row" key={'photos-'+i} data-drop-index={i}>{[first,second].map(m=><NewsletterMediaView key={m.id} media={m} onResize={onResizeMedia} onUpdate={onUpdateMedia} onMove={onMoveMedia?(id,x,y)=>onMoveMedia(id,x,y):undefined}/>)}</div>);i++;continue}
    renderNodes.push(<div className="newsletter-story-block" data-drop-index={i} key={'node-'+i}>{convert(nodes[i])}</div>)
  }
  return <div className="newsletter-article-copy newsletter-rich-copy newsletter-rich-media-layout"
    >
    {renderNodes}
  </div>
}
function NewsletterArticleBody({ body }: { body: string }) {
  // The editor contains meaningful line breaks, but not necessarily blank
  // lines. Render each text line as a real paragraph so CSS controls spacing.
  const lines = body.replace(/\r\n?/g, '\n').split('\n').map(line => line.trim()).filter(Boolean)
  const rolePattern = /^(Club Leader|Co-Leader|Club Advisor)\s*:?\s*(.*)$/i
  type TeamMember = { role: string; person: string }
  type Block = { type: 'paragraph'; text: string } | { type: 'team'; members: TeamMember[] }
  const blocks: Block[] = []

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(rolePattern)
    if (!match) {
      blocks.push({ type: 'paragraph', text: lines[i] })
      continue
    }

    const role = match[1]
    // Support "Club Leader: Name" and an editor's "Club Leader" + next line.
    const person = match[2] || (i + 1 < lines.length && !rolePattern.test(lines[i + 1]) ? lines[++i] : '')
    const last = blocks[blocks.length - 1]
    if (last?.type === 'team') last.members.push({ role, person })
    else blocks.push({ type: 'team', members: [{ role, person }] })
  }

  const roleIcon = (role: string) => {
    const props = { fontSize: 'small' as const, 'aria-hidden': true as const }
    if (/advisor/i.test(role)) return <SchoolOutlinedIcon {...props} />
    if (/co-leader/i.test(role)) return <GroupsOutlinedIcon {...props} />
    return <EmojiEventsOutlinedIcon {...props} />
  }

  return <div className="newsletter-article-copy">
    {blocks.map((block, index) => block.type === 'team'
      ? <div className="newsletter-leadership-team" role="group" aria-label="Club leadership team" key={index}>
          {block.members.map(({ role, person }, memberIndex) =>
            <div className="newsletter-leadership-person" key={memberIndex}>
              <span className="newsletter-leadership-icon">{roleIcon(role)}</span>
              <span className="newsletter-leadership-role">{role}</span>
              <span className="newsletter-leadership-name">{person}</span>
            </div>)}
        </div>
      : <UiText component="p" variant="body1" key={index}>{block.text}</UiText>)}
  </div>
}

export function IssueView({ issue, layout = 'article', editorPreview = false, onResizeMedia,onUpdateMedia,onMoveMedia }: { issue: NewsletterIssue; layout?: NewsletterLayout; editorPreview?: boolean; onResizeMedia?: (id:string,width:number)=>void; onUpdateMedia?:(id:string,patch:Partial<NewsletterMedia>)=>void; onMoveMedia?:(sectionIndex:number,id:string,x:number,y:number)=>void }) {
  const mainDetails = issue.details.filter(section => newsletterSectionPlacement(section) === 'main')
  const sideDetails = orderNewsletterDetails(issue.details).filter(section => newsletterSectionPlacement(section) === 'sidebar')
  const articleSections = mainDetails.length > 0 ? mainDetails : issue.sections
  const contents = articleSections.filter(section => section.heading.trim()).map(section => ({...section, body: section.summary ?? issue.sections.find(entry => entry.heading.trim().toLowerCase() === section.heading.trim().toLowerCase())?.body ?? ''}))
  const isOctober2026 = issue.id.startsWith('2026-10') || /october\s+2026/i.test(issue.month)
  const hasSideRail = contents.length > 0 || sideDetails.length > 0 || isOctober2026
  const sectionId = (index: number) => `bbb-issue-${issue.id}-section-${index + 1}`
  return <section className={`newsletter-page newsletter-layout-${layout}`}>
    {!editorPreview && issue.status !== 'published' && <p className="newsletter-private-banner">PRIVATE PREVIEW · {issue.status === 'draft' ? 'DRAFT' : 'IN REVIEW'} · NOT VISIBLE TO VISITORS</p>}
    <div className="newsletter-clean">
      <div className={hasSideRail ? 'newsletter-editorial-grid has-sidebar' : 'newsletter-editorial-grid'}>
        <div className="newsletter-editorial-main">
          <header className="newsletter-intro">
            <PageHeading eyebrow={`${issue.month.toUpperCase()} · ISSUE ${issue.number}`} title={issue.title || 'Untitled issue'} description={issue.description} />
          </header>
          <div className="newsletter-expand-panel">
            {articleSections.map((section, index) => {
              const halloween = newsletterSectionStyle(section) === 'halloween'
              const thanksgiving = newsletterSectionStyle(section) === 'thanksgiving'
              return <section className={`design-problem ${newsletterSectionClass(section)}${halloween || thanksgiving ? ' newsletter-main-halloween-feature' : ''}`} key={index} id={sectionId(index)}>
                {newsletterSectionStyle(section) === 'club-corner' && <span className="newsletter-feature-kicker">CLUB CORNER</span>}
                {newsletterSectionStyle(section) === 'did-you-know' && <span className="newsletter-feature-kicker">DID YOU KNOW?</span>}
                {halloween && <div className="newsletter-main-seasonal"><span className="newsletter-feature-kicker">CLUB CORNER</span><HalloweenTruss /></div>}
                {thanksgiving && <div className="newsletter-main-seasonal"><span className="newsletter-feature-kicker">CLUB CORNER</span><ThanksgivingHorn /></div>}
                <div className="expand-grid"><div><UiText component="h2" variant="h6">{section.heading}</UiText>{isNewsletterRichBody(section.body) ? <NewsletterRichBody body={section.body} media={section.media} onResizeMedia={onResizeMedia} onUpdateMedia={onUpdateMedia} onMoveMedia={onMoveMedia?(id,x,y)=>onMoveMedia(index,id,x,y):undefined} editorPreview={editorPreview}/> : <NewsletterArticleBody body={section.body} />}</div></div>
                {!isNewsletterRichBody(section.body) && (section.media ?? []).map(item => <NewsletterMediaView key={item.id} media={item} />)}
              </section>
            })}
          </div>
        </div>
        {hasSideRail && <aside className="newsletter-editorial-aside" aria-label="Issue contents and related stories">
          {contents.length > 0 && <nav className="newsletter-issue-contents" aria-label="In this issue">
            <NewsletterRailHeading>In This Issue</NewsletterRailHeading>
            <ol className="newsletter-toc-list">
              {contents.map((section, index) => {
                const exactIndex = articleSections.findIndex(article => article.heading.trim().toLowerCase() === section.heading.trim().toLowerCase())
                const linkedIndex = exactIndex >= 0 ? exactIndex : (index < articleSections.length ? index : -1)
                return <li key={index}>
                {linkedIndex >= 0
                  ? <a href={`#${sectionId(linkedIndex)}`}>
                      <span className="newsletter-toc-number">{String(index + 1).padStart(2, '0')}</span>
                      <span className="newsletter-toc-content">
                        <span className="newsletter-toc-title">{section.heading || `Section ${index + 1}`}</span>
                        {section.body && <span className="newsletter-toc-description">{section.body}</span>}
                      </span>
                    </a>
                  : <span className="newsletter-toc-unlinked">
                      <span className="newsletter-toc-number">{String(index + 1).padStart(2, '0')}</span>
                      <span className="newsletter-toc-content">
                        <span className="newsletter-toc-title">{section.heading || `Section ${index + 1}`}</span>
                        {section.body && <span className="newsletter-toc-description">{section.body}</span>}
                      </span>
                    </span>}
              </li>})}
            </ol>
          </nav>}
          {sideDetails.length > 0 && <div className="newsletter-side-stories">
            {sideDetails.map((section, index) => {
              const style = newsletterSectionStyle(section)
              const halloween = style === 'halloween'
              const thanksgiving = style === 'thanksgiving'
              const variant = style === 'did-you-know' ? 'did-you-know'
                : (style === 'club-corner' || halloween || thanksgiving) ? 'club-corner' : 'default'
              return <NewsletterSidebarSection
                key={index}
                variant={variant}
                title={section.heading}
                className={`${newsletterSectionClass(section)}${halloween || thanksgiving ? ' newsletter-halloween-feature' : ''}`}
                ornament={halloween ? <HalloweenTruss /> : thanksgiving ? <ThanksgivingHorn /> : undefined}>
                {isNewsletterRichBody(section.body)
                  ? thanksgiving
                    ? <div className="newsletter-halloween-copy newsletter-thanksgiving-copy"><NewsletterRichBody body={section.body} media={section.media} onResizeMedia={onResizeMedia} editorPreview={editorPreview} /></div>
                    : <NewsletterRichBody body={section.body} media={section.media} onResizeMedia={onResizeMedia} editorPreview={editorPreview} />
                  : halloween
                    ? <div className="newsletter-halloween-copy">{section.body.split(/\n\s*\n/).filter(Boolean).map((paragraph, paragraphIndex) =>
                      <p className={/^(Why |Because )/i.test(paragraph.trim()) ? 'newsletter-halloween-joke' : undefined} key={paragraphIndex}>{paragraph}</p>
                    )}</div>
                  : <UiText component="p" variant="body2">{section.body}</UiText>}
                {!isNewsletterRichBody(section.body) && (section.media ?? []).map(item => <NewsletterMediaView key={item.id} media={item} />)}
              </NewsletterSidebarSection>
            })}
          </div>}
          {isOctober2026 && <section className="newsletter-nerd-facts" aria-label="Did you know? Bedford dog facts">
            <div className="newsletter-side-heading">DID YOU KNOW?</div>
            <ol className="newsletter-nerd-fact-list">
              <li className="newsletter-nerd-fact">
              <h3>About one registered dog for every five Bedford households</h3>
              <p>Bedford had 1,162 registered dogs in August 2026—roughly 20 dogs for every 100 households.</p>
              <a href="https://thebedfordcitizen.org/2026/08/bedford-home-to-many-four-legged-friends/" target="_blank" rel="noopener noreferrer">Read more <span aria-hidden="true">↗</span></a>
              </li>
              <li className="newsletter-nerd-fact">
              <h3>Bedford once planned a dog park</h3>
              <p>The town formed a Dog Park Task Force and approved preliminary funding, but the proposal faced concerns about location and community impacts.</p>
              <div className="newsletter-nerd-links">
                <a href="https://www.bedfordma.gov/ArchiveCenter/ViewFile/Item/215" target="_blank" rel="noopener noreferrer">Read more <span aria-hidden="true">↗</span></a>
                <a href="https://cdn.thebedfordcitizen.org/wp-content/uploads/2018/05/ad-hoc-Dog-Park-Task-Force-Recommendations-to-the-Selectmen-05292018.pdf" target="_blank" rel="noopener noreferrer">Proposed locations <span aria-hidden="true">↗</span></a>
              </div>
              </li>
            </ol>
          </section>}
        </aside>}
      </div>
      {issue.footer && <footer className="newsletter-disclaimer"><p>{issue.footer}</p></footer>}
    </div>
  </section>
}

export default function Newsletter() {
  const restoredScroll = useRef(false)
  const [issues, setIssues] = useState<NewsletterIssue[]>([])
  const [selected, setSelected] = useState('')
  const [mobileIssuesOpen, setMobileIssuesOpen] = useState(false)
  const [error, setError] = useState('')
  const refresh = async () => {
    // The public route always fetches published issues, regardless of login state.
    // Editing and hidden content belong exclusively to /admin.
    const query = supabase.from('newsletters')
      .select('id,month,number,title,description,sections,details,footer,status,published_at')
      .eq('status', 'published')
    const { data, error: loadError } = await query.order('id', { ascending: false })
    if (loadError) {
      setError('Newsletters could not be refreshed. Please try again.')
      return
    }
    setError('')
    const visible = ((data ?? []) as NewsletterIssue[]).filter(issue => issue.status === 'published')
    setIssues(visible)
    setSelected(previous => visible.some(issue => issue.id === previous) ? previous : (visible[0]?.id ?? ''))
  }
  useEffect(() => { void refresh() }, [])
  const chosen = issues.find(issue => issue.id === selected)
  // The newsletter arrives asynchronously. Restore scroll only after the
  // article is available, otherwise the browser clamps the position to zero.
  useEffect(() => {
    if (!chosen || restoredScroll.current) return
    restoredScroll.current = true
    let saved: number | null = null
    try {
      const raw = window.sessionStorage.getItem('bbb-scroll:' + window.location.pathname)
      if (raw !== null) {
        const value = Number(raw)
        if (Number.isFinite(value) && value > 0) saved = value
      }
    } catch { /* session storage may be disabled */ }
    if (saved === null) return
    const y = saved
    let cancelled = false
    let frame = 0
    let handle = 0
    const restore = () => {
      if (cancelled) return
      window.scrollTo(0, y)
      frame += 1
      if (Math.abs(window.scrollY - y) > 2 && frame < 90) {
        handle = window.requestAnimationFrame(restore)
      }
    }
    handle = window.requestAnimationFrame(restore)
    return () => { cancelled = true; window.cancelAnimationFrame(handle) }
  }, [chosen?.id])
  return <div>
    <div className="newsletter-library">
      <aside className="newsletter-archive" aria-label="Newsletter issue library">
        <div className="archive-head">
          <div><span className="archive-kicker">BUILD A BETTER BEDFORD</span><h2>Newsletter archive</h2></div>
          <button className="archive-mobile-toggle" type="button" aria-expanded={mobileIssuesOpen} aria-controls="newsletter-issue-list" onClick={() => setMobileIssuesOpen(open => !open)}>
            {mobileIssuesOpen ? 'Hide issues −' : 'Browse issues +'}
          </button>
        </div>
        <nav id="newsletter-issue-list" className={mobileIssuesOpen ? 'archive-list is-open' : 'archive-list'} aria-label="Browse newsletter issues">
          {issues.map(issue =>
            <button key={issue.id} type="button" className={issue.id === selected ? 'archive-item selected' : 'archive-item'} aria-current={issue.id === selected ? 'page' : undefined} onClick={() => { setSelected(issue.id); setMobileIssuesOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
              <span className="archive-month">{issue.month} <small>NO. {issue.number}</small></span>
              <strong>{issue.title}</strong>
            </button>)}
        </nav>
        <p className="archive-coming">Explore the latest published issues of Build a Better Bedford.</p>
      </aside>
      <div className="newsletter-reading-area">
        {error && <p role="status" className="newsletter-load-message">{error}</p>}
        {chosen ? <IssueView issue={chosen} /> : <div className="newsletter-empty"><PageHeading title="No published issues yet" description="Check back for updates from Build a Better Bedford." /></div>}
      </div>
    </div>
  </div>
}
