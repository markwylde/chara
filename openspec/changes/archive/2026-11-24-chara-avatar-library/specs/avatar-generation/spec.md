# Spec Delta

## Purpose

Turns any name into a unique, deterministic SVG avatar drawn by one of several themes, so applications can give every agent or user a recognisable face without storing images.

## ADDED Requirements

### Requirement: Deterministic output
Given the same name, theme, options and library version line (see "Output stability across versions"), the library SHALL produce byte-identical SVG output in Node and in modern browsers. The output SHALL NOT depend on global state, call order, time or any randomness source.

#### Scenario: Repeated calls match
- **WHEN** an avatar is generated twice for the name "Claudette" with the Mecha theme
- **THEN** both outputs are byte-identical

#### Scenario: Independent of call order
- **WHEN** avatars for "Imagine" and "Infrado" are generated, and then generated again in the reverse order
- **THEN** each name's output is identical across the two runs

#### Scenario: Same output in Node and browser
- **WHEN** the avatar for each golden name in each built-in theme is generated in Node and in Chromium
- **THEN** the outputs are byte-identical

### Requirement: Name normalisation
By default, the library SHALL normalise names before seeding:
1. Apply Unicode NFC.
2. Trim whitespace.
3. Collapse internal whitespace runs to one space.
4. Lowercase without depending on the locale.

An empty result SHALL use the fixed fallback seed "chara". Callers SHALL be able to turn normalisation off, in which case the raw string is used, and an empty raw string still uses the fallback.

#### Scenario: Case and spacing are ignored
- **WHEN** avatars are generated for "Claudette", " claudette ", "CLAUDETTE" and "clau dette" versus "clau   dette"
- **THEN** the first three outputs are identical to each other, and the last two are identical to each other

#### Scenario: Unicode-equivalent names match
- **WHEN** avatars are generated for "café" written with a precomposed é and with e plus a combining acute accent
- **THEN** the two outputs are identical

#### Scenario: Empty name
- **WHEN** an avatar is generated for "" or "   "
- **THEN** a valid avatar is returned, and it is the same for both inputs

#### Scenario: Normalisation turned off
- **WHEN** avatars for "Claudette" and "claudette" are generated with normalisation turned off
- **THEN** the two outputs differ

#### Scenario: Empty name with normalisation turned off
- **WHEN** an avatar is generated for "" with normalisation turned off
- **THEN** it equals the avatar for "" with normalisation on

### Requirement: Themes vary independently
Each theme SHALL derive its choices from a seed namespaced by the theme's id, so a name's avatar in one theme does not determine its avatar in another.

#### Scenario: Different theme, different seed
- **WHEN** the same name is rendered with Mecha and with Critter
- **THEN** each theme's part and colour choices come from its own seed

### Requirement: Mecha theme
The library SHALL provide a Mecha theme that draws a robot face from selectable parts: an antenna, ears, a head shape, eyes, a mouth and an extra detail, in a light or dark shell over a background whose hue is chosen from the full colour wheel.

#### Scenario: Mecha avatar is composed of parts
- **WHEN** an avatar is generated with the Mecha theme
- **THEN** the SVG contains a background, a head and eyes, with the antenna, ears, mouth and detail present or absent according to the seed

### Requirement: Critter theme
The library SHALL provide a Critter theme that draws a creature rising from the bottom edge. Its body outline is generated from the seed, and it has a topper, eyes, a mouth and markings clipped to the body.

#### Scenario: Critter body outline is generated
- **WHEN** avatars are generated with the Critter theme for two different names
- **THEN** each has a smooth, horizontally symmetric body outline, and the two outlines differ

### Requirement: Sigil theme
The library SHALL provide a Sigil theme that draws a stroked path walked on a 5×5 lattice and mirrored about the vertical centre line, with an end node, an optional stray dot and an optional border, over a two-stop gradient background.

#### Scenario: Sigil is mirrored
- **WHEN** an avatar is generated with the Sigil theme
- **THEN** its glyph is symmetric about the vertical centre line

### Requirement: Sigil glyph is never trivial
Every Sigil glyph SHALL have at least three strokes that leave the centre column. If the seeded walk fails to reach that after its bounded retries, the theme SHALL draw a deterministic fallback walk that does meet it.

