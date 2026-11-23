# STEM Challenge Hub - Design System

## Overview
The STEM Challenge Hub has been redesigned with a modern, premium design system that provides an elegant and professional experience for both teachers and students. The design is optimized for worldwide appeal with a cohesive color palette, smooth interactions, and world-class typography.

## Color Palette

### Primary Colors
- **Primary Blue**: `#3f5bff` - Main brand color for buttons, links, and highlights
- **Primary Dark**: `#2f4be8` - Darker variant for hover states
- **Primary Light**: `#4f6bff` - Lighter variant for backgrounds

### Accent Colors
- **Cyan**: `#06b6d4` - Secondary accent for Technology
- **Orange**: `#f97316` - Accent for Engineering  
- **Purple**: `#8b5cf6` - Accent for Math
- **Green**: `#22c55e` - Success and positive states

### Semantic Colors
- **Success**: `#22c55e` - Positive feedback, correct answers
- **Warning**: `#f59e0b` - Cautionary states, need revision
- **Danger**: `#ef4444` - Error states, incorrect answers
- **Neutral**: `#64748b` - Secondary text, muted states

### Gray Scale
- **Gray-50**: `#f9fafb` - Lightest backgrounds
- **Gray-100**: `#f3f4f6` - Light backgrounds
- **Gray-200**: `#e5e7eb` - Subtle borders
- **Gray-300**: `#d1d5db` - Medium borders
- **Gray-400**: `#9ca3af` - Muted text
- **Gray-500**: `#6b7280` - Secondary text
- **Ink**: `#0f172a` - Primary text color

### Gradients
- **Primary Gradient**: `linear-gradient(135deg, #3f5bff 0%, #4f6bff 50%, #06b6d4 100%)`
- **Hover Gradient**: `linear-gradient(135deg, #2f4be8 0%, #3f5bff 50%, #0891b2 100%)`
- **Success Gradient**: `linear-gradient(135deg, #22c55e 0%, #16a34a 100%)`
- **Accent Gradient**: `linear-gradient(135deg, #f97316 0%, #fb923c 100%)`

## Typography

### Font Family
```css
-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, 'Helvetica Neue', sans-serif
```

### Heading Styles
- **Page Headers (h1)**: Georgia, 2.2rem-3.8rem (clamp), font-weight 500, letter-spacing -0.055em
- **Section Headers (h2)**: Georgia, 1.75rem, font-weight 500, letter-spacing -0.02em
- **Subsection Headers (h3)**: Georgia, 1.45rem, font-weight 500, letter-spacing -0.025em

### Body Text
- **Regular**: 0.85rem, font-weight 400, line-height 1.6
- **Medium**: 0.85rem, font-weight 600
- **Bold**: 0.85rem, font-weight 700

### Labels & Metadata
- **Labels**: 0.7-0.8rem, font-weight 700, letter-spacing 0.03-0.05em, uppercase
- **Helper Text**: 0.7rem, font-weight 500

## Component Library

### Buttons

#### Primary Button
```css
background: var(--gradient-primary);
color: white;
padding: 0.65rem 1.2rem;
border-radius: 0.75rem;
min-height: 2.6rem;
box-shadow: 0 4px 12px rgba(63, 91, 255, 0.3);
transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
```
- **Hover**: Elevated shadow, translateY(-2px)
- **Active**: No translation

#### Secondary Button
```css
border: 1.5px solid var(--line);
background: white;
color: var(--ink);
box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
```
- **Hover**: Border changes to primary color, background becomes blue-tint

#### Quiet Button
- Transparent background
- Hover: Gray-100 background
- Used for less prominent actions

### Cards

#### Challenge Card
```css
padding: 1.3rem;
border: 1px solid var(--line);
border-radius: 1rem;
background: white;
box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
transition: all 200ms ease;
```
- **Hover**: 
  - Box shadow increases to 0 8px 24px rgba(15, 23, 42, 0.08)
  - Border color changes to primary
  - Transform: translateY(-2px)

#### Student Challenge Card
- Same as challenge card
- Larger cards (22rem wide)
- Used for individual challenge display

### Forms

#### Input Fields
```css
border: 1.5px solid var(--line);
border-radius: 0.8rem;
padding: 0.65rem 0.9rem;
min-height: 2.8rem;
font-size: 0.85rem;
transition: all 150ms ease;
```
- **Placeholder**: #cbd5e1
- **Hover**: Border lightens, background becomes blue-tint
- **Focus**: 
  - Border becomes primary color
  - Box-shadow: 0 0 0 3px rgba(63, 91, 255, 0.1)

#### Checkboxes & Radios
- `accent-color: var(--primary)`
- Applies gradient primary throughout

### Status & Feedback

#### Success Feedback
```css
border: 1.5px solid var(--success);
background: linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.03));
color: #15803d;
padding: 1rem 1.2rem;
border-radius: 0.9rem;
```

#### Warning Feedback
- Border: `#f59e0b`
- Color: `#92400e`
- Similar gradient background

#### Error Feedback
- Border: `#ef4444`
- Color: `#991b1b`
- Similar gradient background

### Status Pills
```css
padding: 0.3rem 0.7rem;
border-radius: 999px;
font-size: 0.65rem;
font-weight: 700;
letter-spacing: 0.03em;
border: 1px solid;
```

**Live**: Green gradient background, green border
**Draft**: Gray gradient background, gray border
**Correct**: Green gradient
**Incorrect**: Red gradient

### Progress Tables
```css
border-radius: 1rem;
box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
```
- **Header Background**: Gradient from blue-tint to cyan tint
- **Header Text**: Primary color, uppercase, 0.7rem
- **Rows Hover**: Background becomes blue-tint

