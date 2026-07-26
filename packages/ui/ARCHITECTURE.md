# UI Architecture

This document describes the architecture of the AIOS Design System.

---

# Layered Architecture

```
Applications
        │
        ▼
Layouts
        │
        ▼
Components
        │
        ▼
Primitives
        │
        ▼
Tokens
```

Business logic is intentionally outside this stack.

---

# Dependency Rules

Allowed:

```
Components
    ↓
Primitives

Layouts
    ↓
Components

Applications
    ↓
Layouts
```

Forbidden:

```
Primitives
      ↓
Kernel

Components
      ↓
Workflow

Theme
      ↓
Database
```

The UI package must remain independent.

---

# Design Tokens

Everything visual must originate from Design Tokens.

Examples:

- Colors
- Typography
- Radius
- Elevation
- Shadows
- Motion
- Duration
- Spacing

---

# Themes

Themes are responsible for:

- Colors
- Backgrounds
- Foregrounds
- Borders
- Interactive states

Business logic must never appear inside themes.

---

# Components

Components are built by composing primitives.

Never duplicate primitives.

---

# Layouts

Layouts define page structure.

Layouts never contain business rules.

---

# Utilities

Utilities must be:

- Pure
- Stateless
- Deterministic

---

# Providers

Providers expose:

- Theme
- Localization (future)
- Preferences (future)

Providers must not communicate directly with Kernel.

---

# Future Expansion

The Design System is designed to support:

- Web
- Desktop
- Mobile
- Storybook
- Documentation
- Plugin ecosystem

without architectural changes.
