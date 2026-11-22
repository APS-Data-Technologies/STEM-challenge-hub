import { useEffect, useState } from 'react'
import type { KeyboardEvent } from 'react'

const equations = [
  ['3 + 4 =', '7'],
  ['9 − 5 =', '4'],
  ['6 × 3 =', '18'],
  ['20 ÷ 4 =', '5'],
  ['8 + 7 =', '15'],
]

const stemSubjects = [
  { letter: 'S', subject: 'Science' },
  { letter: 'T', subject: 'Technology' },
  { letter: 'E', subject: 'Engineering' },
  { letter: 'M', subject: 'Maths' },
] as const

const physicsColors = [
  { name: 'blue', value: '#3185FF' },
  { name: 'violet', value: '#A855F7' },
  { name: 'red', value: '#FF595E' },
  { name: 'orange', value: '#FF924C' },
  { name: 'yellow', value: '#FFD83D' },
  { name: 'green', value: '#28C77A' },
] as const

export function AuthIllustration() {
  const [equationIndex, setEquationIndex] = useState(0)
  const [chemistryActive, setChemistryActive] = useState(false)
  const [biologyActive, setBiologyActive] = useState(false)
  const [biologyHovered, setBiologyHovered] = useState(false)
  const [physicsColorIndex, setPhysicsColorIndex] = useState<number | null>(null)
  const [robotGiggles, setRobotGiggles] = useState(false)
  const [stemSequenceStep, setStemSequenceStep] = useState<number | null>(null)
  const [showEngineeringRocket, setShowEngineeringRocket] = useState(false)
  const [showScienceMicroscope, setShowScienceMicroscope] = useState(false)
  const [showTechnologyLaptop, setShowTechnologyLaptop] = useState(false)
  const [manualCards, setManualCards] = useState({ science: false, technology: false, engineering: false, maths: false })
  const [cardCaption, setCardCaption] = useState('')
  const caption =
    stemSequenceStep !== null
      ? `${stemSubjects[stemSequenceStep].letter} — ${stemSubjects[stemSequenceStep].subject}`
      : cardCaption || 'Tap a STEM card to explore, or tap the robot to see S—T—E—M!'

  useEffect(() => {
    if (manualCards.maths) return
    const timer = window.setInterval(() => {
      setEquationIndex((index) => (index + 1) % equations.length)
    }, 2400)
    return () => window.clearInterval(timer)
  }, [manualCards.maths])

  useEffect(() => {
    if (manualCards.science) return
    const timer = window.setInterval(() => {
      setShowScienceMicroscope((showMicroscope) => !showMicroscope)
    }, 1800)
    return () => window.clearInterval(timer)
  }, [manualCards.science])

  useEffect(() => {
    if (manualCards.technology) return
    const timer = window.setInterval(() => {
      setShowTechnologyLaptop((showLaptop) => !showLaptop)
    }, 2600)
    return () => window.clearInterval(timer)
  }, [manualCards.technology])

  useEffect(() => {
    if (manualCards.engineering) return
    const timer = window.setInterval(() => {
      setShowEngineeringRocket((showRocket) => !showRocket)
    }, 3400)
    return () => window.clearInterval(timer)
  }, [manualCards.engineering])

  useEffect(() => {
    if (!robotGiggles) return
    const timer = window.setTimeout(() => setRobotGiggles(false), 900)
    return () => window.clearTimeout(timer)
  }, [robotGiggles])

  useEffect(() => {
    if (stemSequenceStep === null) return
    const timer = window.setTimeout(() => {
      setStemSequenceStep((step) =>
        step === null || step === stemSubjects.length - 1 ? null : step + 1,
      )
    }, 700)
    return () => window.clearTimeout(timer)
  }, [stemSequenceStep])

  function playStemSequence() {
    setCardCaption('')
    setRobotGiggles(true)
    setStemSequenceStep(0)
  }

  function exploreCard(card: 'science' | 'technology' | 'engineering' | 'maths') {
    setStemSequenceStep(null)
    setRobotGiggles(false)
    setManualCards((current) => ({ ...current, [card]: true }))
    if (card === 'science') {
      setShowScienceMicroscope((current) => !current)
      setCardCaption('Science: explore the planet and the microscope. Tap again to switch.')
    } else if (card === 'technology') {
      setShowTechnologyLaptop((current) => !current)
      setCardCaption('Technology: explore the gear and the laptop. Tap again to switch.')
    } else if (card === 'engineering') {
      setShowEngineeringRocket((current) => !current)
      setCardCaption('Engineering: explore the flying car and the rocket. Tap again to switch.')
    } else {
      setEquationIndex((current) => (current + 1) % equations.length)
      setCardCaption('Maths: tap again to see another problem.')
    }
  }

  function toggleBiology() {
    setStemSequenceStep(null)
    setRobotGiggles(false)
    setCardCaption(biologyActive ? 'Biology: tap the cell to change its colors again.' : 'Biology in motion! Tap the cell to reset its colors.')
    setBiologyActive((active) => !active)
  }

  function toggleChemistry() {
    setStemSequenceStep(null)
    setRobotGiggles(false)
    setCardCaption(chemistryActive ? 'Chemistry: the flask is reset. Tap to experiment again.' : 'Chemistry experiment ready! Tap the flask to reset it.')
    setChemistryActive((active) => !active)
  }

  function changePhysicsColor() {
    const next = physicsColorIndex === null ? 0 : (physicsColorIndex + 1) % physicsColors.length
    setStemSequenceStep(null)
    setRobotGiggles(false)
    setPhysicsColorIndex(next)
    setCardCaption(`Physics: the light is ${physicsColors[next].name}. Tap again to change its color.`)
  }

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
  const physicsColor = physicsColorIndex === null ? null : physicsColors[physicsColorIndex]

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
          <path d="M450 276 450 160" />
          <path d="m494 279 141-85" />
          <path d="m537 312 163-12" />
          <path d="m523 417 117-18" />
          <path d="m377 417-117-18" />
          <path d="m363 330-163-30" />
          <path d="m398 279-168-99" />
        </g>
        <g fill="#fff" stroke="#7485FF" strokeWidth="3">
          <circle className="auth-float" cx="304" cy="259" r="6" />
          <circle className="auth-float auth-delay" cx="414" cy="203" r="5" />
          <circle className="auth-float" cx="598" cy="258" r="6" />
          <circle className="auth-float auth-delay" cx="294" cy="462" r="5" />
          <circle className="auth-float" cx="629" cy="455" r="6" />
        </g>

        <g transform="translate(255 -87)">
          <g className={`auth-stem-card auth-interactive-card auth-planet-card${stemSequenceStep === 0 ? ' is-sequence-active' : ''}`} aria-label="Science: switch between the planet and microscope" onClick={() => exploreCard('science')} onKeyDown={(event) => activateWithKeyboard(event, () => exploreCard('science'))} role="button" tabIndex={0}>
            <circle cx="195" cy="187" r="78" fill="#2CD7F2" fillOpacity=".2" />
            <rect className="auth-stem-card-bg" x="135" y="127" width="120" height="120" rx="30" fill="#E5FCFF" stroke="#69DDF0" strokeWidth="3" />
            <g className={`auth-cycle-image${showScienceMicroscope ? '' : ' is-visible'}`} aria-hidden="true">
              <circle cx="195" cy="180" r="33" fill="url(#auth-planet)" />
              <path d="M174 178c9-9 18-8 26-2 8 4 15 4 22-1m-40 15c8-6 15-6 23-1" fill="none" stroke="#C8FF58" strokeWidth="5" strokeLinecap="round" />
            </g>
            <g className={`auth-cycle-image${showScienceMicroscope ? ' is-visible' : ''}`} aria-hidden="true">
              <g transform="translate(195 180) scale(1.15)" fill="none" stroke="#7C3AED" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                <path d="m-8-17 13 13m-8-18 17 17m-4-4-10 10m-7 4h27m-8-10 7 10m-18 0 5-12" />
                <circle cx="-10" cy="-19" r="4" fill="#F97316" stroke="none" />
                <path d="M-1-3h10" stroke="#2CD7F2" />
              </g>
            </g>
            <text x="195" y="232" className="auth-card-label">SCIENCE</text>
          </g>
        </g>

        <g transform="translate(363 195)">
          <g className={`auth-stem-card auth-interactive-card auth-rocket-card${stemSequenceStep === 2 ? ' is-sequence-active' : ''}`} aria-label="Engineering: switch between the flying car and rocket" onClick={() => exploreCard('engineering')} onKeyDown={(event) => activateWithKeyboard(event, () => exploreCard('engineering'))} role="button" tabIndex={0}>
            <circle cx="397" cy="105" r="70" fill="#FF6795" fillOpacity=".18" />
            <rect className="auth-stem-card-bg" x="341" y="49" width="112" height="112" rx="29" fill="#FFF0F4" stroke="#FF91AE" strokeWidth="3" />
            <g className={`auth-engineering-vehicle${showEngineeringRocket ? '' : ' is-visible'}`} aria-hidden="true">
              <g transform="translate(397 101) scale(1.08) translate(-397 -101)">
                <path d="M354 96h86m-76-6 8-7m50 7-8-7" fill="none" stroke="#8A5CF6" strokeWidth="3" strokeLinecap="round" />
                <circle cx="359" cy="96" r="8" fill="#D9F7FF" stroke="#26334D" strokeWidth="3" />
                <circle cx="435" cy="96" r="8" fill="#D9F7FF" stroke="#26334D" strokeWidth="3" />
                <path d="M360 105h74l-7 11h-59l-8-11Z" fill="#FF6172" stroke="#26334D" strokeWidth="3" strokeLinejoin="round" />
                <path d="m374 104 8-13h26l12 13h-46Z" fill="#B9F0FF" stroke="#26334D" strokeWidth="3" strokeLinejoin="round" />
                <path d="M390 92v11m20-10 7 10" stroke="#fff" strokeWidth="2" />
                <circle cx="377" cy="118" r="3" fill="#2451D4" />
                <circle cx="417" cy="118" r="3" fill="#2451D4" />
                <path d="M380 123v7m34-7v7" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
              </g>
            </g>
            <g className={`auth-engineering-vehicle${showEngineeringRocket ? ' is-visible' : ''}`} aria-hidden="true">
              <g transform="translate(397 101) scale(1.08) rotate(34)">
                <path d="M-15 17c0-22 6-48 15-63 9 15 15 41 15 63a15 15 0 1 1-30 0Z" fill="#fff" stroke="#26334D" strokeWidth="3" />
                <path d="M-15 10h30v18a15 15 0 0 1-30 0V10Z" fill="#FF6172" />
                <circle cy="1" r="6" fill="#2451D4" />
                <path d="m-14 21-12 13 13-3m27-10 12 13-13-3" fill="#F59E0B" />
                <path d="M-5 34 0 45l5-11Z" fill="#FFB020" />
              </g>
            </g>
            <text x="397" y="151" className="auth-card-label">ENGINEERING</text>
          </g>
        </g>

        <g transform="translate(-450 273)">
          <g className={`auth-stem-card auth-interactive-card auth-physics-card${physicsColor ? ' is-manual' : ''}${stemSequenceStep === 0 ? ' is-sequence-active' : ''}`} aria-label="Physics lightbulb: change its rainbow color" onClick={changePhysicsColor} onKeyDown={(event) => activateWithKeyboard(event, changePhysicsColor)} role="button" tabIndex={0}>
            <circle className="auth-physics-glow" cx="710" cy="187" r="78" fill={physicsColor?.value ?? '#FFC83D'} fillOpacity=".22" />
            <rect className="auth-stem-card-bg auth-physics-card-bg" x="650" y="127" width="120" height="120" rx="30" fill="#FFF9DA" stroke="#F1CB52" strokeWidth="3" />
            <g transform="translate(0 -14)">
              <g transform="translate(710 190) scale(0.9) translate(-710 -190)">
              <path className="auth-physics-bulb" d="M710 157a30 30 0 0 0-19 53c7 5 8 12 8 17h22c0-5 1-12 8-17a30 30 0 0 0-19-53Z" fill={physicsColor?.value ?? '#FFD83D'} stroke="#26334D" strokeWidth="4" />
              <path d="M701 228h18m-15 9h12m-9 8h6" stroke="#8291A8" strokeWidth="4" strokeLinecap="round" />
              <path className="auth-physics-rays" d="M710 145v-8m-39 24-7-6m85 6 7-6" stroke={physicsColor?.value ?? '#E8B926'} strokeWidth="4" strokeLinecap="round" />
              </g>
            </g>
            <text x="710" y="232" className="auth-card-label">PHYSICS</text>
          </g>
        </g>

        <g transform="translate(444 -33)">
          <g className={`auth-stem-card auth-interactive-card auth-math-card${stemSequenceStep === 3 ? ' is-sequence-active' : ''}`} aria-label="Maths: show another problem" onClick={() => exploreCard('maths')} onKeyDown={(event) => activateWithKeyboard(event, () => exploreCard('maths'))} role="button" tabIndex={0}>
            <circle cx="196" cy="493" r="78" fill="#647BFF" fillOpacity=".2" />
            <rect className="auth-stem-card-bg" x="135" y="432" width="122" height="122" rx="29" fill="#EEF0FF" stroke="#9299FF" strokeWidth="3" />
            <rect x="148" y="446" width="96" height="63" rx="15" fill="#DCE5FF" />
            <text className="auth-math-equation" x="196" y="485" textLength="84" lengthAdjust="spacingAndGlyphs">
              {problem} <tspan fill="#7152CD">{answer}</tspan>
            </text>
            <text x="196" y="532" className="auth-card-label">MATHS</text>
          </g>
        </g>

        <g transform="translate(-568 -193)">
          <g
            aria-label="Biology cell: hover or activate to change its colors and rotate horizontally"
            aria-pressed={biologyActive}
            className={`auth-stem-card auth-interactive-card auth-biology-card${biologyActive ? ' is-active' : ''}${stemSequenceStep === 0 ? ' is-sequence-active' : ''}`}
            onClick={toggleBiology}
            onMouseEnter={() => setBiologyHovered(true)}
            onMouseLeave={() => setBiologyHovered(false)}
            onKeyDown={(event) => activateWithKeyboard(event, toggleBiology)}
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
        </g>

        <g transform="translate(-480 -197)">
          <g
            aria-label="Chemistry flask: hover or activate to change its color"
            aria-pressed={chemistryActive}
            className={`auth-stem-card auth-interactive-card auth-chemistry-card${chemistryActive ? ' is-active' : ''}${stemSequenceStep === 0 ? ' is-sequence-active' : ''}`}
            onClick={toggleChemistry}
            onKeyDown={(event) => activateWithKeyboard(event, toggleChemistry)}
            role="button"
            tabIndex={0}
          >
          <circle cx="710" cy="337" r="63" fill="#20D9B0" fillOpacity=".2" />
          <rect className="auth-stem-card-bg" x="660" y="287" width="100" height="100" rx="26" fill="#E5FFF8" stroke="#68DCC0" strokeWidth="3" />
          <g transform="translate(710 333) scale(1.12) translate(-710 -333)">
            <path className="auth-chemistry-vessel" d="m699 311-15 44h52l-15-44h-22Z" fill="url(#auth-flask)" stroke="#26334D" strokeWidth="4" strokeLinejoin="round" />
            <path className="auth-chemistry-liquid" d="m692 337-7 18h50l-7-18h-36Z" fill="#2BCD78" />
            <circle cx="703" cy="330" r="4" fill="#45BEE2" />
            <circle cx="716" cy="345" r="3" fill="#7C3AED" />
          </g>
          <text x="710" y="373" className="auth-card-label auth-small-label">CHEMISTRY</text>
          </g>
        </g>

        <g transform="translate(475 -197)">
          <g className={`auth-stem-card auth-interactive-card auth-gear-card${stemSequenceStep === 1 ? ' is-sequence-active' : ''}`} aria-label="Technology: switch between the gear and laptop" onClick={() => exploreCard('technology')} onKeyDown={(event) => activateWithKeyboard(event, () => exploreCard('technology'))} role="button" tabIndex={0}>
            <circle cx="195" cy="337" r="70" fill="#FF6795" fillOpacity=".18" />
            <rect className="auth-stem-card-bg" x="139" y="281" width="112" height="112" rx="29" fill="#FFF0F4" stroke="#FF91AE" strokeWidth="3" />
            <g className={`auth-cycle-image${showTechnologyLaptop ? '' : ' is-visible'}`}>
              <g transform="translate(195 325)" fill="#FF4F87">
                <path d="M-5-32h10l3 11 9 4 9-6 7 8-7 9 2 10 10 6-3 10-12-1-8 7-1 12h-11l-3-11-9-4-9 6-7-8 7-9-2-10-10-6 3-10 12 1 8-7 1-12Z" />
                <circle r="9" fill="#fff" />
              </g>
            </g>
            <g className={`auth-cycle-image${showTechnologyLaptop ? ' is-visible' : ''}`} aria-hidden="true">
              <g transform="translate(195 325)" fill="none" stroke="#2451D4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="-22" y="-19" width="44" height="32" rx="4" fill="#D9F7FF" />
                <path d="M-28 21h56l-5-8h-46l-5 8Z" fill="#8A5CF6" />
                <path d="M-12-9h24m-24 8H7" stroke="#FF4F87" strokeWidth="3" />
              </g>
            </g>
            <text x="195" y="382" className="auth-card-label">TECHNOLOGY</text>
          </g>
        </g>

        <g
          aria-label="Friendly STEM robot: tap to play the Science, Technology, Engineering, Math sequence"
          className={`auth-robot${robotGiggles ? ' is-giggling' : ''}`}
          onClick={playStemSequence}
          onKeyDown={(event) => activateWithKeyboard(event, playStemSequence)}
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
          <g className="auth-robot-logo" aria-label="STEM logo">
            <text className={stemSequenceStep === 0 ? 'is-sequence-active' : ''} x="421" y="475">S</text>
            <text className={stemSequenceStep === 1 ? 'is-sequence-active' : ''} x="441" y="475">T</text>
            <text className={stemSequenceStep === 2 ? 'is-sequence-active' : ''} x="461" y="475">E</text>
            <text className={stemSequenceStep === 3 ? 'is-sequence-active' : ''} x="481" y="475">M</text>
          </g>
        </g>

        <path className="auth-sparkle" d="m85 400 7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2 7-15Z" fill="#F6C940" />
        <path className="auth-sparkle auth-sparkle-delay" d="m796 122 6 13 14 2-10 9 2 14-12-7-12 7 2-14-10-9 14-2 6-13Z" fill="#E95AA6" />
      </svg>
      <figcaption className="auth-illustration-caption" aria-live="polite">
        {stemSequenceStep !== null
          ? caption
          : robotGiggles
          ? 'Hee-hee! Every big discovery starts with curiosity.'
          : caption}
      </figcaption>
    </figure>
  )
}
