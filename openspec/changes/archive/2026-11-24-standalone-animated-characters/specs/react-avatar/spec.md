# Spec Delta

## ADDED Requirements

### Requirement: Standalone, animation and mono props
The `Avatar` component and the data URI hook SHALL accept `variant`, `animated`, `state` and `mono`, with the same meaning, defaults and errors as the core library, and SHALL render the same avatar as the core library for those inputs.

#### Scenario: Matches the core output
- **WHEN** `<Avatar name="Claudette" theme="critter" variant="standalone" animated state="working" mono />` is rendered to static markup, and both it and the core SVG for the same inputs are parsed
- **THEN** the two parsed trees have the same elements, attributes and text, including the stylesheet

#### Scenario: Stylesheet is rendered as text
- **WHEN** an animated avatar renders
- **THEN** its stylesheet is a `style` element with text content, and `dangerouslySetInnerHTML` is not used

### Requirement: State changes do not rebuild the avatar
Changing only the `state` prop SHALL update the root's `data-state` attribute without regenerating the avatar or replacing its elements, so running animations on unaffected parts are not restarted by a re-mount. The `state` value SHALL be validated on every render, and `data-state` SHALL be present only when `animated` is set.

#### Scenario: State prop changes
- **WHEN** an animated avatar is re-rendered with `state` changed from "idle" to "thinking"
- **THEN** the same root DOM element now has `data-state="thinking"`, and the avatar was not regenerated

#### Scenario: Invalid state on update
- **WHEN** an animated avatar is re-rendered with `state` changed from "idle" to "dancing"
- **THEN** a `TypeError` is thrown

#### Scenario: State on a still avatar
- **WHEN** a standalone avatar is rendered with `state="sleeping"` and without `animated`
- **THEN** the root has no `data-state` attribute

### Requirement: Animated avatars hydrate cleanly
Server rendering and hydration SHALL produce no mismatch for standalone, animated and mono avatars, on React 18 and 19.

#### Scenario: Hydrating animated avatars
- **WHEN** a page with animated standalone avatars, including duplicates, is server-rendered and hydrated
- **THEN** React reports no hydration mismatch

## MODIFIED Requirements

### Requirement: Pass-through props and precedence
The component SHALL forward a ref and any other standard SVG props to the root `svg`. `viewBox`, `xmlns`, `children`, `dangerouslySetInnerHTML`, `data-state` and `data-mono` are reserved: the component SHALL ignore them when passed. A caller-supplied `className` SHALL be added to the classes the avatar generates. For every other prop, a caller-supplied value SHALL override the generated one. This includes `width`, `height`, `role`, `aria-hidden`, `aria-label` and `style`.

#### Scenario: className and ref
- **WHEN** the component is rendered with `className="bot-icon"` and a ref
- **THEN** the root `svg` has the class "bot-icon", and the ref points to that element

#### Scenario: Caller overrides ARIA and size
- **WHEN** the component is rendered with `size={40}`, `width={64}` and `aria-label="Claudette"`
- **THEN** the root `svg` has width "64", height "40", and the given `aria-label`

#### Scenario: Reserved props are ignored
- **WHEN** the component is given `viewBox="0 0 10 10"` and children
- **THEN** the root keeps `viewBox="0 0 100 100"`, and the children are not rendered

#### Scenario: className on a standalone avatar
- **WHEN** a standalone avatar is rendered with `className="hero"`
- **THEN** the root has the class "hero" and still has its generated classes

#### Scenario: Reserved data attributes
- **WHEN** an animated avatar with `state="idle"` is given `data-state="error"`
- **THEN** the root has `data-state="idle"`
