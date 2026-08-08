# Design System

## Aesthetic Direction

**Feel:** Calm, minimal, premium, quiet, focused  
**Inspiration:** Apple, Linear, Raycast, Notion

The UI should feel like a workspace tool, not a chatbot. The sidebar is a workspace panel, not a chat window.

## Core Principles

- Large whitespace — let content breathe
- Soft borders — `1px solid #2a2a2a` (not harsh dividers)
- Subtle shadows — `box-shadow: 0 2px 8px rgba(0,0,0,0.3)`
- No heavy gradients — flat surfaces with minimal depth
- No flashy chatbot look — status chips and progress steps, not message bubbles
- Sidebar = workspace, not chat

## Color Palette

```
Backgrounds:
  base:        #0a0a0a   (main app, deepest)
  surface:     #111111   (cards, modals)
  elevated:    #1a1a1a   (inputs, code blocks)
  border:      #2a2a2a   (dividers, outlines)
  
Text:
  primary:     #ffffff   (headings, active state)
  secondary:   #aaaaaa   (body, labels)
  muted:       #555555   (placeholders, disabled)
  
Accent:
  primary:     #6366f1   (indigo — action, progress)
  hover:       #818cf8   (indigo light)
  
Semantic:
  success:     #22c55e   (green — complete)
  danger:      #ef4444   (red — checkpoint, destructive)
  warning:     #f59e0b   (amber — partial/retry)
  
Sidebar specific:
  tab-bg:      #1e1e1e
  tab-active:  #2a2a2a
```

## Typography

```css
--font-ui: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
--font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;

--size-xs:   11px;   /* metadata, timestamps */
--size-sm:   12px;   /* labels, captions */
--size-base: 14px;   /* body text */
--size-input: 16px;  /* command bar input */
--size-title: 18px;  /* modal title, section header */

--weight-normal:    400;
--weight-medium:    500;
--weight-semibold:  600;
```

## Motion

```css
--ease-standard:    cubic-bezier(0.4, 0, 0.2, 1);
--ease-decelerate:  cubic-bezier(0.0, 0.0, 0.2, 1);

--duration-fast:    100ms;   /* icon state change */
--duration-normal:  200ms;   /* sidebar collapse, modal open */
--duration-slow:    300ms;   /* page-level transitions */
```

## Component Specs

### Sidebar
```css
width: 320px;
background: rgba(15, 15, 15, 0.92);
backdrop-filter: blur(20px);
border-left: 1px solid #2a2a2a;
position: fixed;
right: 0;
height: 100vh;

/* Tab strip */
.tab-strip {
  height: 36px;
  background: #1e1e1e;
  display: flex;
  border-bottom: 1px solid #2a2a2a;
}
.tab { width: 80px; cursor: pointer; }
.tab.active { background: #2a2a2a; color: #ffffff; }
.tab.inactive { color: #555555; }

/* Collapse animation */
transition: transform var(--duration-normal) var(--ease-standard);
transform: translateX(0);       /* expanded */
transform: translateX(320px);   /* collapsed */

/* Drag handle */
.handle {
  position: absolute;
  left: -4px;
  width: 8px;
  height: 100%;
  cursor: col-resize;
}
```

### CommandBar
```css
/* Backdrop */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
}

/* Input container */
.command-modal {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 640px;
  background: #1a1a1a;
  border: 1px solid #333333;
  border-radius: 12px;
  overflow: hidden;
}

.command-input {
  width: 100%;
  height: 52px;
  padding: 0 16px;
  font-size: var(--size-input);
  font-family: var(--font-mono);
  background: transparent;
  border: none;
  color: #ffffff;
  outline: none;
}

.command-input::placeholder { color: #555555; }

/* Loading state */
.command-input.loading {
  border-left: 3px solid #6366f1;
  animation: pulse 1.5s ease-in-out infinite;
}
```

### HUD
```css
.hud {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 280px;
  background: rgba(10, 10, 10, 0.85);
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 12px 14px;
  z-index: 8888;
  
  /* Entry animation */
  animation: hud-enter 150ms var(--ease-decelerate);
}

@keyframes hud-enter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hud-progress-track {
  height: 2px;
  background: #222;
  border-radius: 1px;
  margin-top: 8px;
}

.hud-progress-fill {
  height: 2px;
  background: linear-gradient(90deg, #6366f1, #818cf8);
  border-radius: 1px;
  transition: width 200ms var(--ease-standard);
}

.hud-label {
  font-size: var(--size-sm);
  color: #aaaaaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}
```

### Checkpoint Modal
```css
.checkpoint-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkpoint-card {
  width: 480px;
  background: #111111;
  border: 1px solid #ef4444;  /* RED — danger signal */
  border-radius: 16px;
  padding: 24px;
}

.checkpoint-title {
  font-size: var(--size-title);
  font-weight: var(--weight-semibold);
  color: #ffffff;
  margin-bottom: 16px;
}

.checkpoint-cancel {
  background: #222222;
  color: #aaaaaa;
  border: 1px solid #333;
}

.checkpoint-approve {
  background: #ef4444;
  color: #ffffff;
  font-weight: var(--weight-medium);
}
```

### Entity / Action Pills
```css
.entity-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #1e1e1e;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  font-size: var(--size-sm);
  color: #aaaaaa;
}

.entity-pill .value {
  color: #ffffff;
  font-weight: var(--weight-medium);
}

.action-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard);
}

.action-item:hover { background: #1e1e1e; }
```

## Accessibility Requirements

- All interactive elements have `aria-label`
- Keyboard navigation: Tab order follows visual flow
- Checkpoint modal: focus trap (Tab cycles within modal)
- HUD: `role="status"` + `aria-live="polite"`
- CommandBar: `role="dialog"` + `aria-modal="true"`
- Color contrast: body text meets WCAG AA (4.5:1 minimum)

## Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./renderer/**/*.{tsx,ts}'],
  theme: {
    extend: {
      colors: {
        surface: '#111111',
        elevated: '#1a1a1a',
        border: '#2a2a2a',
        accent: '#6366f1',
        danger: '#ef4444',
      },
      fontFamily: {
        mono: ['SF Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backdropBlur: {
        sidebar: '20px',
        overlay: '4px',
      }
    }
  }
};
```
