type Topic = 'crosswalk'|'dogpark'|'electricity'|'roadwork'|'bathroom'|'bikepath'|'trails'|'flood'|'submitted'|'idea'
type Props = { topic: Topic; photo?: string | null; title: string }
const stroke = { stroke: '#263f52', strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
function Drawing({topic}:{topic:Topic}) {
 switch(topic){
 case 'crosswalk':return <><path {...stroke} d="M25 90L160 25 300 90M25 90V125L160 52 300 125V90"/>{[66,102,138,174,210,246].map(x=><path key={x} {...stroke} d={`M${x} 100l21 -10 18 9 -21 10z`}/>)}</>
 case 'dogpark':return <><path {...stroke} d="M35 110V35H285V110M35 53H285M75 35V110M155 35V110M238 35V110"/><path {...stroke} d="M102 87l18 -23h42l18 23 -12 16h-52zM120 64l-9 -17M164 64l12 -17M122 88h35" /></>
 case 'electricity':return <><path {...stroke} d="M43 118L93 20 143 118M62 80h62M71 58h45M53 98h80M93 20v98M175 117l48 -88 48 88M192 81h62M201 59h44M185 98h76M223 29v88"/><path {...stroke} d="M20 38q45 -16 75 0t82 0t125 0" /></>
 case 'roadwork':return <><path {...stroke} d="M25 105h270M25 124h270M80 105l-14 -26 14 -27 14 27zM154 105l-14 -26 14 -27 14 27zM228 105l-14 -26 14 -27 14 27z"/><path {...stroke} d="M115 44h90l-18 -24h-54zM160 44v40" /></>
 case 'bathroom':return <><path {...stroke} d="M45 20H275V125H45zM160 20V125M65 38h75v67H65zM180 38h75v67h-75zM128 70v15M243 70v15"/><circle cx="103" cy="54" r="8" {...stroke}/><circle cx="218" cy="54" r="8" {...stroke}/></>
 case 'bikepath':return <><path {...stroke} d="M20 105h280M60 98l42 -72h65l42 72M101 26l31 72M167 26l-35 72"/><circle {...stroke} cx="61" cy="105" r="21"/><circle {...stroke} cx="211" cy="105" r="21"/><path {...stroke} d="M245 35h51M270 20v30" strokeDasharray="6 6"/></>
 case 'trails':return <><path {...stroke} d="M25 115C85 55 120 120 175 58S260 22 295 50M33 30l22 -18 22 18v28H33zM55 12v46M232 115l28 -57 28 57zM260 58v74"/><circle cx="168" cy="66" r="7" {...stroke}/></>
 case 'flood':return <><path {...stroke} d="M20 40h280M20 40v45l50 -5 50 -15 50 23 65 3 65 -20V40"/><path {...stroke} d="M20 99q20 -10 40 0t40 0t40 0t40 0t40 0t40 0t40 0M20 118q20 -10 40 0t40 0t40 0t40 0t40 0t40 0t40 0"/><path {...stroke} d="M150 18v38m-8 -10 8 10 8 -10"/></>
 default:return <><path {...stroke} d="M38 106L145 33l137 73M38 106h244M145 33v73M90 70l55 36 69 -36"/><circle cx="145" cy="33" r="5" {...stroke}/></>
 }
}
export default function IdeaVisual({topic,photo,title}:Props) {
 return <div className="bbb-idea-visual">
  {photo ? <img src={photo} alt="" loading="lazy" /> : <svg viewBox="0 0 320 145" role="img" aria-label={`Concept drawing for ${title}`}>
   <defs><pattern id={`grid-${topic}`} width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#dbe3e8" strokeWidth=".5"/></pattern></defs>
   <rect width="320" height="145" fill="#f5f8fa"/><rect width="320" height="145" fill={`url(#grid-${topic})`}/>
   <Drawing topic={topic}/>
  </svg>}
 </div>
}
