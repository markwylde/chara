# Spec Delta

## Purpose

Turns any name into a unique, deterministic SVG avatar drawn by one of several themes, so applications can give every agent or user a recognisable face without storing images.

## ADDED Requirements

### Requirement: Deterministic output
Given the same name, theme, options and major library version, the library SHALL produce byte-identical SVG output in every supported runtime (Node and modern browsers), with no dependence on global state, call order, time or randomness sources.

#### Scenario: Repeated calls match
- **WHEN** an avatar is generated twice for the name "Claudette" with the Mecha theme
- **THEN** both outputs are byte-identical

#### Scenario: Independent of call order
- **WHEN** avatars for "Imagine" and "Infrado" are generated, and then generated again in the reverse order
- **THEN** each name's output is identical across the two runs

#### Scenario: Same output in Node and browser
- **WHEN** the avatar for "Personelly" in each built-in theme is generated in Node and in a browser
- **THEN** the outputs are byte-identical

### Requirement: Name normalisation
Before seeding, the library SHALL normalise names by applying Unicode NFC, trimming whitespace, collapsing internal whitespace runs to one space and lowercasing. An empty result SHALL be treated as a fixed fallback seed rather than an error. Callers SHALL be able to turn normalisation off.

#### Scenario: Case and spacing are ignored
- **WHEN** avatars are generated for "Claudette", " claudette " and "CLAUDETTE"
- **THEN** all three outputs are identical

#### Scenario: Empty name
- **WHEN** an avatar is generated for "" or "   "
- **THEN** a valid avatar is returned, and it is the same for both inputs

#### Scenario: Normalisation turned off
- **WHEN** avatars for "Claudette" and "claudette" are generated with normalisation turned off
- **THEN** the two outputs differ

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

#### Scenario: Sigil glyph is never trivial
- **WHEN** Sigil avatars are generated for any 1,000 distinct names
- **THEN** every glyph has at least three strokes off the centre column

### Requirement: Distinct avatars across names
Within each built-in theme, different names SHALL produce visually different avatars, with collisions rare in practice.

#### Scenario: No collisions in a sample
- **WHEN** avatars are generated in each built-in theme for 10,000 distinct names
- **THEN** no two names in the same theme produce identical SVG output

### Requirement: SVG string output
The library SHALL return a self-contained, well-formed SVG document string using a 0–100 viewBox. It SHALL have no external references and no scripts, and SHALL use only the defs it defines itself.

#### Scenario: Well-formed SVG
- **WHEN** an avatar is generated
- **THEN** the string parses as XML with an `svg` root element in the SVG namespace, and contains no `<script>`, no event-handler attributes and no external URLs

### Requirement: Data URI output
The library SHALL provide the same avatar as a `data:image/svg+xml` URI that works as an image `src` and as a CSS background.

#### Scenario: Data URI decodes to the SVG
- **WHEN** the data URI for a name and theme is decoded
- **THEN** it equals the SVG string output for the same name, theme and options

### Requirement: Size option
Callers SHALL be able to set a pixel size, written as the SVG's width and height. Without a size, the SVG SHALL carry only its viewBox so that it scales to its container.

#### Scenario: Explicit size
- **WHEN** an avatar is generated with size 48
- **THEN** the root element has width "48" and height "48"

#### Scenario: No size
- **WHEN** an avatar is generated without a size
- **THEN** the root element has a viewBox and no width or height attributes

### Requirement: Corner radius option
Callers SHALL be able to set the corner radius of the avatar's clip, from 0 (square) to 50 (circle), in viewBox units. Values outside that range SHALL be clamped. The default SHALL be 24.

#### Scenario: Circle avatar
- **WHEN** an avatar is generated with radius 50
- **THEN** the avatar is clipped to a circle

#### Scenario: Out-of-range radius
- **WHEN** an avatar is generated with radius 80
- **THEN** it renders the same as radius 50

### Requirement: Accessible title
Callers SHALL be able to pass a title. When a title is given, the SVG SHALL include a `<title>` element and `role="img"`, with the title text XML-escaped. Without a title, the SVG SHALL be marked `aria-hidden="true"`.

#### Scenario: Title is escaped
- **WHEN** an avatar is generated with the title `<b>&"x"`
- **THEN** the SVG's `<title>` contains the escaped text and the document stays well-formed

#### Scenario: Decorative avatar
- **WHEN** an avatar is generated without a title
- **THEN** the root element has `aria-hidden="true"` and no `<title>` element

### Requirement: Collision-free element IDs
Every ID that the SVG defines SHALL be derived from the theme and the normalised seed, so the same avatar always uses the same IDs and different avatars on one page never share an ID. Callers SHALL be able to add a prefix to these IDs.

#### Scenario: Many avatars on one page
- **WHEN** avatars for 20 different names in all three themes are inlined into one HTML document
- **THEN** no ID is defined by two avatars that render differently, and every avatar renders correctly

#### Scenario: ID prefix
- **WHEN** an avatar is generated with idPrefix "nav-"
- **THEN** every ID defined in the SVG starts with "nav-"

### Requirement: Theme selection
Callers SHALL pick a theme either by its built-in id (`mecha`, `critter`, `sigil`) or by passing a theme object. An unknown id SHALL raise an error that names the valid ids. When no theme is given, the default SHALL be Mecha.

#### Scenario: Unknown theme id
- **WHEN** an avatar is requested with the theme "robot"
- **THEN** an error is raised whose message lists "mecha", "critter" and "sigil"

#### Scenario: Default theme
- **WHEN** an avatar is requested without a theme
- **THEN** the output equals the Mecha output for the same name

### Requirement: Custom themes
The library SHALL expose a public API for defining a theme. A theme is an id plus a draw function that receives a seeded random source and drawing helpers, and returns the avatar's content. Custom themes SHALL get determinism, normalisation, the output formats and all options in the same way as built-in themes.

#### Scenario: Custom theme renders
- **WHEN** a custom theme that draws a single circle is defined and used to generate an avatar
- **THEN** the output is a valid Chara SVG with the background clip, size, title and ID rules applied, and it is deterministic for the name

### Requirement: Structured output for renderers
The library SHALL expose the avatar as a tree of plain element nodes (tag, attributes, children), which is what the SVG string is serialised from. This lets other renderers build real elements without parsing markup.

#### Scenario: Tree serialises to the string output
- **WHEN** the tree for a name and theme is serialised with the library's serialiser
- **THEN** the result equals the SVG string output for the same inputs

### Requirement: Output stability across versions
Within a major version, the output for any name, theme and options SHALL NOT change. Any change to the drawing of an existing theme SHALL be released as a new major version.

#### Scenario: Golden outputs are locked
- **WHEN** the test suite runs
- **THEN** the outputs for a fixed set of names in every built-in theme match the committed golden snapshots
