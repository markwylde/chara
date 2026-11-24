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
Changing only the `state` prop SHALL update the root's `data-state` attribute without regenerating the avatar or replacing its elements, so running animations on unaffected parts are not restarted by a re-mount.

#### Scenario: State prop changes
- **WHEN** an animated avatar is re-rendered with `state` changed from "idle" to "thinking"
- **THEN** the same root DOM element now has `data-state="thinking"`, and the avatar was not regenerated

### Requirement: Caller classes are merged
A caller-supplied `className` SHALL be added to the classes the avatar generates, not replace them. `data-state` and `data-mono` SHALL be reserved props that the caller cannot override.

#### Scenario: className on a standalone avatar
- **WHEN** a standalone avatar is rendered with `className="hero"`
- **THEN** the root has the class "hero" and still has its generated classes

#### Scenario: Reserved data attributes
- **WHEN** an animated avatar with `state="idle"` is given `data-state="error"`
- **THEN** the root has `data-state="idle"`

### Requirement: Animated avatars hydrate cleanly
Server rendering and hydration SHALL produce no mismatch for standalone, animated and mono avatars, on React 18 and 19.

#### Scenario: Hydrating animated avatars
- **WHEN** a page with animated standalone avatars, including duplicates, is server-rendered and hydrated
- **THEN** React reports no hydration mismatch
