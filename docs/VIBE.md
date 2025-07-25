# NEaR Retro CRT Aesthetic Guide

## Overall Aesthetic

The NEaR application features a clean, retro-inspired design leveraging a palette of soft, muted tones with vibrant accents. It aims for a functional yet nostalgic feel, reminiscent of vintage computing interfaces but with modern usability. Think late 80s/early 90s computer terminals meets contemporary web design.

## Color Palette

| Color Name               | Hex       | Tailwind Class    | Usage                                              |
| ------------------------ | --------- | ----------------- | -------------------------------------------------- |
| **Cream Pixel Glow**     | `#FAF3E3` | `cream-glow`      | Main backgrounds, cards, input fields             |
| **Sunbleached Coral**    | `#F7797D` | `coral`           | Primary buttons, destructive actions, focus rings |
| **Retro Sunset Gold**    | `#F4B860` | `sunset-gold`     | Accents, highlights, warning states               |
| **Pacific Teal Mist**    | `#59C9A5` | `teal-mist`       | Secondary buttons, success states, scrollbars     |
| **Pastel Fuchsia Buzz**  | `#D881D4` | `fuchsia-buzz`    | Interactive hover states, special accents         |
| **Cool Grape Static**    | `#8D8BE0` | `grape-static`    | Borders, links, outline buttons                   |
| **Shadow Grid Charcoal** | `#2C2C32` | `charcoal`        | Text, dark backgrounds, body background           |

## Layout Architecture

### Desktop/Large Screens (1024px+)
- Main content area divided into two prominent columns
- Left column: "Input Transcript & Configure" 
- Right column: "Analysis Output"
- Both columns centered with ample padding
- Header spans full width

### Mobile/Small Screens (<1024px)
- Two columns stack vertically
- "Input Transcript & Configure" appears above "Analysis Output"
- Full responsive behavior maintained

## Component Styling Guidelines

### Background Strategy
- **Body Background**: Shadow Grid Charcoal (`#2C2C32`) - provides deep, matte dark base
- **Main Sections**: Cream Pixel Glow (`#FAF3E3`) backgrounds in rounded containers
- **Cards**: Cream Pixel Glow with Shadow Grid Charcoal borders

### Border Treatments
- **Header**: Pacific Teal Mist (`#59C9A5`) border
- **Input Section**: Retro Sunset Gold (`#F4B860`) border  
- **Output Section**: Pacific Teal Mist (`#59C9A5`) border
- **Form Elements**: Cool Grape Static (`#8D8BE0`) borders

### Typography
- **Body Text on Dark**: Cream Pixel Glow (`#FAF3E3`)
- **Text in Light Sections**: Shadow Grid Charcoal (`#2C2C32`)
- **Placeholder Text**: Shadow Grid Charcoal at 60% opacity
- **Headings**: Bold, high contrast using primary text colors

### Interactive Elements

#### Primary Action Buttons
- **Background**: Sunbleached Coral (`#F7797D`)
- **Text**: White
- **Hover**: Transitions to Pastel Fuchsia Buzz (`#D881D4`)
- **Effects**: Subtle shadow + slight scale (1.05x) on hover

#### Secondary Action Buttons  
- **Background**: Pacific Teal Mist (`#59C9A5`)
- **Text**: White
- **Hover**: Transitions to Cool Grape Static (`#8D8BE0`)
- **Effects**: Subtle shadow + slight scale (1.05x) on hover

#### Outline Buttons
- **Border**: Cool Grape Static (`#8D8BE0`)
- **Background**: Transparent
- **Text**: Shadow Grid Charcoal (`#2C2C32`)
- **Hover**: Cool Grape Static background with Cream Pixel Glow text

#### Form Controls
- **Input Fields**: 
  - Background: Cream Pixel Glow (`#FAF3E3`)
  - Border: Cool Grape Static (`#8D8BE0`)
  - Text: Shadow Grid Charcoal (`#2C2C32`)
  - Focus: Sunbleached Coral (`#F7797D`) glow ring

- **Dropdowns**:
  - Same styling as input fields
  - Focus: Pacific Teal Mist (`#59C9A5`) glow ring

- **Text Areas**:
  - Same styling as input fields
  - Vertically resizable
  - Focus: Sunbleached Coral (`#F7797D`) glow ring

### Header Design
- **Container**: Wide, rounded-corner header bar
- **Background**: Shadow Grid Charcoal (`#2C2C32`) 
- **Border**: Pacific Teal Mist (`#59C9A5`)
- **Logo**: Stylized pixelated "N" and "E" in Pacific Teal Mist
  - Abstract upward trend element in "E" using Retro Sunset Gold
- **Title**: "NEaR Insights" - Bold, 3xl, Cream Pixel Glow
- **Tagline**: "Your Transcript Analyst" - Smaller, Cream Pixel Glow with slight opacity

### Scrollbar Styling
```css
.scrollbar-retro {
  scrollbar-width: thin;
  scrollbar-color: #59C9A5 #2C2C32; /* teal-mist track / charcoal thumb */
}

.scrollbar-retro::-webkit-scrollbar-thumb:hover {
  background: #F7797D; /* coral on hover */
}
```

## Interactive States

### Focus States
- **Ring Color**: Varies by element type
  - Text inputs: Sunbleached Coral glow
  - Dropdowns: Pacific Teal Mist glow
  - Buttons: 2px offset ring in appropriate color
- **Ring Style**: Semi-transparent, soft glow effect

### Hover Effects
- **Buttons**: Background color transition + 1.05x scale
- **Links**: Color change to hover state
- **Cards**: Subtle shadow enhancement (optional)

### Loading States
- Use existing color palette for spinners/skeleton states
- Subtle animations with retro feel

## Modal/Alert Styling
- **Background**: Cream Pixel Glow (`#FAF3E3`)
- **Text**: Shadow Grid Charcoal (`#2C2C32`)
- **Border**: Sunbleached Coral (`#F7797D`)
- **OK Button**: Sunbleached Coral background with white text
- **Centered positioning with backdrop**

## Animation Guidelines
- **Transition Duration**: 200ms for most interactions
- **Easing**: Smooth, not too bouncy
- **Scale Effects**: Subtle (1.05x max)
- **Color Transitions**: Smooth blending between palette colors

## Accessibility Considerations
- **Contrast Ratios**: All text/background combinations meet WCAG AA standards
- **Focus Indicators**: Clear, visible focus rings on all interactive elements  
- **Color Dependencies**: Never rely solely on color to convey information
- **Interactive Sizing**: Touch targets minimum 44px for mobile

## CSS Custom Properties
```css
:root {
  --cream-glow: #FAF3E3;
  --coral: #F7797D; 
  --sunset-gold: #F4B860;
  --teal-mist: #59C9A5;
  --fuchsia-buzz: #D881D4;
  --grape-static: #8D8BE0;
  --charcoal: #2C2C32;
}
```

## Implementation Notes
- Tailwind classes are available for all palette colors
- CSS custom properties used for shadcn/ui component compatibility
- All interactive elements include hover and focus states
- Responsive breakpoints follow Tailwind defaults
- Custom scrollbar styling available via `.scrollbar-retro` class

## Brand Voice
The visual design should feel:
- **Nostalgic but functional** - Retro without being kitsch
- **Warm and approachable** - Soft colors create welcoming feel
- **Professional yet creative** - Suitable for business use with personality
- **Technically sophisticated** - Appeals to developers and analysts
- **Distinctly "NEaR"** - Unique identity in the financial tech space

This aesthetic guide ensures consistency across all UI elements while maintaining the retro CRT computing vibe that makes NEaR distinctive.