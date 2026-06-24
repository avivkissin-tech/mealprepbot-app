---
name: Vitality Flow
colors:
  surface: '#faf9f7'
  surface-dim: '#dadad8'
  surface-bright: '#faf9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeec'
  surface-container-high: '#e9e8e6'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1b'
  on-surface-variant: '#414943'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#717973'
  outline-variant: '#c0c9c1'
  surface-tint: '#3a674f'
  primary: '#14422d'
  on-primary: '#ffffff'
  primary-container: '#2d5a43'
  on-primary-container: '#9fcfb2'
  inverse-primary: '#a1d1b4'
  secondary: '#625e55'
  on-secondary: '#ffffff'
  secondary-container: '#e8e2d6'
  on-secondary-container: '#68645b'
  tertiary: '#20412b'
  on-tertiary: '#ffffff'
  tertiary-container: '#375941'
  on-tertiary-container: '#a8ceaf'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bceecf'
  primary-fixed-dim: '#a1d1b4'
  on-primary-fixed: '#002112'
  on-primary-fixed-variant: '#224f39'
  secondary-fixed: '#e8e2d6'
  secondary-fixed-dim: '#cbc6ba'
  on-secondary-fixed: '#1e1c14'
  on-secondary-fixed-variant: '#4a473e'
  tertiary-fixed: '#c5eccc'
  tertiary-fixed-dim: '#aad0b1'
  on-tertiary-fixed: '#00210e'
  on-tertiary-fixed-variant: '#2c4e36'
  background: '#faf9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e3e2e0'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style
The design system is anchored in a **Premium Minimalist** aesthetic, tailored for a high-end nutrition and meal-prep experience. It targets health-conscious professionals who value organization and clarity. The brand persona is "The Expert Companion"—professional and precise, yet encouraging and accessible.

The visual language emphasizes "Breathable Precision." This is achieved through generous white space, a reduction of unnecessary decorative elements, and a focus on high-quality food photography. The interface should feel like a high-end wellness editorial: calm, structured, and profoundly clean.

## Colors
This design system utilizes a "Nature-Refined" palette. 

- **Primary (#2D5A43):** A deep, "Forest Kale" green used for brand moments, primary actions, and authoritative typography. It signals expertise and growth.
- **Secondary (#E8E2D6):** A "Warm Linen" neutral used for large surface areas and background groupings to provide an earthy, organic feel that departs from cold digital whites.
- **Tertiary (#84A98C):** A "Soft Sage" used for accents, success states, and secondary functional elements.
- **Neutral (#F9F8F6):** A "Paper White" used for the main background to maintain a crisp, clean editorial look.

Use a high-contrast ratio for text (Primary Green on Paper White) to ensure legibility and a premium feel.

## Typography
The typography system is built on **Inter** for its exceptional legibility and modern, neutral tone. For the Hebrew implementation, the system maps seamlessly to **Assistant** or **Heebo**, maintaining identical weight and scale ratios.

- **Headlines:** Use Bold and Semi-Bold weights with tight tracking (-0.01em to -0.02em) to create a compact, premium "magazine" look.
- **Body:** Use a generous line height (1.5x) to ensure recipes and nutritional data remain easy to scan during meal prep.
- **Labels:** Small caps or tracked-out uppercase labels should be used sparingly for nutritional categories (e.g., "PROTEIN", "CARBS").
- **RTL Support:** Alignment should default to right-aligned for Hebrew, with logical properties (padding-inline-start) used to ensure effortless switching to LTR.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. Content is contained within a 1200px max-width container on desktop, centered on the screen.

- **Grid:** A 12-column grid is used for desktop, 6-column for tablet, and 2-column for mobile.
- **RTL Flow:** The layout starts from the top-right. Navigation bars, sidebars, and form labels must flip their horizontal orientation.
- **Rhythm:** Use the 8px base unit religiously. "Lush" spacing (48px+) should be used between major sections to prevent the UI from feeling cluttered, reinforcing the minimalist brand pillar.

## Elevation & Depth
This design system avoids heavy shadows in favor of **Tonal Layers** and **Ambient Softness**. 

- **Surface Levels:** The base layer is Neutral (#F9F8F6). Cards and containers sit on a pure white (#FFFFFF) surface to create a subtle "lift."
- **Shadows:** Use a single, ultra-diffused shadow style for floating elements (cards, modals). Shadow: `0 8px 32px rgba(45, 90, 67, 0.05)`. Note the subtle green tint in the shadow to maintain color harmony.
- **Interactions:** On hover, cards should slightly lift (increase shadow spread) rather than change color, maintaining a tactile, premium feel.

## Shapes
The shape language is defined by **pronounced, organic curves**. 

- **Main Cards:** Use `rounded-2xl` (1.5rem / 24px) for all primary content containers and meal cards.
- **Interactive Elements:** Buttons and input fields use `rounded-lg` (1rem / 16px) to maintain a softer, approachable aesthetic.
- **Visual Metaphor:** The curves should feel "smooth like a river stone," avoiding sharp geometric corners to align with the wellness/health theme.

## Components
Consistent component styling is critical for a "premium" feel:

- **Meal Cards:** White backgrounds, `2xl` rounding, and the ambient green-tinted shadow. Imagery should occupy the top half with a subtle bottom-fade overlay for text legibility.
- **Buttons:**
    - *Primary:* Forest Green background, White text, Semi-bold.
    - *Secondary:* Warm Linen background, Forest Green text.
- **Nutritional Tables:** Clean, borderless rows using thin `1px` dividers in Secondary (#E8E2D6). Use Primary Green for the numerical data to make it the focal point.
- **Progress Indicators:** Use a "Soft Fill" approach—a light sage track with a forest green fill. Steps should be marked by small, high-contrast dots rather than numbers to reduce visual noise.
- **Inputs:** Soft-grey borders that transition to Forest Green on focus. Labels must be placed above the field, right-aligned for Hebrew.
- **Chips/Badges:** Pill-shaped, using low-opacity versions of the Primary or Tertiary colors (e.g., 10% opacity Sage background with 100% opacity Sage text) for a "glassy" but legible look.