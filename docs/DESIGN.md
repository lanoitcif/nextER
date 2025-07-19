# Design System

## 1. Design Philosophy
The application uses a high-contrast, dark-themed design inspired by retro CRT monitors. The aesthetic is functional and nostalgic, prioritizing legibility and a clean user interface. The entire color and component system is built on a themeable foundation using CSS variables.

## 2. Color Palette and Theming
The application uses a dark theme by default, defined in `app/globals.css`. Colors are managed via CSS variables to ensure consistency.

### Core Theme Colors (`.dark` theme)
| Variable | HSL Value | Description |
|---|---|---|
| `--background` | `240 6% 10%` | Near Black, main page background |
| `--foreground` | `44 50% 94%` | Cream Pixel Glow, primary text color |
| `--card` | `240 6% 13%` | Darker Charcoal, card backgrounds |
| `--primary` | `358 85% 72%` | Sunbleached Coral, for primary buttons and accents |
| `--primary-foreground` | `240 6% 10%` | Near Black, text on primary elements |
| `--secondary` | `158 51% 58%` | Pacific Teal Mist, for secondary buttons |
| `--secondary-foreground` | `240 6% 10%` | Near Black, text on secondary elements |
| `--muted-foreground` | `44 50% 80%` | Lighter Cream, for descriptions and subtitles |
| `--border` | `240 6% 20%` | Charcoal Border, for borders and inputs |
| `--ring` | `358 85% 72%` | Sunbleached Coral, for focus rings |

## 3. Component Library
Components are styled globally in `app/globals.css` and use the CSS theme variables.

- **Buttons (`.btn`, `.btn-primary`, etc.):** Styled with theme colors for high contrast. They use `bg-primary` for the background and `text-primary-foreground` for the text.
- **Cards (`.card`):** Use `bg-card` and `text-card-foreground`.
- **Forms (`.input`, `.select`, `.textarea`):** Styled with `border-input` and transparent backgrounds to blend with their container.

## 4. Accessibility
The new theme was designed with accessibility as a priority.
- **Color Contrast:** All default text and background combinations meet WCAG AA standards. The primary and secondary button styles now use dark text on lighter backgrounds to ensure legibility.
- **Focus Indicators:** All interactive elements have clear, visible focus rings using the `--ring` variable.