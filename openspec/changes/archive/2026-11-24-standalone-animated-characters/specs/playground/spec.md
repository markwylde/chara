# Spec Delta

## ADDED Requirements

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
