import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NewsletterMediaView } from '../Newsletter'
import type { NewsletterMedia } from '../Newsletter'
import type { ReactNode } from 'react'
import { UiIconButton } from './atoms/MuiPrimitives'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import InsertPhotoOutlinedIcon from '@mui/icons-material/InsertPhotoOutlined'
import LinkIcon from '@mui/icons-material/Link'
import TitleIcon from '@mui/icons-material/Title'
import FormatClearIcon from '@mui/icons-material/FormatClear'

const prefix = '<!--bbb-rich-->'
const supportedTags = new Set(['P','DIV','H3','H4','STRONG','B','EM','I','U','UL','OL','LI','BLOCKQUOTE','BR','A'])
const escapeHtml = (value:string) => value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
export const isNewsletterRichBody = (body:string) => body.startsWith(prefix)
export const newsletterBodyHtml = (body:string) => isNewsletterRichBody(body) ? body.slice(prefix.length) :
  body.replace(/\r\n?/g,'\n').split(/\n\s*\n/).filter(Boolean)
    .map(text=>'<p>'+escapeHtml(text.trim()).replace(/\n/g,'<br>')+'</p>').join('')

function sanitize(node:Node):string {
  if(node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent ?? '')
  if(node.nodeType !== Node.ELEMENT_NODE) return ''
  const e=node as Element
  const mediaId=e.getAttribute('data-media-id')
  if(mediaId && /^[0-9a-f-]{20,50}$/i.test(mediaId))
    return '<span contenteditable="false" data-media-id="'+mediaId+'" role="button" tabindex="0" aria-label="Edit media">▣ Media · Edit</span>'
  const inner=Array.from(e.childNodes).map(sanitize).join('')
  if(!supportedTags.has(e.tagName)) return inner
  const tag=e.tagName.toLowerCase() === 'b' ? 'strong' : e.tagName.toLowerCase() === 'i' ? 'em' : e.tagName.toLowerCase()
  if(tag==='br')return '<br>'
  let attributes=''
  // Preserve only this intentional editorial block class. Never copy
  // arbitrary HTML classes or attributes from rich-text input.
  if(tag==='div' && e.classList.contains('newsletter-intro-block'))
    attributes=' class="newsletter-intro-block"'
  else if(tag==='div' && e.classList.contains('newsletter-photo-row'))
    attributes=' class="newsletter-photo-row"'
  if(tag==='a'){
    try {const u=new URL(e.getAttribute('href') ?? '');if(['https:','http:'].includes(u.protocol))attributes=' href="'+escapeHtml(u.href)+'" target="_blank" rel="noopener noreferrer"'}catch { /* ignore invalid href */ }
  }
  return '<'+tag+attributes+'>'+inner+'</'+tag+'>'
}
// A media token is a block in the article, even if the editor inserted it
// inside an ordinary paragraph. Split at each token without losing any text.
// This normalisation is shared by Edit, Preview and the published reader.
function splitInlineMediaParagraphs(dom: Document) {
  // Normalize an existing photo row back into individual media blocks before
  // regrouping, so a moved/deleted photo never leaves a broken row behind.
  for(const row of Array.from(dom.body.querySelectorAll('.newsletter-photo-row'))){
    const children=Array.from(row.childNodes)
    for(const child of children)row.before(child)
    row.remove()
  }
  for(const paragraph of Array.from(dom.body.querySelectorAll('p'))){
    const parts=Array.from(paragraph.childNodes)
    if(!parts.some(node=>node.nodeType===1&&(node as Element).hasAttribute('data-media-id')))continue
    const fragment=dom.createDocumentFragment()
    let textParagraph=dom.createElement('p')
    const flush=()=>{
      if(textParagraph.textContent?.trim()||textParagraph.querySelector('br,a,strong,em,u'))fragment.appendChild(textParagraph)
      textParagraph=dom.createElement('p')
    }
    for(const part of parts){
      if(part.nodeType===1&&(part as Element).hasAttribute('data-media-id')){
        flush()
        const mediaBlock=dom.createElement('div')
        mediaBlock.appendChild(part)
        fragment.appendChild(mediaBlock)
      }else textParagraph.appendChild(part)
    }
    flush()
    paragraph.replaceWith(fragment)
  }
  // Adjacent block photos belong to one explicit row, not separate floats.
  // Pairing is stable in the editor, studio preview, and published renderer.
  const mediaBlock=(node:Node):node is Element => node.nodeType===1
    && (node as Element).tagName==='DIV'
    && (node as Element).children.length===1
    && (node as Element).firstElementChild?.hasAttribute('data-media-id')===true
    && !(node as Element).textContent?.replace('▣ Media · Edit','').trim()
  for(const node of Array.from(dom.body.childNodes)){
    if(!mediaBlock(node)||!node.isConnected)continue
    const sibling=node.nextSibling
    if(!sibling||!mediaBlock(sibling))continue
    const row=dom.createElement('div')
    row.className='newsletter-photo-row'
    node.before(row)
    row.append(node,sibling)
  }
}
export function sanitizedNewsletterHtml(html:string){
  const dom=new DOMParser().parseFromString(html,'text/html')
  splitInlineMediaParagraphs(dom)
  return Array.from(dom.body.childNodes).map(sanitize).join('')
}
export const storeNewsletterHtml=(html:string)=>prefix+sanitizedNewsletterHtml(html)

