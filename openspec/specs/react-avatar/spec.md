# react-avatar Specification

## Purpose
Lets React applications show Chara avatars as a component that renders real SVG elements, matching the core library's output and working with server rendering.

## Requirements

### Requirement: Avatar component
The React package SHALL export an `Avatar` component. It takes `name` and the core options (theme, size, radius, title, idPrefix, normalize) as props, and renders the same avatar as the core library for those inputs. "The same" means the same element structure, attributes and text when both are parsed. A byte-for-byte match is not required.

#### Scenario: Matches the core output
- **WHEN** `<Avatar name="Claudette" theme="sigil" size={40} />` is rendered to static markup, and both it and the core SVG for the same inputs are parsed
- **THEN** the two parsed trees have the same elements, attributes and text

### Requirement: Renders real elements
The component SHALL render SVG elements through React, not through injected HTML.

#### Scenario: No injected HTML
- **WHEN** the component renders
- **THEN** it does not use `dangerouslySetInnerHTML`, and its root element is an `svg`

### Requirement: Pass-through props and precedence
The component SHALL forward a ref and any other standard SVG props to the root `svg`. `viewBox`, `xmlns`, `children` and `dangerouslySetInnerHTML` are reserved: the component SHALL ignore them when passed. For every other prop, a caller-supplied value SHALL override the generated one. This includes `width`, `height`, `role`, `aria-hidden`, `aria-label`, `className` and `style`.

#### Scenario: className and ref
- **WHEN** the component is rendered with `className="bot-icon"` and a ref
- **THEN** the root `svg` has the class "bot-icon", and the ref points to that element

#### Scenario: Caller overrides ARIA and size
- **WHEN** the component is rendered with `size={40}`, `width={64}` and `aria-label="Claudette"`
- **THEN** the root `svg` has width "64", height "40", and the given `aria-label`

#### Scenario: Reserved props are ignored
- **WHEN** the component is given `viewBox="0 0 10 10"` and children
- **THEN** the root keeps `viewBox="0 0 100 100"`, and the children are not rendered

### Requirement: Accessible by default
When `title` is given, the component SHALL render an accessible image with that title. When it is not, the component SHALL be decorative (`aria-hidden`). Both cases follow the core rules.

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
The React package SHALL declare React 18 or newer as a peer dependency and SHALL depend on the core package. Its published build SHALL import both rather than bundling a copy of either.

#### Scenario: Works on React 18 and 19
- **WHEN** the component test suite runs against React 18 and React 19
- **THEN** all tests pass on both

#### Scenario: Externals in the published build
- **WHEN** the packed React package is installed into a fresh consumer project
- **THEN** its built files import `react` and `@markwylde/chara` and contain no copy of either
