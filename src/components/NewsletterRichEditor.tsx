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
    return '<span contenteditable="false" data-media-id="'+mediaId+'">▣ Media</span>'
  const inner=Array.from(e.childNodes).map(sanitize).join('')
  if(!supportedTags.has(e.tagName)) return inner
  const tag=e.tagName.toLowerCase() === 'b' ? 'strong' : e.tagName.toLowerCase() === 'i' ? 'em' : e.tagName.toLowerCase()
  if(tag==='br')return '<br>'
  let attributes=''
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

export type NewsletterEditorHandle={ insertMedia:(id:string)=>void }
type Props={value:string;onChange:(body:string)=>void;onAddMedia:()=>void;label?:string;children?:ReactNode}
export const NewsletterRichEditor=forwardRef<NewsletterEditorHandle,Props>(function NewsletterRichEditor({value,onChange,onAddMedia,label='Article text'},ref){
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
  useImperativeHandle(ref,()=>({insertMedia:(id:string)=>{
    restore()
    const span=document.createElement('span')
    span.setAttribute('contenteditable','false')
    span.setAttribute('data-media-id',id)
    span.textContent='▣ Media'
    const selection=window.getSelection()
    if(selection?.rangeCount && editor.current?.contains(selection.anchorNode)){
      const range=selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(span)
      range.setStartAfter(span)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    }else editor.current?.appendChild(span)
    capture()
    emit()
  }}))
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
      data-placeholder="Write your newsletter section…" onInput={()=>{capture();emit()}} onKeyUp={capture} onMouseUp={capture} onFocus={capture}/>
  </div>
})
