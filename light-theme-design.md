# AlertZone Theme Design System

This document outlines the visual philosophy, design tokens, and components of the **AlertZone Theme System**. The design is crafted to be clean, simple, and premium, supporting both dynamic Light (default) and Dark theme modes.

---

## 1. Visual Philosophy

*   **Surfaces & Cards**: Rely on clean card shapes sitting on soft page backgrounds. In Light mode, this uses `#FFFFFF` cards on a `#F5F5F5` background with `#E8E8E8` borders. In Dark mode, this uses `#111E27` cards on `#0D1F2D` background with `#1E3347` borders.
*   **Color Accents**: 
    - **Light Mode**: Deep Teal (`#0D8A72`) is the primary active color.
    - **Dark Mode**: Cyan/Teal (`#4CC2D1`) is the primary active color.
*   **Contrast & Legibility**: Ensure high-contrast text rendering. Text colors group dynamically into primary headers, secondary details, and muted placeholders.
*   **Feedback Tints**: Success, danger, and warning states use soft pastel background tints with saturated border and text tones.

---

## 2. Design Tokens & Color Palette

Colors are dynamically mapped using `ThemeContext` via the following design tokens:

| Token | Light Value (Default) | Dark Value | Purpose |
| :--- | :--- | :--- | :--- |
| `background` | `#F5F5F5` | `#0D1F2D` | Main page background |
| `card` | `#FFFFFF` | `#111E27` | Cards, input blocks, panel containers |
| `border` | `#E8E8E8` | `#1E3347` | Borders, dividers, thin outlines |
| `primary` | `#0D8A72` | `#4CC2D1` | Primary CTA backgrounds, active indicators |
| `primaryPressed` | `#0B6E5B` | `#3BB0BE` | Pressed state of primary buttons |
| `text` | `#1A1A1A` | `#FFFFFF` | Headers, titles, primary body copy |
| `textSecondary`| `#6B7280` | `#5A7D8A` | Sub-titles, labels, active status details |
| `textMuted` | `#9CA3AF` | `#3A5060` | Placeholders, timestamps, lock icons |
| `cardUnearned` | `#F9FAFB` | `#1A1A1A` | Locked/unearned gamification items |
| `modalBackdrop`| `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.85)`| Semi-transparent overlay behind modals |
| `successBg` | `#F0FDF4` | `#1A2D1A` | Success banners, resolved badge background |
| `successBorder`| `#BBF7D0` | `#1E4D1E` | Border of positive notification banners |
| `successText` | `#059669` | `#30A89C` | Checkmarks, positive statuses text |
| `dangerBg` | `#FEE2E2` | `#2D1F24` | Rejected/deleted items background |
| `dangerBorder` | `#DC262630`| `#DC262650`| Rejected/deleted item borders |
| `dangerText` | `#DC2626` | `#EF4444` | Red warning and error text |
| `warningBg` | `#FEF3C7` | `#2D251F` | Warning banners/timeline alerts |
| `warningBorder`| `#D9770630`| `#D9770650`| Border of warning banners |
| `warningText` | `#D97706` | `#F59E0B` | Warning labels, status PENDING/ASSIGNED |

---

## 3. UI Guidelines

### Scroll Mechanics
All main ScrollViews must utilize momentum scrolling properties to maintain high frame rates during scroll operations:
```tsx
<ScrollView
  scrollEventThrottle={16}
  decelerationRate="normal"
  keyboardShouldPersistTaps="handled"
>
  {/* Content */}
</ScrollView>
```

### Pop-up Modal Animations
To ensure transitions feel hand-crafted rather than synthetic:
*   Avoid immediate, linear, or default fade configurations for dialogue overlays.
*   Animate card scale starting from `0.85` to `1.0` using `Animated.spring` (tension: 120, friction: 8).
*   Simultaneously fade backdrop opacity using `Animated.timing` (duration: 180ms).
*   Reverse animations on dismiss and only set visibility state to `false` when the fade/scale animation completes.
