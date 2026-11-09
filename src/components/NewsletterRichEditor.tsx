import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
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
  if(tag==='a'){
    try {const u=new URL(e.getAttribute('href') ?? '');if(['https:','http:'].includes(u.protocol))attributes=' href="'+escapeHtml(u.href)+'" target="_blank" rel="noopener noreferrer"'}catch { /* ignore invalid href */ }
  }
  return '<'+tag+attributes+'>'+inner+'</'+tag+'>'
}
export function sanitizedNewsletterHtml(html:string){
  const dom=new DOMParser().parseFromString(html,'text/html')
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

export type NewsletterEditorHandle={ insertMedia:(id:string)=>void; moveMedia:(id:string)=>void }
type Props={value:string;onChange:(body:string)=>void;onAddMedia:()=>void;onEditMedia?:(id:string)=>void;label?:string;children?:ReactNode}
export const NewsletterRichEditor=forwardRef<NewsletterEditorHandle,Props>(function NewsletterRichEditor({value,onChange,onAddMedia,onEditMedia,label='Article text'},ref){
  const editor=useRef<HTMLDivElement>(null)
  const selection=useRef<Range|null>(null)
  const current=useRef(value)
  const changed=useRef(onChange)
  changed.current=onChange
  useEffect(()=>{
    if(!editor.current || current.current===value)return
    current.current=value
    editor.current.innerHTML=sanitizedNewsletterHtml(newsletterBodyHtml(value))
  },[value])
  useEffect(()=>{
    if(editor.current)editor.current.innerHTML=sanitizedNewsletterHtml(newsletterBodyHtml(value))
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
  useImperativeHandle(ref,()=>({
    insertMedia:insertAtCaret,
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
        if(mediaId){event.preventDefault();onEditMedia?.(mediaId)}
      }}
      onKeyDown={event=>{
        if(event.key==='Enter' && event.target instanceof Element && event.target.matches('[data-media-id]')){
          event.preventDefault()
          const id=event.target.getAttribute('data-media-id')
          if(id)onEditMedia?.(id)
        }
      }}/>
  </div>
})
