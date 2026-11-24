# playground Specification

## Purpose
A public demo site where people can type any name, see its avatar in every theme and copy the result, so they can judge Chara before installing it.

## Requirements

### Requirement: Live name preview
The playground SHALL show the avatar for a name the visitor types in every built-in theme, updating as they type.

#### Scenario: Typing updates avatars
- **WHEN** a visitor types "Maple" into the name field
- **THEN** the Mecha, Critter and Sigil avatars for "Maple" are shown

### Requirement: Option controls
The playground SHALL let visitors change the size and corner radius, and SHALL preview the avatars on both a light and a dark surface.

#### Scenario: Circle preview
- **WHEN** the visitor sets the radius to the maximum
- **THEN** every preview avatar is shown as a circle

### Requirement: Sample gallery
The playground SHALL show a grid of avatars for a fixed list of sample names in the selected theme, so visitors can see how varied the theme is.

#### Scenario: Gallery follows the theme
- **WHEN** the visitor selects the Critter theme
- **THEN** the gallery shows Critter avatars for every sample name

### Requirement: Copy output
The playground SHALL let visitors copy the current avatar as an SVG and as a usage snippet for the React package, and SHALL confirm when the copy succeeds.

#### Scenario: Copy SVG
- **WHEN** the visitor selects "Copy SVG" for a theme
- **THEN** that avatar's SVG string is on the clipboard, and the page says it was copied

#### Scenario: React snippet reflects current options safely
- **WHEN** the visitor types the name `Ma"p{le}` with radius 50 and selects "Copy React"
- **THEN** the copied snippet is valid JSX that renders that exact name with the current theme, size and radius

#### Scenario: Clipboard refused
- **WHEN** the browser refuses clipboard access
- **THEN** the page shows the text selected in a field for manual copying, and says that copying failed

### Requirement: Static deployment
The playground SHALL build to static files that work from the GitHub Pages project path `/chara/`.

#### Scenario: Served from a sub-path
- **WHEN** the built site is served from `/chara/`
- **THEN** every asset loads and the page works

### Requirement: Variant, animation and colour controls
The playground SHALL let visitors switch every avatar between the tile and standalone variants, turn animation on and choose a state for the standalone previews in the theme sheets, and turn colour off. State and animation controls SHALL be unavailable while the tile variant is selected, and their earlier values SHALL NOT apply to tiles. The sample gallery follows the variant and colour settings but is never animated.

#### Scenario: Switching to standalone
- **WHEN** the visitor selects "Standalone"
- **THEN** every preview avatar is drawn without a background

#### Scenario: Choosing a state
- **WHEN** the visitor selects "Standalone", turns on animation and selects "Sleeping"
- **THEN** every preview avatar in the theme sheets has the sleeping state, and the gallery avatars have no state

#### Scenario: Controls disabled for tiles
- **WHEN** the tile variant is selected
- **THEN** the animation and state controls are disabled

#### Scenario: Back to tiles after animating
- **WHEN** the visitor selects "Standalone", turns on animation, selects "Tile" again and then selects "Copy SVG" and "Copy React"
- **THEN** the previews show tiles with no error, and the copied output has no animation or state

#### Scenario: No colour
- **WHEN** the visitor turns on "No colour"
- **THEN** every preview avatar is drawn in greys

### Requirement: Large sizes
The playground SHALL let visitors preview avatars up to at least 320 pixels without the page scrolling sideways.

#### Scenario: Maximum size on a phone
- **WHEN** the size is set to the maximum at a 400 pixel wide viewport
- **THEN** the page does not scroll horizontally

### Requirement: Copy output reflects the new options
Copy SVG and Copy React SHALL reflect the selected variant, animation, state and colour settings, and SHALL omit options left at their defaults.

#### Scenario: Copy React for an animated character
- **WHEN** the visitor selects standalone, animation, the "working" state and no colour, then selects "Copy React"
- **THEN** the snippet is valid JSX containing `variant="standalone"`, `animated`, `state="working"` and `mono`

#### Scenario: Defaults are omitted
- **WHEN** the visitor copies the React snippet with the tile variant and colour on
- **THEN** the snippet contains none of `variant`, `animated`, `state` or `mono`
