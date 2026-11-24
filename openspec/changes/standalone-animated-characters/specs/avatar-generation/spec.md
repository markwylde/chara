# Spec Delta

## ADDED Requirements

### Requirement: Standalone variant
The library SHALL accept a `variant` option of `"tile"` or `"standalone"`, defaulting to `"tile"`. With `"standalone"`, the avatar SHALL have no background fill and no rounded clip, SHALL be the same character as the tile for the same name and theme (same parts and colours), and SHALL be drawn as a whole figure that is visible on both light and dark pages. The `radius` option SHALL have no effect on a standalone avatar. An unknown variant SHALL throw a `TypeError`.

#### Scenario: No background
- **WHEN** an avatar is generated for "Claudette" with `variant: "standalone"` in any built-in theme
- **THEN** the SVG contains no full-canvas background rectangle and no frame clip path

#### Scenario: Same character as the tile
- **WHEN** the tile and standalone avatars are generated for the same name in the Mecha theme
- **THEN** the head, eyes and mouth shapes and their colours are the same in both

#### Scenario: Critter is a whole figure
- **WHEN** a standalone Critter is generated
- **THEN** every drawn shape lies inside the 100×100 canvas, and the figure includes feet and arms

#### Scenario: Sigil is visible on a light page
- **WHEN** a standalone Sigil is generated
- **THEN** its strokes are painted with the avatar's gradient, not near-white ink

#### Scenario: Unknown variant
- **WHEN** an avatar is requested with `variant: "poster"`
- **THEN** a `TypeError` is thrown

### Requirement: Tile output is unchanged
Adding the standalone, animation and mono options SHALL NOT change the output for any call that does not use them.

#### Scenario: Existing golden files
- **WHEN** the existing golden names are generated with no new options
- **THEN** the output is byte-identical to the golden files from before this change

### Requirement: Animation states
The library SHALL accept `animated` (default false) and `state` options. The states are `idle` (default), `thinking`, `working`, `success`, `error` and `sleeping`. An animated avatar SHALL carry its animation inside the SVG, with rules for every state, so that changing the root's `data-state` attribute switches state without help from the host page.

#### Scenario: Animated output is self-contained
- **WHEN** a standalone avatar is generated with `animated: true` and `state: "thinking"`
- **THEN** the SVG root has `data-state="thinking"` and the SVG contains a stylesheet with rules for all six states

#### Scenario: Not animated by default
- **WHEN** a standalone avatar is generated without `animated`
- **THEN** the SVG contains no stylesheet and no `data-state` attribute

#### Scenario: Works as an image
- **WHEN** an animated standalone avatar is produced as a data URI and loaded in an `<img>` in a browser
- **THEN** the image renders and its animations run

### Requirement: Animation option validation
`animated: true` SHALL require the standalone variant and throw a `TypeError` otherwise. An unknown state SHALL throw a `TypeError`. Without `animated`, the output SHALL contain no stylesheet and no `data-state`, whatever `state` is given.

#### Scenario: Animated tile is rejected
- **WHEN** an avatar is requested with `animated: true` and the tile variant
- **THEN** a `TypeError` is thrown

#### Scenario: Unknown state
- **WHEN** an avatar is requested with `state: "dancing"`
- **THEN** a `TypeError` is thrown

#### Scenario: State without animation
- **WHEN** a standalone avatar is generated with `state: "sleeping"` and without `animated`
- **THEN** the output equals the output with no `state` given

### Requirement: Reduced motion
An animated avatar SHALL not move when the viewer has asked for reduced motion.

#### Scenario: Reduced motion preference
- **WHEN** an animated avatar is shown in a browser with `prefers-reduced-motion: reduce`
- **THEN** no element of the avatar has a running animation

### Requirement: Varied timing
Animated avatars for different names SHALL be able to start their loops at different offsets, chosen deterministically from the name, so that a group does not move in unison. The offset SHALL NOT change the character's drawing.

#### Scenario: Deterministic offset
- **WHEN** the same name is generated twice with `animated: true`
- **THEN** both outputs are identical, including the timing offset

### Requirement: No-colour option
The library SHALL accept a `mono` option (default false) that draws the avatar in greys only, for both variants and in every state.

#### Scenario: Mono output has no hue
- **WHEN** an avatar is generated with `mono: true` in any theme and either variant
- **THEN** every fill, stroke and gradient stop colour in the SVG is a grey

#### Scenario: Mono error state
- **WHEN** a mono animated avatar is in the `error` state
- **THEN** its stylesheet applies no non-grey colour

### Requirement: Custom theme characters
A custom theme SHALL be able to define a standalone drawing and optional animation CSS. Requesting the standalone variant from a theme that does not define one SHALL throw a `TypeError`.

#### Scenario: Theme without a character
- **WHEN** a custom theme with only a tile drawing is used with `variant: "standalone"`
- **THEN** a `TypeError` naming the theme is thrown

#### Scenario: Custom animated character
- **WHEN** a custom theme defines a character and animation CSS and is generated with `animated: true`
- **THEN** the output contains that CSS in its stylesheet

### Requirement: Safe classes and stylesheets
Theme output SHALL be allowed to carry `class` attributes made only of letters, digits, `-`, `_` and spaces. Themes SHALL NOT be able to add a stylesheet element or a `style` attribute themselves. Animation CSS SHALL be rejected with a `CharaSafetyError` if it could load an external resource or hide content with escapes: any backslash, `<`, `>`, `&`, `url(`, `image(`, `image-set(`, `expression(`, or an at-rule other than `@keyframes` and `@media`.

#### Scenario: Theme emits a style element
- **WHEN** a theme's drawing contains a `style` element
- **THEN** a `CharaSafetyError` is thrown

#### Scenario: Unsafe class value
- **WHEN** a theme's drawing has `class="a;b{}"`
- **THEN** a `CharaSafetyError` is thrown

#### Scenario: CSS with an external reference
- **WHEN** a custom theme's animation CSS contains `@import` or `url(`
- **THEN** a `CharaSafetyError` is thrown

#### Scenario: CSS with an escape
- **WHEN** a custom theme's animation CSS contains a backslash
- **THEN** a `CharaSafetyError` is thrown

### Requirement: Identifiers across variants
Avatars of the same name that differ in variant or in `mono` SHALL NOT define the same identifier with different content, and identifiers for calls that use neither option SHALL be unchanged.

#### Scenario: Tile and standalone inline together
- **WHEN** the tile, standalone, mono tile and mono standalone avatars for "Claudette" in every theme are placed in one document
- **THEN** no identifier is defined twice with different content
