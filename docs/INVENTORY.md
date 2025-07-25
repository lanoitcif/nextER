# UI Element Inventory

## Overview
This document provides a comprehensive inventory of all UI elements by location throughout the NEaR application to ensure consistency when making aesthetic changes.

## Color Palette Reference
- **Cream Pixel Glow**: `#FAF3E3` / `cream-glow`
- **Sunbleached Coral**: `#F7797D` / `coral`
- **Retro Sunset Gold**: `#F4B860` / `sunset-gold`
- **Pacific Teal Mist**: `#59C9A5` / `teal-mist`
- **Pastel Fuchsia Buzz**: `#D881D4` / `fuchsia-buzz`
- **Cool Grape Static**: `#8D8BE0` / `grape-static`
- **Shadow Grid Charcoal**: `#2C2C32` / `charcoal`

## Layout Components

### Global Layout (`app/layout.tsx`)
- **Background**: Main body background color
- **Font**: Global font configuration
- **Meta tags**: Theme colors for mobile browsers

### Global Styles (`app/globals.css`)
- **CSS Variables**: Root color definitions
- **Component Classes**: 
  - `.card`, `.card-header`, `.card-title`, `.card-description`, `.card-content`
  - `.btn-primary`, `.btn-secondary`, `.btn-ghost`
  - `.input` class for form inputs

## Page Components

### Landing Page (`app/page.tsx`)
- **Hero Section**: 
  - Background gradient
  - Main heading text color
  - Subtitle text color
  - CTA button styling
- **Features Section**:
  - Feature card backgrounds
  - Icon colors
  - Text colors
- **Footer**: 
  - Background color
  - Link colors

### Authentication Pages

#### Login Page (`app/auth/login/page.tsx`)
- **Background**: Page background
- **Form Container**: Card background
- **Headers**: Main title and subtitle colors
- **Form Elements**:
  - Input field backgrounds and borders
  - Focus states
  - Placeholder text colors
- **Buttons**: Primary login button
- **Links**: Navigation links between login/signup
- **Error Messages**: Error state styling

#### Signup Page (`app/auth/signup/page.tsx`)
- **Background**: Page background
- **Form Container**: Card background
- **Headers**: Title and navigation text
- **Form Elements**:
  - Input fields (name, email, password)
  - Labels and placeholders
  - Focus and validation states
- **Buttons**: Create account button
- **Success States**: Email verification message
- **Links**: Back to login links

## Dashboard Components

### Main Dashboard (`app/dashboard/page.tsx`)
- **Header**:
  - Background color and borders
  - NEaR logo/title color
  - User profile text
  - Navigation buttons (Admin, Settings, Sign Out)
- **Stats Cards**:
  - Card backgrounds
  - Icon colors for each stat type
  - Number display colors
  - Label text colors
- **Action Cards**:
  - "Analyze" and "API Keys" card styling
  - Icon colors
  - Hover states
- **Recent Activity Section**:
  - List item backgrounds
  - File icons
  - Provider/model text
  - Timestamp colors
  - "Owner Key" badges
- **Owner Key Status**:
  - Status indicator dot
  - Text colors

### Analysis Page (`app/dashboard/analyze/page.tsx`)
- **Header**: Page title and navigation
- **Form Elements**:
  - Ticker input field
  - Company selection dropdown
  - Analysis type dropdown
  - Provider selection
  - Model selection
  - API key input
- **Buttons**: 
  - Submit button
  - Clear/reset buttons
- **Result Display**:
  - Analysis result container
  - Code syntax highlighting
  - Copy buttons
- **Error/Success Messages**:
  - Status message styling
  - Loading states

### API Keys Page (`app/dashboard/api-keys/page.tsx`)
- **Header**: Page title and add button
- **API Key Cards**:
  - Card backgrounds
  - Provider icons and colors
  - Key nickname text
  - Status indicators
  - Action buttons (edit, delete)
