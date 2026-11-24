# Spec Delta

## Purpose

Lets React applications show Chara avatars as a component that renders real SVG elements, matching the core library's output exactly and working with server rendering.

## ADDED Requirements

### Requirement: Avatar component
The React package SHALL export an `Avatar` component that takes `name` and the core options (theme, size, radius, title, idPrefix, normalisation) as props, and renders the same avatar as the core library for those inputs.

#### Scenario: Matches the core output
- **WHEN** `<Avatar name="Claudette" theme="sigil" size={40} />` is rendered to static markup
- **THEN** the markup is equivalent to the core library's SVG for the same inputs

### Requirement: Renders real elements
The component SHALL render SVG elements through React, not through injected HTML.

#### Scenario: No injected HTML
- **WHEN** the component renders
- **THEN** it does not use `dangerouslySetInnerHTML`, and its root element is an `svg`

### Requirement: Pass-through props
The component SHALL forward `className`, `style` and other standard SVG attributes to the root `svg` element, and SHALL forward a ref to it.

#### Scenario: className and ref
- **WHEN** the component is rendered with `className="bot-icon"` and a ref
- **THEN** the root `svg` has the class "bot-icon", and the ref points to that element

### Requirement: Accessible by default
When `title` is given, the component SHALL render an accessible image with that title. When it is not, the component SHALL be decorative (`aria-hidden`), matching the core rules.

#### Scenario: Decorative next to a visible name
- **WHEN** the component is rendered without a title beside the bot's visible name
- **THEN** the avatar is hidden from assistive technology

### Requirement: Server rendering and hydration
The component SHALL produce identical markup on the server and the client, with no hydration warnings, including when the same avatar appears more than once on a page.

#### Scenario: Hydrates cleanly
- **WHEN** a page with several avatars, including duplicates, is server-rendered and then hydrated
- **THEN** React reports no hydration mismatch

### Requirement: Recompute only on input change
The component SHALL regenerate the avatar only when the inputs that affect the image change.

#### Scenario: Unrelated re-render
- **WHEN** the parent re-renders with the same name and options
- **THEN** the avatar is not regenerated

### Requirement: Hook for non-element uses
The React package SHALL export a hook that returns the avatar's data URI for given inputs, for places that need an image URL (`<img>`, CSS backgrounds, favicons).

#### Scenario: Data URI hook
- **WHEN** the hook is called with a name and theme
- **THEN** it returns the same data URI the core library produces

### Requirement: Peer dependency on React
The React package SHALL declare React 18 or newer as a peer dependency, SHALL depend on the core package, and SHALL NOT bundle a copy of either.

#### Scenario: Works on React 18 and 19
- **WHEN** the component test suite runs against React 18 and React 19
- **THEN** all tests pass on both
