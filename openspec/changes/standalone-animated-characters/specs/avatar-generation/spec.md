# Spec Delta

## ADDED Requirements

### Requirement: Standalone variant
The library SHALL accept a `variant` option of `"tile"` or `"standalone"`, defaulting to `"tile"`. With `"standalone"`, the avatar SHALL have no background fill and no rounded clip, SHALL be the same character as the tile for the same name and theme, and SHALL be drawn as a whole figure that is visible on both light and dark pages. The `radius` option SHALL have no effect on a standalone avatar. An unknown variant SHALL throw a `TypeError`.

#### Scenario: No background
- **WHEN** an avatar is generated for "Claudette" with `variant: "standalone"` in any built-in theme
- **THEN** the SVG contains no full-canvas background rectangle and no frame clip path

#### Scenario: Critter is a whole figure
- **WHEN** a standalone Critter is generated
- **THEN** every drawn shape lies inside the 100×100 canvas, and the figure includes feet and arms

#### Scenario: Sigil is visible on a light page
- **WHEN** a standalone Sigil is generated
- **THEN** its strokes are painted with the avatar's gradient, not near-white ink

#### Scenario: Unknown variant
- **WHEN** an avatar is requested with `variant: "poster"`
- **THEN** a `TypeError` is thrown

### Requirement: Same character in both variants
The standalone avatar SHALL be built from the same generated parts as the tile for the same name and theme. Mecha and Critter SHALL keep the same part colours. Sigil keeps the same glyph and hues, but its strokes use a brighter version of the tile's gradient in place of the near-white ink.

#### Scenario: Same character as the tile
- **WHEN** the tile and standalone avatars are generated for the same name in the Mecha theme
- **THEN** the head, eyes and mouth shapes and their colours are the same in both

#### Scenario: Same Sigil glyph
- **WHEN** the tile and standalone avatars are generated for the same name in the Sigil theme
- **THEN** both draw the same set of line segments on the grid

#### Scenario: Nothing hidden shows in a still character
- **WHEN** a standalone avatar is generated without `animated` and shown on a page with no other avatars
- **THEN** parts that belong only to a state, such as the sleeping Zs, are not visible

### Requirement: Tile output is unchanged
Adding the standalone, animation and mono options SHALL NOT change the output for any call that does not use them.

#### Scenario: Existing golden files
- **WHEN** the existing golden names are generated with no new options
- **THEN** the output is byte-identical to the golden files from before this change

### Requirement: Animation states
The library SHALL accept `animated` (default false) and `state` options. The states are `idle` (default), `thinking`, `working`, `success`, `error` and `sleeping`. An animated avatar SHALL carry its animation inside the SVG, with rules for every state, so that changing the root's `data-state` attribute switches state without help from the host page. An animated avatar's stylesheet SHALL NOT affect anything on the page other than animated avatars of the same theme.

#### Scenario: Animated output is self-contained
- **WHEN** a standalone avatar is generated with `animated: true` and `state: "thinking"`
- **THEN** the SVG root has `data-state="thinking"` and the SVG contains a stylesheet with rules for all six states

#### Scenario: Still neighbours stay still
- **WHEN** an animated and a non-animated standalone avatar of the same theme are inlined in one page
- **THEN** no element of the non-animated avatar has a running animation, and its appearance equals the same avatar shown alone

#### Scenario: Not animated by default
- **WHEN** a standalone avatar is generated without `animated`
- **THEN** the SVG contains no stylesheet and no `data-state` attribute

#### Scenario: Works as an image
- **WHEN** an animated standalone avatar is produced as a data URI and loaded in an `<img>` in a browser
- **THEN** the image renders and its animations run

### Requirement: Error state glows
In the `error` state the character SHALL keep its own colours and gain a pulsing red glow around its body. It SHALL NOT be dimmed or desaturated. With `mono`, the glow SHALL be grey.

#### Scenario: Error glow
- **WHEN** an animated Critter is shown in a browser in the `error` state
- **THEN** its body has a red drop-shadow glow and its fill colour is unchanged

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
- **THEN** no element of the avatar, including its root, has a running animation