#### Scenario: Sampled names
- **WHEN** Sigil avatars are generated for 1,000 distinct names
- **THEN** every glyph has at least three strokes off the centre column

#### Scenario: Retries exhausted
- **WHEN** the walk is driven by a random source that never leaves the centre column
- **THEN** the fallback glyph is drawn, and it has at least three strokes off the centre column

### Requirement: Distinct avatars across names
Within each built-in theme, different normalised names SHALL produce different drawings at a measured collision rate below 1 in 1,000 names in a 10,000-name sample. Distinctness SHALL be judged on drawing content with element IDs and ID references canonicalised, so differing IDs alone never count as a difference. Themes built only from discrete parts (Mecha) can repeat a face at scale, and this rate bounds how often.

#### Scenario: Collision rate in a sample
- **WHEN** canonicalised drawings are generated in each built-in theme for 10,000 distinct normalised names
- **THEN** fewer than 10 names in each theme share their drawing with an earlier name

#### Scenario: Small sets are unique
- **WHEN** canonicalised drawings are generated in each built-in theme for 1,000 distinct normalised names
- **THEN** no two names in the same theme produce identical drawings

### Requirement: SVG string output
The library SHALL return a self-contained, well-formed SVG document string using a 0–100 viewBox.

#### Scenario: Well-formed SVG
- **WHEN** an avatar is generated
- **THEN** the string parses as XML, and its root is an `svg` element in the SVG namespace

### Requirement: Safe SVG content
Every avatar, from a built-in or a custom theme, SHALL contain only elements and attributes on the library's published allowlist. URL references SHALL point only to IDs inside the same document. Any other element, attribute or reference SHALL be rejected with an error at generation time, never written to the output. The allowlist excludes scripts, event handlers, `foreignObject`, `href`/`xlink:href` and `style` attributes.

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

### Requirement: Data URI output
The library SHALL provide the same avatar as a `data:image/svg+xml` URI that works as an image `src` and as a CSS background.

#### Scenario: Data URI decodes to the SVG
- **WHEN** the data URI for a name and theme is decoded
- **THEN** it equals the SVG string output for the same name, theme and options

### Requirement: Size option
Callers SHALL be able to set a pixel size, written as the SVG's width and height. Without a size, the SVG SHALL carry only its viewBox so that it scales to its container. A size that is not a finite number greater than zero SHALL be rejected with a RangeError.

#### Scenario: Explicit size
- **WHEN** an avatar is generated with size 48
- **THEN** the root element has width "48" and height "48"

#### Scenario: No size
- **WHEN** an avatar is generated without a size
- **THEN** the root element has a viewBox and no width or height attributes

#### Scenario: Invalid size
- **WHEN** an avatar is generated with a size of 0, -4, NaN or Infinity
- **THEN** a RangeError is thrown

### Requirement: Corner radius option
Callers SHALL be able to set the corner radius of the avatar's clip, from 0 (square) to 50 (circle), in viewBox units. Values outside that range SHALL be clamped to it. Non-finite values and an omitted radius SHALL both use the default of 24.

#### Scenario: Circle avatar
- **WHEN** an avatar is generated with radius 50
- **THEN** the avatar is clipped to a circle

#### Scenario: Out-of-range radius
- **WHEN** avatars are generated with radius 80 and with radius -10
- **THEN** they render the same as radius 50 and radius 0 respectively

#### Scenario: Non-finite radius
- **WHEN** an avatar is generated with radius NaN
- **THEN** it renders the same as radius 24

### Requirement: Accessible title
Callers SHALL be able to pass a title. When the title is non-empty after trimming, the SVG SHALL include a `<title>` element and `role="img"`. The title text SHALL be XML-escaped, and characters that XML does not allow SHALL be removed. Otherwise the SVG SHALL be marked `aria-hidden="true"`.

#### Scenario: Title is escaped
- **WHEN** an avatar is generated with the title `<b>&"x"` followed by a U+0001 control character
- **THEN** the SVG's `<title>` contains the escaped text without the control character, and the document stays well-formed

