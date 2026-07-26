# @muf/ui

> Official Design System for AIOS.

---

# Overview

`@muf/ui` is the official Design System for AIOS.

It provides a complete collection of reusable UI primitives, high-level components, layouts, themes, design tokens, animations, icons, utilities and providers used across every AIOS application.

The package is framework-focused and business-logic agnostic.

It MUST NEVER contain application logic.

---

# Goals

The Design System has four primary goals:

- Consistency
- Reusability
- Accessibility
- Performance

Every interface in AIOS should be built using this package.

---

# Consumers

Current consumers include:

- apps/web
- apps/desktop

Future consumers may include:

- Mobile applications
- Documentation site
- Storybook
- External SDKs

---

# Package Structure

```
src/

animations/
components/
hooks/
icons/
layouts/
primitives/
providers/
styles/
theme/
tokens/
types/
utils/

index.ts
```

---

# Design Principles

The Design System follows these principles:

- Composition over inheritance
- Stateless components whenever possible
- Accessibility first
- Type safety
- Predictable APIs
- Performance by default
- Dark Mode support
- Responsive design
- Tree-shakeable exports

---

# Dependencies

The package must remain independent from:

- Kernel
- Workflow
- Agents
- Database
- LLM

The UI layer must never contain business logic.

---

# Public API

Only `src/index.ts` should expose public components.

Internal files must not be imported directly by consumers.

Correct:

```ts
import { Button } from "@muf/ui";
```

Incorrect:

```ts
import { Button } from "@muf/ui/src/primitives/Button";
```

---

# Versioning

Semantic Versioning (SemVer) must be followed.

Major changes must be documented.

---

# License

MIT