### Requirement: Varied timing
Animated avatars for different names SHALL be able to start their loops at different offsets, chosen deterministically from the name, so that a group does not move in unison. The offset SHALL NOT change the character's drawing.

#### Scenario: Offsets differ in the browser
- **WHEN** animated avatars for the golden names are shown in a browser, in the idle state and again after switching to another state
- **THEN** at least two different effective animation delays are in use among their bodies

#### Scenario: Deterministic offset
- **WHEN** the same name is generated twice with `animated: true`
- **THEN** both outputs are identical, including the timing offset

### Requirement: No-colour option
The library SHALL accept a `mono` option (default false) that draws the avatar in greys only, for both variants and in every state. For built-in themes every colour SHALL be a grey. For custom themes the guarantee covers colours made with the theme context's colour helper; literal colours and colours in a custom theme's own animation CSS are that theme's responsibility.

#### Scenario: Mono output has no hue
- **WHEN** an avatar is generated with `mono: true` in any theme and either variant
- **THEN** every fill, stroke and gradient stop colour in the SVG is a grey

#### Scenario: Custom theme literal colour
- **WHEN** a custom theme that mixes a helper colour and the literal `#123456` is generated with `mono: true`
- **THEN** the helper colour is a grey and the literal is unchanged

#### Scenario: Mono error state
- **WHEN** a mono animated avatar is in the `error` state
- **THEN** its stylesheet applies no non-grey colour

### Requirement: Custom theme characters
A custom theme SHALL be able to define a standalone drawing and optional animation CSS. Requesting the standalone variant from a theme that does not define a character, or animation from a theme with no animation CSS, SHALL throw a `TypeError`.

#### Scenario: Theme without a character
- **WHEN** a custom theme with only a tile drawing is used with `variant: "standalone"`
- **THEN** a `TypeError` naming the theme is thrown

#### Scenario: Character without animation CSS
- **WHEN** a custom theme that defines a character but no animation CSS is generated with `animated: true`
- **THEN** a `TypeError` naming the theme is thrown

#### Scenario: Custom animated character
- **WHEN** a custom theme defines a character and animation CSS and is generated with `animated: true`
- **THEN** the output contains that CSS in its stylesheet

### Requirement: Scoped and safe animation CSS
Animation CSS from any theme SHALL be checked before use and rejected with a `CharaSafetyError` unless all of the following hold. It contains no backslash, quote character, `<`, `>`, `&`, `url(`, `image(`, `image-set(`, `expression(`, or character that XML does not allow. Its only at-rules are `@keyframes` and `@media`. Every style rule's selectors each begin with the theme's own root class followed by a `data-state` attribute selector. Every keyframes name begins with `chara-<theme id>_`.

#### Scenario: CSS with an external reference
- **WHEN** a custom theme's animation CSS contains `@import` or `url(`
- **THEN** a `CharaSafetyError` is thrown

#### Scenario: CSS with an escape
- **WHEN** a custom theme's animation CSS contains a backslash
- **THEN** a `CharaSafetyError` is thrown

#### Scenario: Unscoped selector
- **WHEN** a custom theme's animation CSS contains the rule `body{display:none}`, or a selector list where only the first selector is scoped
- **THEN** a `CharaSafetyError` is thrown

#### Scenario: Characters removed on output
- **WHEN** a custom theme's animation CSS spells `url(` with a NUL character inside it, which serialisation would remove
- **THEN** a `CharaSafetyError` is thrown

#### Scenario: Strings hiding structure
- **WHEN** a custom theme's animation CSS uses a quoted string containing a brace, comma or parenthesis to hide a rule for `body`
- **THEN** a `CharaSafetyError` is thrown

#### Scenario: Overlapping theme ids
- **WHEN** the themes `t` and `t-x` are both in use
- **THEN** neither can define a keyframes name that the other is allowed to define

#### Scenario: Unprefixed keyframes
- **WHEN** a custom theme's animation CSS defines `@keyframes spin`
- **THEN** a `CharaSafetyError` is thrown

