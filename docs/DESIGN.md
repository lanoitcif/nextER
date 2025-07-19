# Design System

## 1. Design Philosophy and Aesthetic Guidelines
The NEaR application features a clean, retro-inspired design leveraging a palette of soft, muted tones with vibrant accents. It aims for a functional yet nostalgic feel, reminiscent of vintage computing interfaces but with modern usability.

## 2. Color Palette and Typography

### Color Palette
| Color Name               | Hex       | Tailwind Class    |
| ------------------------ | --------- | ----------------- |
| **Cream Pixel Glow**     | `#FAF3E3` | `cream-glow`      |
| **Sunbleached Coral**    | `#F7797D` | `coral`           |
| **Retro Sunset Gold**    | `#F4B860` | `sunset-gold`     |
| **Pacific Teal Mist**    | `#59C9A5` | `teal-mist`       |
| **Pastel Fuchsia Buzz**  | `#D881D4` | `fuchsia-buzz`    |
| **Cool Grape Static**    | `#8D8BE0` | `grape-static`    |
| **Shadow Grid Charcoal** | `#2C2C32` | `charcoal`        |

### Typography
- **Body Text on Dark**: Cream Pixel Glow (`#FAF3E3`)
- **Text in Light Sections**: Shadow Grid Charcoal (`#2C2C32`)
- **Placeholder Text**: Shadow Grid Charcoal at 60% opacity
- **Headings**: Bold, high contrast using primary text colors

## 3. Component Library and Usage Guidelines

### Global Layout (`app/layout.tsx`)
- **Background**: Main body background color
- **Font**: Global font configuration
- **Meta tags**: Theme colors for mobile browsers

### Landing Page (`app/page.tsx`)
- **Hero Section**: Background gradient, heading and subtitle text colors, CTA button styling.
- **Features Section**: Feature card backgrounds, icon colors, text colors.
- **Footer**: Background color, link colors.

### Authentication Pages (`app/auth/login/page.tsx`, `app/auth/signup/page.tsx`)
- **Form Container**: Card background, headers, form elements, buttons, links, error messages.

### Dashboard Components (`app/dashboard/*`)
- **Header**: Background color, borders, logo/title color, user profile text, navigation buttons.
- **Stats Cards**: Card backgrounds, icon colors, number display colors, label text colors.
- **Action Cards**: "Analyze" and "API Keys" card styling, icon colors, hover states.
- **Recent Activity Section**: List item backgrounds, file icons, provider/model text, timestamp colors, "Owner Key" badges.
- **Owner Key Status**: Status indicator dot, text colors.

## 4. Responsive Design Patterns
- **Mobile (`sm:`)**: Navigation collapse, card layout adjustments, form field sizing, button sizing.
- **Tablet (`md:`)**: Grid layout changes, sidebar visibility, content spacing.
- **Desktop (`lg:`, `xl:`)**: Full layout, maximum content widths, expanded navigation.

## 5. Accessibility Standards
- **Color Contrast**: All text/background combinations meet WCAG AA standards.
- **Focus Indicators**: Clear, visible focus rings on all interactive elements.
- **Color Dependencies**: Never rely solely on color to convey information.
- **Interactive Sizing**: Touch targets minimum 44px for mobile.

## 6. Brand Voice and Messaging
The visual design should feel:
- **Nostalgic but functional**
- **Warm and approachable**
- **Professional yet creative**
- **Technically sophisticated**
- **Distinctly "NEaR"**
