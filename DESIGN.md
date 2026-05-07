# NirnayAI Design System v2.0
## Institutional SaaS for Government Procurement

This document outlines the visual identity and design tokens for the NirnayAI platform, a professional SaaS application tailored for the CRPF and other government institutions.

---

### 1. Core Visual Philosophy
*   **Institutional Trust**: A "Government-Grade" aesthetic that prioritizes authority, clarity, and security.
*   **Sharp Modernism**: Zero rounded corners. High-contrast layouts with professional spacing.
*   **Transparent Logic**: Every UI element should feel deterministic and structured, reflecting the platform's rule-based AI engine.

---

### 2. Design Tokens

#### **Color Palette**
| Token | Value | Usage |
| :--- | :--- | :--- |
| **Primary Navy** | `#003366` | Headers, primary buttons, branding |
| **Deep Navy** | `#002244` | Hover states, active nav items |
| **Institutional Saffron** | `#FF9933` | Logo accents, "Begin" CTAs, focus highlights |
| **National Green** | `#138808` | Success states, tricolor accents |
| **Surface White** | `#FFFFFF` | Primary background, main content area |
| **Muted Surface** | `#F8F9FA` | Secondary sections, training cards background |
| **Border Color** | `#DDDDDD` / `#EEEEEE` | Grid lines, card borders |

#### **Typography**
*   **Primary Font**: `Roboto` (Sans-serif)
*   **Headings**: Bold/Black weight, uppercase for labels and primary headers.
*   **Body**: Medium weight for readability, high contrast (`#333333`).
*   **Tracking**: Tracking-widest (0.2em - 0.3em) for small labels and navigation items.

#### **Geometry**
*   **Corner Radius**: `0px` (Strictly enforced globally).
*   **Borders**: `1px` or `2px` solid. No shadows unless used for high-impact SaaS elevations.

---

### 3. Key UI Components

#### **The Tricolor Bar**
A 5px horizontal strip at the very top and bottom of every page.
*   **Segments**: Saffron | White | Green (Equal distribution).

#### **Notice / Spotlight Strip**
A functional announcement bar used for internal updates.
*   **Height**: `34px` - `40px`.
*   **Logic**: Navy background with a diagonal chevron cut separating the label ("NOTICE") from the content.
*   **CSS Variable**: `--spotlight-height` should be passed to the container to ensure the diagonal cut perfectly matches the strip height.

#### **Notched Header Cards**
Cards used for media, training, or specific status blocks.
*   **Header**: Navy background with white uppercase text.
*   **Signature Motif**: A 45-degree diagonal notch cut into the top-right or separating the header from the content.

#### **Capabilities Grid**
A flat grid system with 1px border separation.
*   **Hover State**: Cards transition to a subtle gray background with the primary navy highlight on icons.

#### **Text 3D Flip Component**
Interactive 3D flip animation for section headings.
*   **Location**: All major section headings (Built for Government Procurement, Intuitive Interface Design, etc.)
*   **Animation**: Characters flip from top on hover with spring physics
*   **Config**: `rotateDirection: "top"`, `staggerDuration: 0.03`, `transition: { type: "spring", damping: 25, stiffness: 160 }`
*   **Colors**: Text color preserved on both sides (no color change on flip)

#### **Line Shadow Text Component**
Animated diagonal line shadow effect for hero emphasis text.
*   **Location**: Applied to "Evaluation" word in hero heading
*   **Animation**: Infinite diagonal gradient shadow animation (15s loop)
*   **Style**: Italic text with saffron shadow color
*   **CSS**: Uses `transform-3d`, `backface-hidden`, `perspective-1000` utilities

#### **Retro Grid Background**
Dynamic animated grid pattern using WebGL shaders.
*   **Location**: Interface Preview section background
*   **Features**: Animated grid lines with configurable angle, cell size, and opacity
*   **Colors**: Navy lines in light mode, white lines in dark mode
*   **Config**: `angle={65}`, `cellSize={60}`, `opacity={0.4}`

#### **Animated Grid Pattern**
Ripple-based animated grid background effect.
*   **Location**: FAQ section (top-right corner only)
*   **Effect**: Cell ripple animation with radial gradient mask
*   **Mask**: `[mask-image:radial-gradient(ellipse_at_top_right,white,transparent_50%)]`
*   **Config**: `numSquares={30}`, `duration={4}`, `maxOpacity={0.4}`

#### **Aurora Background**
Animated gradient aurora effect for footer section.
*   **Location**: Footer background
*   **Animation**: `animate-aurora` keyframe with moving gradient
*   **Effect**: Blue/purple gradient sweep with mix-blend-difference
*   **Style**: Subtle, low opacity (50%) with blur effect

#### **Number Ticker Component**
Animated counting numbers for statistics.
*   **Location**: Stats cards in "Why NirnayAI" section (99.4%, 85%)
*   **Animation**: Spring-based counting from 0 to target value on viewport entry
*   **Config**: `decimalPlaces: 1` for 99.4%, `delay: 0.5-0.6` for stagger
*   **Trigger**: `useInView` with `{ once: true }`

---

### 4. Animation System

#### **Viewport-Triggered Animations**
All section content animates only when entering the viewport (scroll-triggered).
*   **Trigger**: `useInView` hook with `margin: "-100px"` for early activation
*   **Once**: Animations play once and don't reset on scroll out
*   **Container Components**:
  *   `ViewportAnimate` - Single element wrapper
  *   `ViewportStagger` - Container for staggered children
  *   `ViewportStaggerItem` - Individual stagger item

#### **Animation Variants**
| Animation | Direction | Duration | Use Case |
| :--- | :--- | :--- | :--- |
| **Slide Up** | `y: 40px → 0` | 0.6s | Cards, content blocks |
| **Fade In** | `opacity: 0 → 1` | 0.6s | Text, descriptions |
| **Stagger Children** | Delayed sequence | 0.1-0.15s | Grid items, lists |
| **Wipe Left→Right** | `scaleX: 0 → 1` | 0.6s | Buttons (hero only) |

#### **Easing Functions**
*   **Primary**: `cubic-bezier(0.33, 1, 0.68, 1)` - Smooth deceleration
*   **Spring**: `{ type: "spring", damping: 25, stiffness: 160 }` - For 3D flip

#### **Animation Delays (Stagger Pattern)**
*   **Section Heading**: 0s (immediate, but waits for viewport)
*   **Description/Label**: 0.2s
*   **Primary Content**: 0.3s
*   **Secondary Content**: 0.4s
*   **Grid Items**: 0.3s + staggerDelay per item
*   **Stats Numbers**: 0.5-0.6s (after card appears)

#### **Hero Animations (On Page Load)**
*   **Label**: Fade in by line (0.2s delay)
*   **Heading**: Slide up by word (0.1s stagger between words)
*   **Description**: Fade in by line (0.6s delay)
*   **Buttons**: Wipe from left to right (0.8s delay, 0.1s stagger)

---

### 5. Layout Principles
*   **Vertical Flow**: Use a clean, section-based vertical flow for landing pages.
*   **Horizontal Dashboarding**: For internal tools, use a structured grid (e.g., 3-column or 4-column) with consistent border-px separation.
*   **SaaS Spacing**: Generous padding (`py-24`) for major sections to avoid the "cluttered government site" feel while keeping the "official" components.

---

### 6. Implementation Rules
1.  **No Gradients**: Use flat colors or subtle opacity overlays only.
2.  **No Placeholders**: Use official institutional icons (Shield, Gavel, FileSearch) from Lucide or similar professional sets.
3.  **Traceability**: Every result or data point should be presented in a way that feels "Audit-Ready".
