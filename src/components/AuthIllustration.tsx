import { useEffect, useState } from 'react'
import type { KeyboardEvent } from 'react'

const equations = [
  ['3 + 4 =', '7'],
  ['9 − 5 =', '4'],
  ['6 × 3 =', '18'],
  ['20 ÷ 4 =', '5'],
  ['8 + 7 =', '15'],
]

export function AuthIllustration() {
  const [equationIndex, setEquationIndex] = useState(0)
  const [chemistryActive, setChemistryActive] = useState(false)
  const [biologyActive, setBiologyActive] = useState(false)
  const [biologyHovered, setBiologyHovered] = useState(false)
  const [robotGiggles, setRobotGiggles] = useState(false)
  const caption = chemistryActive
    ? 'Chemistry experiment ready! Click the flask to reset it.'
    : biologyActive
      ? 'Biology in motion! Click the cell to pause it.'
      : 'Tap a STEM card to explore!'

  useEffect(() => {
    const timer = window.setInterval(() => {
      setEquationIndex((index) => (index + 1) % equations.length)
    }, 2400)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!robotGiggles) return
    const timer = window.setTimeout(() => setRobotGiggles(false), 900)
    return () => window.clearTimeout(timer)
  }, [robotGiggles])

  function activateWithKeyboard(
    event: KeyboardEvent<SVGGElement>,
    activate: () => void,
  ) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activate()
    }
  }

  const [problem, answer] = equations[equationIndex]

  return (
    <figure className="auth-illustration-wrap">
      <svg
        aria-label="A friendly robot surrounded by interactive STEM activities"
        className="auth-illustration"
        role="group"
        viewBox="0 0 900 600"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="auth-scene" x1="70" y1="45" x2="825" y2="574" gradientUnits="userSpaceOnUse">
            <stop stopColor="#B9F0FF" />
            <stop offset=".48" stopColor="#E7C8FF" />
            <stop offset="1" stopColor="#FFE58A" />
          </linearGradient>
          <linearGradient id="auth-planet" x1="150" y1="145" x2="235" y2="225" gradientUnits="userSpaceOnUse">
            <stop stopColor="#36E5F5" />
            <stop offset="1" stopColor="#246BFF" />
          </linearGradient>
          <linearGradient id="auth-robot" x1="350" y1="280" x2="540" y2="507" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff" />
            <stop offset="1" stopColor="#DDF5FF" />
          </linearGradient>
          <linearGradient id="auth-flask" x1="687" y1="310" x2="731" y2="358" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff" />
            <stop offset="1" stopColor="#C5FFF2" />
          </linearGradient>
          <filter id="auth-shadow" x="250" y="185" width="400" height="390" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        <rect x="1" y="1" width="898" height="598" rx="34" fill="url(#auth-scene)" />
        <circle cx="450" cy="294" r="228" fill="#fff" fillOpacity=".28" />
        <ellipse cx="450" cy="298" rx="332" ry="226" fill="none" stroke="#547BFF" strokeOpacity=".32" strokeWidth="2" />
        <ellipse cx="450" cy="298" rx="287" ry="184" fill="none" stroke="#C45CFF" strokeOpacity=".28" strokeWidth="2" />
        <ellipse cx="450" cy="535" rx="125" ry="18" fill="#516CB2" fillOpacity=".22" filter="url(#auth-shadow)" />

        <g className="auth-connection-lines" fill="none" stroke="#6D7BFF" strokeLinecap="round" strokeWidth="3" strokeDasharray="6 10">
          <path d="M398 304 215 198" />
          <path d="M431 276 397 126" />
          <path d="M511 304 699 205" />
          <path d="M367 350 221 339" />
          <path d="M395 430 216 496" />
          <path d="M527 423 706 492" />
          <path d="M536 350 710 337" />
        </g>
        <g fill="#fff" stroke="#7485FF" strokeWidth="3">
          <circle className="auth-float" cx="304" cy="259" r="6" />
          <circle className="auth-float auth-delay" cx="414" cy="203" r="5" />
          <circle className="auth-float" cx="598" cy="258" r="6" />
          <circle className="auth-float auth-delay" cx="294" cy="462" r="5" />
          <circle className="auth-float" cx="629" cy="455" r="6" />
        </g>

        <g className="auth-stem-card auth-planet-card" aria-label="Science">
          <circle cx="195" cy="187" r="78" fill="#2CD7F2" fillOpacity=".2" />
          <rect x="135" y="127" width="120" height="120" rx="30" fill="#E5FCFF" stroke="#69DDF0" strokeWidth="3" />
          <circle cx="195" cy="181" r="36" fill="url(#auth-planet)" />
          <path d="M173 177c10-11 21-10 30-4 8 5 15 5 22-1m-45 19c7-6 14-6 21-1" fill="none" stroke="#C8FF58" strokeWidth="6" strokeLinecap="round" />
          <text x="195" y="232" className="auth-card-label">SCIENCE</text>
        </g>

        <g className="auth-stem-card auth-rocket-card" aria-label="Engineering">
          <circle cx="397" cy="105" r="70" fill="#FF6795" fillOpacity=".18" />
          <rect x="341" y="49" width="112" height="112" rx="29" fill="#FFF0F4" stroke="#FF91AE" strokeWidth="3" />
          <g transform="translate(0 -8) rotate(34 397 105)">
            <path d="M381 122c0-22 7-49 16-64 9 15 16 42 16 64a16 16 0 1 1-32 0Z" fill="#fff" stroke="#26334D" strokeWidth="3" />
            <path d="M381 115h32v19a16 16 0 0 1-32 0v-19Z" fill="#FF6172" />
            <circle cx="397" cy="105" r="6" fill="#2451D4" />
            <path d="m382 126-13 14 14-3m28-11 13 14-14-3" fill="#F59E0B" />
          </g>
          <text x="397" y="151" className="auth-card-label">ENGINEERING</text>
        </g>

        <g className="auth-stem-card auth-physics-card" aria-label="Physics">
          <circle cx="710" cy="187" r="78" fill="#FFC83D" fillOpacity=".22" />
          <rect x="650" y="127" width="120" height="120" rx="30" fill="#FFF9DA" stroke="#F1CB52" strokeWidth="3" />
          <g transform="translate(0 -18)">
            <path d="M710 157a30 30 0 0 0-19 53c7 5 8 12 8 17h22c0-5 1-12 8-17a30 30 0 0 0-19-53Z" fill="#FFD83D" stroke="#26334D" strokeWidth="4" />
            <path d="M701 228h18m-15 9h12m-9 8h6" stroke="#8291A8" strokeWidth="4" strokeLinecap="round" />
            <path d="M710 145v-8m-39 24-7-6m85 6 7-6" stroke="#E8B926" strokeWidth="4" strokeLinecap="round" />
          </g>
          <text x="710" y="232" className="auth-card-label">PHYSICS</text>
        </g>

        <g className="auth-stem-card auth-math-card" aria-label="Math problems change over time">
          <circle cx="196" cy="493" r="78" fill="#647BFF" fillOpacity=".2" />
          <rect x="135" y="432" width="122" height="122" rx="29" fill="#EEF0FF" stroke="#9299FF" strokeWidth="3" />
          <rect x="148" y="446" width="96" height="63" rx="15" fill="#DCE5FF" />
          <text className="auth-math-equation" x="196" y="485" textLength="84" lengthAdjust="spacingAndGlyphs">
            {problem} <tspan fill="#7152CD">{answer}</tspan>
          </text>
          <text x="196" y="532" className="auth-card-label">MATH</text>
        </g>

        <g
          aria-label="Biology cell: hover or activate to change its colors and rotate horizontally"
          aria-pressed={biologyActive}
          className={`auth-stem-card auth-interactive-card auth-biology-card${biologyActive ? ' is-active' : ''}`}
          onClick={() => setBiologyActive((active) => !active)}
          onMouseEnter={() => setBiologyHovered(true)}
          onMouseLeave={() => setBiologyHovered(false)}
          onKeyDown={(event) => activateWithKeyboard(event, () => setBiologyActive((active) => !active))}
          role="button"
          tabIndex={0}
        >
          <circle cx="708" cy="493" r="78" fill="#B75CFF" fillOpacity=".2" />
          <rect className="auth-stem-card-bg" x="648" y="432" width="120" height="122" rx="29" fill="#F8ECFF" stroke="#C78AF4" strokeWidth="3" />
          <g className="auth-dna-cell">
            <path className="auth-dna-helix" d="M686 451c42 20 42 37 0 57m44-57c-42 20-42 37 0 57" fill="none" stroke={biologyActive ? '#FF8A00' : biologyHovered ? '#E6007E' : '#6D28D9'} strokeWidth="6" strokeLinecap="round" />
            <path className="auth-dna-rungs" d="M692 458h32m-40 13h48m-48 14h48m-40 13h32" stroke={biologyActive ? '#245BFF' : biologyHovered ? '#00A8B5' : '#FF6B00'} strokeWidth="4" strokeLinecap="round" />
          </g>
          <text x="708" y="535" className="auth-card-label">BIOLOGY</text>
        </g>

        <g
          aria-label="Chemistry flask: hover or activate to change its color"
          aria-pressed={chemistryActive}
          className={`auth-stem-card auth-interactive-card auth-chemistry-card${chemistryActive ? ' is-active' : ''}`}
          onClick={() => setChemistryActive((active) => !active)}
          onKeyDown={(event) => activateWithKeyboard(event, () => setChemistryActive((active) => !active))}
          role="button"
          tabIndex={0}
        >
          <circle cx="710" cy="337" r="57" fill="#20D9B0" fillOpacity=".2" />
          <rect className="auth-stem-card-bg" x="669" y="296" width="82" height="82" rx="23" fill="#E5FFF8" stroke="#68DCC0" strokeWidth="3" />
          <path className="auth-chemistry-vessel" d="m699 311-15 44h52l-15-44h-22Z" fill="url(#auth-flask)" stroke="#26334D" strokeWidth="4" strokeLinejoin="round" />
          <path className="auth-chemistry-liquid" d="m692 337-7 18h50l-7-18h-36Z" fill="#2BCD78" />
          <circle cx="703" cy="330" r="4" fill="#45BEE2" />
          <circle cx="716" cy="345" r="3" fill="#7C3AED" />
          <text x="710" y="373" className="auth-card-label auth-small-label">CHEMISTRY</text>
        </g>

        <g className="auth-stem-card auth-gear-card" aria-label="Technology">
          <g transform="translate(195 337)" fill="#FF4F87">
            <path d="M-5-32h10l3 11 9 4 9-6 7 8-7 9 2 10 10 6-3 10-12-1-8 7-1 12h-11l-3-11-9-4-9 6-7-8 7-9-2-10-10-6 3-10 12 1 8-7 1-12Z" />
            <circle r="9" fill="#fff" />
          </g>
        </g>

        <g
          aria-label="Friendly STEM robot: tap to make it giggle"
          className={`auth-robot${robotGiggles ? ' is-giggling' : ''}`}
          onClick={() => setRobotGiggles(true)}
          onKeyDown={(event) => activateWithKeyboard(event, () => setRobotGiggles(true))}
          role="button"
          tabIndex={0}
        >
          <g className="auth-robot-arm auth-robot-arm-left">
            <path d="m372 374-50 47a18 18 0 0 1-26-25l42-51a19 19 0 0 1 34 19l0 10Z" fill="#fff" stroke="#26334D" strokeWidth="7" strokeLinejoin="round" />
            <circle cx="300" cy="411" r="7" fill="#B5C4E9" />
          </g>
          <g className="auth-robot-arm auth-robot-arm-right">
            <path d="m533 374 50 47a18 18 0 0 0 26-25l-42-51a19 19 0 0 0-34 19l0 10Z" fill="#fff" stroke="#26334D" strokeWidth="7" strokeLinejoin="round" />
            <circle cx="605" cy="411" r="7" fill="#B5C4E9" />
          </g>
          <path d="M451 259v32" stroke="#315BD7" strokeWidth="8" strokeLinecap="round" />
          <circle className="auth-robot-antenna" cx="451" cy="248" r="12" fill="#315BD7" />
          <rect x="352" y="282" width="198" height="153" rx="52" fill="url(#auth-robot)" stroke="#26334D" strokeWidth="8" />
          <rect x="375" y="307" width="152" height="86" rx="30" fill="#111B31" />
          <rect x="386" y="423" width="130" height="90" rx="34" fill="#fff" stroke="#26334D" strokeWidth="8" />
          <g className="auth-robot-eyes" fill="none" stroke="#71F4FF" strokeWidth="9" strokeLinecap="round">
            <path d="M403 353q12-19 24 0" />
            <path d="M475 353q12-19 24 0" />
          </g>
          <path className="auth-robot-smile" d="M426 369q25 22 50 0" fill="none" stroke="#71F4FF" strokeWidth="8" strokeLinecap="round" />
          <path className="auth-robot-laugh" d="M425 364q26 38 52 0q-2 36-26 36t-26-36Z" fill="#71F4FF" />
          <g transform="translate(451 466)">
            <ellipse rx="35" ry="13" fill="none" stroke="#315BD7" strokeWidth="5" transform="rotate(-25)" />
            <ellipse rx="35" ry="13" fill="none" stroke="#F97316" strokeWidth="5" transform="rotate(35)" />
            <circle r="5" fill="#FACC15" />
          </g>
        </g>

        <path className="auth-sparkle" d="m105 270 7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2 7-15Z" fill="#F6C940" />
        <path className="auth-sparkle auth-sparkle-delay" d="m796 122 6 13 14 2-10 9 2 14-12-7-12 7 2-14-10-9 14-2 6-13Z" fill="#E95AA6" />
      </svg>
      <figcaption className="auth-illustration-caption" aria-live="polite">
        {robotGiggles
          ? 'Hee-hee! Every big discovery starts with curiosity.'
          : caption}
      </figcaption>
    </figure>
  )
}