- **Add/Edit Forms**:
  - Modal/form backgrounds
  - Input field styling
  - Dropdown selections
  - Save/cancel buttons

### Settings Page (`app/dashboard/settings/page.tsx`)
- **Profile Section**:
  - User info display
  - Edit profile forms
- **Preferences**:
  - Setting toggles
  - Configuration options
- **Account Management**:
  - Change password forms
  - Account deletion options

## Admin Components

### Admin Dashboard (`app/dashboard/admin/page.tsx`)
- **Header**:
  - Page title and back navigation
  - Admin-specific styling
- **Stats Grid**:
  - Total users card
  - API keys card
  - Usage statistics cards
  - Icon backgrounds and colors
- **Admin Action Cards**:
  - API Key Management
  - User Management
  - Usage Analytics
  - Hover effects and transitions

### Admin API Keys (`app/dashboard/admin/api-keys/page.tsx`)
- **Header**:
  - Page title and assign button
- **Assign Key Form**:
  - User selection dropdown
  - Provider selection
  - Model selection dropdown
  - API key input field
  - Nickname field
  - Submit/cancel buttons
- **API Key List**:
  - Key item cards
  - User information display
  - Provider and model info
  - Assignment date
  - Delete buttons
- **Status Messages**:
  - Success notifications
  - Error alerts
- **Empty States**:
  - No keys found message
  - Icon styling

### Admin User Management (`app/dashboard/admin/users/page.tsx`)
- **User List**: User cards and information
- **Permission Controls**: Admin toggles and settings
- **User Statistics**: Individual user metrics

### Admin Usage Analytics (`app/dashboard/admin/usage/page.tsx`)
- **Charts and Graphs**: Data visualization components
- **Usage Metrics**: Cost and token statistics
- **Time Period Filters**: Date range selectors

## Component States

### Interactive States
- **Hover**: All interactive elements
- **Focus**: Form inputs and buttons
- **Active**: Pressed states
- **Disabled**: Inactive elements
- **Loading**: Spinner and skeleton states

### Form States
- **Default**: Normal input appearance
- **Valid**: Success indicators
- **Invalid**: Error highlighting
- **Required**: Field validation indicators

### Navigation States
- **Current Page**: Active navigation items
- **Breadcrumbs**: Navigation path indicators
- **Back Buttons**: Consistent back navigation

## Responsive Breakpoints

### Mobile (`sm:`)
- Navigation collapse
- Card layout adjustments
- Form field sizing
- Button sizing

### Tablet (`md:`)
- Grid layout changes
- Sidebar visibility
- Content spacing

### Desktop (`lg:`, `xl:`)
- Full layout
- Maximum content widths
- Expanded navigation

## Accessibility Considerations

### Color Contrast
- Text on background ratios
- Interactive element visibility
- Focus indicators

### Interactive Elements
- Button sizing (minimum 44px touch targets)
- Focus ring styling
- Keyboard navigation support

## Theme Configuration

### Tailwind Config (`tailwind.config.js`)
- Custom color definitions
- Component utility classes
- Responsive breakpoints
- Plugin configurations

### CSS Custom Properties
- Color variable definitions
- Component-specific styling
- Dark/light mode support (if implemented)

## Checklist for Design Changes

When making aesthetic changes, verify updates in:

- [ ] Global CSS variables and component classes
- [ ] Tailwind configuration
- [ ] Landing page hero and features
- [ ] Authentication forms (login/signup)
- [ ] Main dashboard stats and navigation
- [ ] Analysis page form elements
- [ ] API keys management
- [ ] Admin dashboard and all admin pages
- [ ] Error and success message styling
- [ ] Loading states and empty states
- [ ] Mobile responsive layouts
- [ ] Focus and hover states
- [ ] Accessibility compliance

## Last Updated
July 17, 2025 - Initial inventory creation during retro CRT color palette implementation