### Summary Cards
```css
padding: 1.2rem;
border: 1px solid var(--line);
border-radius: 1rem;
min-height: 7rem;
transition: all 200ms ease;
```
- **Hover**: 
  - Box shadow increases
  - Border becomes primary
  - Transform: translateY(-2px)

## Spacing System

### Base Unit: 0.25rem (4px)

### Common Spacing Values
- **XS**: 0.5rem (2 units)
- **SM**: 0.75rem (3 units)
- **MD**: 1rem (4 units)
- **LG**: 1.2rem (5 units)
- **XL**: 1.5rem (6 units)
- **2XL**: 2rem (8 units)
- **3XL**: 3rem (12 units)

### Applied Usage
- **Button Padding**: 0.65rem vertical, 1.2rem horizontal
- **Card Padding**: 1.3-1.5rem
- **Field Padding**: 0.65rem vertical, 0.9rem horizontal
- **Gap between Cards**: 1-1.5rem
- **Section Padding**: 3rem vertical, clamp(1.5rem, 5vw, 4.5rem) horizontal

## Border Radius

- **Small**: 0.6-0.7rem (inputs, small elements)
- **Medium**: 0.8-0.9rem (cards, common components)
- **Large**: 1rem-1.3rem (modals, large cards)
- **Full**: 999px (pills, badges)

## Shadows

### Subtle Shadow
```css
box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
```
Used on: Cards at rest, inputs, tables

### Medium Shadow
```css
box-shadow: 0 4px 12px rgba(63, 91, 255, 0.2);
```
Used on: Buttons, active states, branded elements

### Large Shadow
```css
box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
```
Used on: Hover states for cards, elevated elements

### Modal Shadow
```css
box-shadow: 0 20px 60px rgba(15, 23, 42, 0.3);
```
Used on: Modals, overlays

## Animations & Transitions

### Transition Timing
- **Fast**: 150ms (simple state changes like color)
- **Standard**: 200ms (most interactive elements)
- **Slow**: 250ms (modals and significant changes)

### Easing Functions
- **Standard**: `ease` (default)
- **Smooth**: `cubic-bezier(0.34, 1.56, 0.64, 1)` (bounce effect for buttons)

### Keyframe Animations

#### feedback-arrive
```css
@keyframes feedback-arrive {
  from { transform: translateY(4px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
Duration: 220ms ease-out
```

#### modal-slide
```css
@keyframes modal-slide {
  from { transform: scale(0.95) translateY(10px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}
Duration: 250ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

#### backdrop-fade
```css
@keyframes backdrop-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
Duration: 200ms ease-out
```

#### notice-slide
```css
@keyframes notice-slide {
  from { transform: translateX(-10px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
Duration: 200ms ease-out
```

## Subject Color Codes

Each subject has its own gradient and icon:

### Science (Green)
- **Primary**: `#22c55e`
- **Background Gradient**: Green to darker green
- **Icon**: ⚛ (atom)

### Technology (Cyan)
- **Primary**: `#06b6d4`
- **Background Gradient**: Cyan to darker cyan
- **Icon**: ⚙ (gear)

### Engineering (Orange)
- **Primary**: `#f97316`
- **Background Gradient**: Orange to darker orange
- **Icon**: ⚒ (tools)

### Math (Purple)
- **Primary**: `#8b5cf6`
- **Background Gradient**: Purple to darker purple
- **Icon**: ∑ (sum symbol)

## Responsive Design

### Breakpoints
- **Mobile**: < 600px
- **Tablet**: 600px - 1024px
- **Desktop**: > 1024px

### Key Responsive Behaviors
- **Main Padding**: `clamp(1.5rem, 5vw, 4.5rem)` (scales with viewport)
- **Font Sizes**: Use `clamp()` for fluid scaling
- **Grid Columns**: Use `repeat(auto-fit, minmax(value, 1fr))` for auto-layout
- **Card Layout**: Stacks on mobile, 2-3 columns on tablet/desktop

## Accessibility

### Color Contrast
- All text meets WCAG AA standards (4.5:1 for normal text)
- Status information is not conveyed by color alone
- Focus states are clearly visible (3px outline at 0.3 offset)

### Focus Indicators
```css
button:focus-visible,
a:focus-visible {
  outline: 3px solid rgb(49 85 233 / 38%);
  outline-offset: 3px;
}
```

### Selection Styling
```css
::selection {
  background: #dbe5ff;
  color: #0f172a;
}
```

### Form Labels
- Always associated with form inputs
- Not positioned using placeholder text alone

## Best Practices

### When Adding New Components
1. Use semantic color tokens (e.g., `var(--primary)`, `var(--success)`)
2. Maintain 0.75-1rem border-radius for consistency
3. Apply subtle shadows for depth (use the shadow scale)
4. Include smooth transitions (150-250ms)
5. Test contrast ratios for accessibility
6. Use gradients for visual interest on primary elements

### Typography Hierarchy
1. Use Georgia serif for all headings (h1, h2, h3)
2. Use system sans-serif for body text
3. Maintain consistent font-weight (500 for headings, 400-700 for body)
4. Use letter-spacing for visual impact on headings

### Interactive Elements
1. All buttons should have clear hover states
2. Provide visual feedback for form inputs
3. Use gradients for primary actions
4. Keep secondary actions subtle

## Migration Notes

### From Previous Design
- Old green (`#3155e9`) → New primary blue (`#3f5bff`)
- Old borders → Increased to 1.5px for prominence
- Old shadows → Strengthened for better depth
- Old padding → Standardized across components
- Old border-radius → Increased to 0.75rem+ for modern feel

## References

- **Font**: Inter for body, Georgia for headers
- **Color Inspiration**: Modern SaaS applications
- **Spacing**: 4px base unit system
- **Shadows**: Material Design shadow scale
- **Interactions**: Spring/bounce easing for delight
