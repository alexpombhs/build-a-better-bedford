import './HalloweenTruss.css'

/**
 * A small, dependency-free kinetic sculpture: a jack-o'-lantern
 * interpreted as a structural wireframe with diagonal truss braces.
 * CSS handles the motion; reduced-motion settings keep it still.
 */
export default function HalloweenTruss() {
  return (
    <figure className="halloween-truss" aria-label="Animated pumpkin-inspired engineering truss sculpture">
      <div className="halloween-truss-stage" aria-hidden="true">
        <span className="halloween-truss-shadow" />
        <svg className="halloween-truss-model" viewBox="0 0 240 200" role="presentation">
          <defs>
            <linearGradient id="bbb-pumpkin-beams" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f1ad55" />
              <stop offset="1" stopColor="#a65c2b" />
            </linearGradient>
          </defs>
          <g className="halloween-truss-structure" fill="none" stroke="url(#bbb-pumpkin-beams)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
            <path d="M120 28 L157 43 L193 67 L209 104 L193 143 L153 168 L113 175 L74 165 L37 136 L27 102 L45 67 L82 41 Z" />
            <path d="M120 28 L120 171 M82 41 L74 165 M157 43 L153 168 M45 67 L193 143 M193 67 L37 136 M27 102 L209 104 M82 41 L193 143 M157 43 L37 136" />
            <path d="M45 67 L120 28 L193 67 L209 104 L153 168 L74 165 L27 102 Z" />
            <path d="M82 41 L120 80 L157 43 M27 102 L82 119 L74 165 M209 104 L157 119 L153 168 M120 80 L82 119 L120 147 L157 119 Z" />
          </g>
          <g className="halloween-truss-accent" fill="none" stroke="#48a9c7" strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round">
            <path d="M120 28 L157 43 L193 67 M120 80 L157 119 L120 147 M82 119 L120 80 M120 28 L120 80" />
          </g>
          <g className="halloween-truss-face" fill="#db9141" fillOpacity=".16" stroke="#c07634" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M62 84 L89 77 L83 107 Z M152 78 L178 86 L158 107 Z" />
            <path d="M91 132 L107 143 L120 136 L132 143 L149 131 L141 152 L118 157 L99 151 Z" />
          </g>
          <g fill="#234d40" stroke="#367562" strokeWidth="1.4">
            <path d="M117 29 L116 17 L125 9 L133 14 L127 30 Z" />
          </g>
          <g fill="#f4c88f">
            <circle cx="120" cy="28" r="3" /><circle cx="82" cy="41" r="2.4" /><circle cx="157" cy="43" r="2.4" />
            <circle cx="193" cy="67" r="2.4" /><circle cx="45" cy="67" r="2.4" />
            <circle cx="27" cy="102" r="2.4" /><circle cx="209" cy="104" r="2.4" />
            <circle cx="74" cy="165" r="2.4" /><circle cx="153" cy="168" r="2.4" /><circle cx="120" cy="80" r="2.4" />
          </g>
        </svg>
      </div>
      <figcaption>Halloween, engineered. A kinetic truss study.</figcaption>
    </figure>
  )
}