#### Scenario: Decorative avatar
- **WHEN** an avatar is generated without a title, or with the title "   "
- **THEN** the root element has `aria-hidden="true"` and no `<title>` element

### Requirement: Element IDs safe to inline together
Every ID an SVG defines SHALL be derived from the theme, the normalised seed and every option that changes a definition (currently the radius). The same avatar therefore always uses the same IDs, while two avatars whose definitions differ, such as the same name at radius 0 and radius 50, get different IDs. The hash space SHALL make accidental clashes negligible. Callers SHALL be able to add a prefix for full isolation.

#### Scenario: Many avatars on one page
- **WHEN** avatars for 20 names in all three themes, each at radius 0, 24 and 50, are inlined into one HTML document
- **THEN** no ID is defined twice with different content

#### Scenario: Same name, different radius
- **WHEN** the avatar for "Claudette" is generated at radius 0 and at radius 50
- **THEN** the two avatars share no defined ID

#### Scenario: ID prefix
- **WHEN** an avatar is generated with idPrefix "nav-"
- **THEN** every ID defined in the SVG starts with "nav-"

#### Scenario: Invalid ID prefix
- **WHEN** an avatar is generated with an idPrefix containing whitespace, "#" or a leading digit
- **THEN** an error is thrown that explains the allowed form (a letter or underscore, then letters, digits, "-" or "_")

### Requirement: Theme selection
Callers SHALL pick a theme either by its built-in id (`mecha`, `critter`, `sigil`) or by passing a theme object. An unknown id SHALL raise an error that names the valid ids. When no theme is given, the default SHALL be Mecha.

#### Scenario: Unknown theme id
- **WHEN** an avatar is requested with the theme "robot"
- **THEN** an error is raised whose message lists "mecha", "critter" and "sigil"

#### Scenario: Default theme
- **WHEN** an avatar is requested without a theme
- **THEN** the output equals the Mecha output for the same name

### Requirement: Custom themes
The library SHALL expose a public API for defining a theme. A theme is an id (lowercase letters, digits and hyphens) plus a draw function. The draw function receives a seeded random source and drawing helpers, and returns a background and content nodes. Custom themes SHALL get determinism, normalisation, the output formats, the safety rules and all options in the same way as built-in themes. An invalid theme id SHALL be rejected when the theme is defined.

#### Scenario: Custom theme renders
- **WHEN** a custom theme that draws a single circle is defined and used to generate an avatar
- **THEN** the output is a valid Chara SVG with the clip, size, title and ID rules applied, and it is deterministic for the name

#### Scenario: Custom theme with a gradient background
- **WHEN** a custom theme registers a gradient definition and uses it as its background
- **THEN** the gradient's ID follows the ID rules, and the background references it

#### Scenario: Invalid theme id
- **WHEN** a theme is defined with the id "My Theme"
- **THEN** an error is thrown

### Requirement: Structured output for renderers
The library SHALL expose the avatar as a tree of plain element nodes (tag, attributes, children), which is what the SVG string is serialised from. This lets other renderers build real elements without parsing markup.

#### Scenario: Tree serialises to the string output
- **WHEN** the tree for a name and theme is serialised with the library's serialiser
- **THEN** the result equals the SVG string output for the same inputs

### Requirement: Built-in themes can be imported without the registry
The library SHALL offer an entry point that generates avatars from a theme object without pulling in the built-in theme registry. Each built-in theme SHALL be importable on its own, so a bundle that uses one theme only includes that theme's drawing code.

#### Scenario: Single-theme bundle
- **WHEN** the documented single-theme example (Sigil only) is bundled with tree-shaking
- **THEN** the bundle contains no Mecha or Critter drawing code

### Requirement: Output stability across versions
The output for any name, theme and options SHALL change only in a semver-breaking release: a new major version from 1.0.0, or a new minor version during 0.x. This covers drawing, normalisation, ID derivation and serialisation. Custom themes are stable only as far as the theme's own code is.

#### Scenario: Golden outputs are locked
- **WHEN** the test suite runs
- **THEN** the outputs for a fixed set of names in every built-in theme match the committed golden snapshots
