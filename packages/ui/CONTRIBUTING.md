# Contributing Guide

This document defines the mandatory rules for contributing to the AIOS Design System.

Every developer and AI coding agent must follow these rules.

---

# General Rules

- Components must be reusable.
- Components must be typed.
- Components must be documented.
- Components must be tested.
- Components must be accessible.

---

# Folder Structure

Each component lives in its own directory.

Example:

```
Button/

Button.tsx
Button.types.ts
Button.test.tsx
Button.stories.tsx
index.ts
```

---

# Naming

Components:

PascalCase

Example:

Button

Dialog

Sidebar

InspectorPanel

---

Hooks

camelCase

Example:

useTheme

useResizeObserver

useHotkeys

---

Files

PascalCase for components.

camelCase for utilities.

---

# Component Rules

Every component should:

- Accept className
- Forward refs when appropriate
- Support composition
- Avoid unnecessary props
- Export its own types

---

# Accessibility

Every interactive component must:

- Support keyboard navigation
- Have ARIA attributes
- Support screen readers
- Be focusable

Accessibility is mandatory.

---

# Styling

Use Design Tokens.

Never hardcode colors.

Never hardcode spacing.

Never hardcode typography.

---

# State

UI state only.

Business state belongs elsewhere.

---

# Imports

Always import from package root.

Avoid deep imports.

---

# Pull Requests

Every PR must:

- Compile successfully
- Pass typecheck
- Pass tests
- Include documentation

No exceptions.