#### Scenario: Two custom themes together
- **WHEN** animated avatars from two custom themes that each define a "wobble" animation are inlined in one page
- **THEN** neither theme's rules or keyframes apply to the other's avatar

### Requirement: Identifiers across variants
Avatars of the same name that differ in variant or in `mono` SHALL NOT define the same identifier with different content, and identifiers for calls that use neither option SHALL be unchanged.

#### Scenario: Tile and standalone inline together
- **WHEN** the tile, standalone, mono tile and mono standalone avatars for "Claudette" in every theme are placed in one document
- **THEN** no identifier is defined twice with different content

## MODIFIED Requirements

### Requirement: Safe SVG content
Every avatar, from a built-in or a custom theme, SHALL contain only elements and attributes on the library's published allowlist. URL references SHALL point only to IDs inside the same document. Any other element, attribute or reference SHALL be rejected with an error at generation time, never written to the output. The allowlist excludes scripts, event handlers, `foreignObject`, `href`/`xlink:href` and `style` attributes.

The allowlist includes `class` (letters, digits, `-`, `_` and spaces only), and `display` with the value `none` only. A stylesheet element is allowed in exactly one place: as a direct child of the root, which only the library can write, holding animation CSS that has passed the animation CSS checks. Theme drawings are always nested below the root, so a theme SHALL NOT be able to add a stylesheet. The published tree check SHALL accept every avatar the library generates, including animated ones.

#### Scenario: Built-in output is safe
- **WHEN** avatars are generated for the golden names in every built-in theme
- **THEN** none contains a `<script>`, an `on*` attribute or a URL other than a local `#id` reference

#### Scenario: Custom theme with a script
- **WHEN** a custom theme returns a `script` element
- **THEN** generation throws an error naming the disallowed element

#### Scenario: Custom theme with an external reference
- **WHEN** a custom theme sets `fill="url(https://example.com/x)"` or an `onload` attribute
- **THEN** generation throws an error naming the disallowed attribute or value

#### Scenario: Obfuscated URL
- **WHEN** a custom theme sets a paint value that spells `url(` with CSS escapes or comments, such as `u\72l(https://example.com/x)`
- **THEN** generation throws a safety error

#### Scenario: Hard-coded id
- **WHEN** a custom theme defines an element with an id that was not created through the theme context's id helper
- **THEN** generation throws a safety error, even if the references to that id resolve inside the avatar

#### Scenario: Namespace override
- **WHEN** a custom theme sets `xmlns` on any element
- **THEN** generation throws a safety error

#### Scenario: Theme emits a style element
- **WHEN** a theme's drawing contains a `style` element
- **THEN** a safety error is thrown

#### Scenario: Unsafe class value
- **WHEN** a theme's drawing has `class="a;b{}"`
- **THEN** a safety error is thrown

#### Scenario: Animated output passes the published check
- **WHEN** an animated avatar's tree is passed to the published tree check
- **THEN** it is accepted

### Requirement: Custom themes
The library SHALL expose a public API for defining a theme. A theme is an id (lowercase letters, digits and hyphens) plus a draw function, and optionally a standalone character drawing and animation CSS. The draw function receives a seeded random source and drawing helpers, and returns a background and content nodes. The character function receives the same and returns content nodes only. Custom themes SHALL get determinism, normalisation, the output formats, the safety rules and all options in the same way as built-in themes. An invalid theme id SHALL be rejected when the theme is defined.

#### Scenario: Custom theme renders
- **WHEN** a custom theme that draws a single circle is defined and used to generate an avatar
- **THEN** the output is a valid Chara SVG with the clip, size, title and ID rules applied, and it is deterministic for the name

#### Scenario: Custom theme with a gradient background
- **WHEN** a custom theme registers a gradient definition and uses it as its background
- **THEN** the gradient's ID follows the ID rules, and the background references it

#### Scenario: Invalid theme id
- **WHEN** a theme is defined with the id "My Theme"
- **THEN** an error is thrown