// Removing a media attachment must remove its placeholder too, so it cannot
// return after the issue is saved and reloaded.
export function removeMediaFromBody(body:string,id:string):string {
  if(!isNewsletterRichBody(body))return body
  const dom=new DOMParser().parseFromString(newsletterBodyHtml(body),'text/html')
  for(const token of Array.from(dom.body.querySelectorAll('[data-media-id]'))){
    if(token.getAttribute('data-media-id')!==id)continue
    const wrapper=token.parentElement
    if(wrapper && (wrapper.tagName==='P'||wrapper.tagName==='DIV') &&
       wrapper.childNodes.length===1)wrapper.remove()
    else token.remove()
  }
  return storeNewsletterHtml(dom.body.innerHTML)
}
export function referencedMediaIds(body:string):Set<string>{
  return new Set(Array.from(body.matchAll(/data-media-id=["']([0-9a-f-]{20,50})["']/gi),m=>m[1]))
}

export type NewsletterEditorHandle={ insertMedia:(id:string)=>void; moveMedia:(id:string)=>void; moveMediaToPoint:(id:string,x:number,y:number)=>void }
type Props={value:string;onChange:(body:string)=>void;onAddMedia:()=>void;onEditMedia?:(id:string)=>void;media?:NewsletterMedia[];onResizeMedia?:(id:string,width:number)=>void;onUpdateMedia?:(id:string,patch:Partial<NewsletterMedia>)=>void;onMoveMedia?:(id:string,x:number,y:number)=>void;label?:string;children?:ReactNode}
export const NewsletterRichEditor=forwardRef<NewsletterEditorHandle,Props>(function NewsletterRichEditor({value,onChange,onAddMedia,onEditMedia,media=[],onResizeMedia,onUpdateMedia,onMoveMedia,label='Article text'},ref){
  const editor=useRef<HTMLDivElement>(null)
  const selection=useRef<Range|null>(null)
  const [mediaTargets,setMediaTargets]=useState<Array<{id:string;element:Element}>>([])
  const syncMediaTargets=()=>{
    if(!editor.current)return
    const next=Array.from(editor.current.querySelectorAll('[data-media-id]')).map(element=>({id:element.getAttribute('data-media-id')??'',element}))
    setMediaTargets(previous=>previous.length===next.length && previous.every((item,i)=>item.id===next[i].id&&item.element===next[i].element)?previous:next)
  }
  const current=useRef(value)
  const changed=useRef(onChange)
  changed.current=onChange
  useEffect(()=>{
    if(!editor.current || current.current===value)return
    current.current=value
    editor.current.innerHTML=sanitizedNewsletterHtml(newsletterBodyHtml(value))
    syncMediaTargets()
  },[value])
  useEffect(()=>{
    if(editor.current)editor.current.innerHTML=sanitizedNewsletterHtml(newsletterBodyHtml(value))
    syncMediaTargets()
    // Initial contents only: later text edits are owned by the editable element.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])
  const capture=()=>{
    const selected=window.getSelection()
    if(selected?.rangeCount && editor.current?.contains(selected.anchorNode))
      selection.current=selected.getRangeAt(0).cloneRange()
  }
  const emit=()=>{
    if(!editor.current)return
    const result=storeNewsletterHtml(editor.current.innerHTML)
    current.current=result
    changed.current(result)
    syncMediaTargets()
  }
  const restore=()=>{
    editor.current?.focus()
    if(selection.current && editor.current?.contains(selection.current.commonAncestorContainer)){
      const selected=window.getSelection()
      selected?.removeAllRanges()
      selected?.addRange(selection.current)
    }
  }
  const command=(name:string,argument?:string)=>{
    restore()
    document.execCommand(name,false,argument)
    capture()
    emit()
  }
  const insertAtCaret=(id:string)=>{
    restore()
    const span=document.createElement('span')
    span.setAttribute('contenteditable','false')
    span.setAttribute('data-media-id',id)
    span.setAttribute('role','button')
    span.setAttribute('tabindex','0')
    span.setAttribute('aria-label','Edit media')
    span.textContent='▣ Media · Edit'
    const activeSelection=window.getSelection()
    if(activeSelection?.rangeCount && editor.current?.contains(activeSelection.anchorNode)){
      const range=activeSelection.getRangeAt(0)
      // Placement is non-destructive: selecting text must never delete it.
      // Insert just after any selected range, at the chosen location.
      range.collapse(false)
      range.insertNode(span)
      range.setStartAfter(span)
      range.collapse(true)
      activeSelection.removeAllRanges()
      activeSelection.addRange(range)
    }else editor.current?.appendChild(span)
    capture()
    emit()
  }
  const moveAtPoint=(id:string,x:number,y:number)=>{
    if(!editor.current)return
    const marker=Array.from(editor.current.querySelectorAll('[data-media-id]'))
      .find(element=>element.getAttribute('data-media-id')===id)
    if(!marker)return
    const at=document.elementFromPoint(x,y)
    if(!at||!editor.current.contains(at))return
    let range:Range|null=null
    const target=at.closest('[data-media-id]')
    if(target){
      if(target===marker)return
      range=document.createRange()
      const bounds=target.getBoundingClientRect()
      if(x>bounds.left+bounds.width/2)range.setStartAfter(target)
      else range.setStartBefore(target)
      range.collapse(true)
    }else {
      const doc=document as Document&{caretRangeFromPoint?:(x:number,y:number)=>Range|null;caretPositionFromPoint?:(x:number,y:number)=>CaretPosition|null}
      range=doc.caretRangeFromPoint?.(x,y)??null
      if(!range){
        const pos=doc.caretPositionFromPoint?.(x,y)
        if(pos){range=document.createRange();range.setStart(pos.offsetNode,pos.offset)}
      }
    }
    if(!range||!editor.current.contains(range.startContainer))return
    if(marker.contains(range.startContainer))return
    const parent=marker.parentElement
    if(parent&&['P','DIV'].includes(parent.tagName)&&parent.childNodes.length===1)parent.remove()
    else marker.remove()
    range.insertNode(marker)
    selection.current=range.cloneRange()
    emit()
  }
  useImperativeHandle(ref,()=>({
    insertMedia:insertAtCaret,
    moveMediaToPoint:moveAtPoint,
    moveMedia:(id:string)=>{
      if(!editor.current)return
      // The reader chooses the destination by positioning the cursor first.
      // Preserve that caret even when removing the old marker changes the DOM.
      const marker=Array.from(editor.current.querySelectorAll('[data-media-id]'))
        .find(element=>element.getAttribute('data-media-id')===id)
      if(marker){
        const range=selection.current
        if(range && marker.contains(range.commonAncestorContainer)){
          const after=document.createRange()
          after.setStartAfter(marker)
          after.collapse(true)
          selection.current=after
        }
        const parent=marker.parentElement
        if(parent && (parent.tagName==='DIV'||parent.tagName==='P') &&
           parent.childNodes.length===1)parent.remove()
        else marker.remove()
      }
      insertAtCaret(id)
    },
  }))
  const tool=(title:string,icon:ReactNode,run:()=>void)=> <UiIconButton key={title} size="small" title={title} aria-label={title} onMouseDown={e=>e.preventDefault()} onClick={run}>{icon}</UiIconButton>
  return <div className="studio-rich-editor">
    <div className="studio-rich-toolbar" role="toolbar" aria-label={label+' formatting'}>
      {tool('Paragraph',<FormatClearIcon fontSize="small"/>,()=>command('formatBlock','p'))}
      {tool('Heading',<TitleIcon fontSize="small"/>,()=>command('formatBlock','h3'))}
      {tool('Bold',<FormatBoldIcon fontSize="small"/>,()=>command('bold'))}
      {tool('Italic',<FormatItalicIcon fontSize="small"/>,()=>command('italic'))}
      {tool('Underline',<FormatUnderlinedIcon fontSize="small"/>,()=>command('underline'))}
      <span className="studio-toolbar-separator" aria-hidden="true"/>
      {tool('Bulleted list',<FormatListBulletedIcon fontSize="small"/>,()=>command('insertUnorderedList'))}
      {tool('Numbered list',<FormatListNumberedIcon fontSize="small"/>,()=>command('insertOrderedList'))}
      {tool('Quote',<FormatQuoteIcon fontSize="small"/>,()=>command('formatBlock','blockquote'))}
      {tool('Insert link',<LinkIcon fontSize="small"/>,()=>{
        const url=window.prompt('Link URL (https://)')
        if(url && /^https?:\/\//i.test(url))command('createLink',url)
      })}
      <span className="studio-toolbar-separator" aria-hidden="true"/>
      {tool('Insert photo or video',<InsertPhotoOutlinedIcon fontSize="small"/>,()=>{capture();onAddMedia()})}
    </div>
    <div ref={editor} className="studio-rich-surface" contentEditable suppressContentEditableWarning role="textbox" aria-label={label} aria-multiline="true"
      data-placeholder="Write your newsletter section…" onInput={()=>{capture();emit()}} onKeyUp={capture} onMouseUp={capture} onFocus={capture}
      onClick={event=>{
        const element=(event.target as Element).closest?.('[data-media-id]')
        const mediaId=element?.getAttribute('data-media-id')
        if(mediaId && media.find(item=>item.id===mediaId)?.type !== 'image'){event.preventDefault();onEditMedia?.(mediaId)}
      }}
      onKeyDown={event=>{
        if(event.key==='Enter' && event.target instanceof Element && event.target.matches('[data-media-id]')){
          event.preventDefault()
          const id=event.target.getAttribute('data-media-id')
          if(id && media.find(item=>item.id===id)?.type !== 'image')onEditMedia?.(id)
        }
      }}/>
    {mediaTargets.map(target=>{
      const item=media.find(entry=>entry.id===target.id)
      if(!item)return null
      return createPortal(<NewsletterMediaView media={item} onResize={item.type==='image'?onResizeMedia:undefined}
        onUpdate={onUpdateMedia} onMove={onMoveMedia}/>,target.element,target.id)
    })}
  </div>
})
