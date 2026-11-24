## MODIFIED Requirements

### Requirement: Live name preview
The playground SHALL show the avatar for a name the visitor types in every built-in theme, updating as they type, and SHALL show the selected theme's avatar large on a stage. It SHALL offer a way to pick a random name.

#### Scenario: Typing updates avatars
- **WHEN** a visitor types "Claudette" into the name field
- **THEN** the Mecha, Critter and Sigil avatars for "Claudette" are shown in the theme tabs, and the stage shows the selected theme's avatar for "Claudette"

### Requirement: Option controls
The playground SHALL let visitors change the size and corner radius, with presets for common values, and SHALL be able to preview the avatar on a light and a dark surface together, on either alone, on a transparent backdrop and on a colour the visitor chooses.

#### Scenario: Circle preview
- **WHEN** the visitor selects tiles and sets the radius to the maximum
- **THEN** every stage avatar is shown as a circle

#### Scenario: Custom backdrop
- **WHEN** the visitor chooses a backdrop colour
- **THEN** the stage shows the avatar on that colour

### Requirement: Sample gallery
The playground SHALL show a grid of avatars for a fixed list of sample names in the selected theme and with the studio's variant, animation, state and colour settings, so visitors can see how varied the theme is. Visitors SHALL be able to change the gallery's avatar size and how many names it shows, and selecting a name SHALL load it into the studio.

#### Scenario: Gallery follows the theme
- **WHEN** the visitor selects the Sigil theme
- **THEN** the gallery shows Sigil avatars for every sample name

#### Scenario: Gallery animates
- **WHEN** animation is on and the visitor selects the "working" state
- **THEN** every gallery avatar has the working state and is animating

#### Scenario: Picking a name
- **WHEN** the visitor selects "Biscuit" in the gallery
- **THEN** the name field holds "Biscuit"

### Requirement: Copy output
The playground SHALL show the current avatar as a React snippet, a JavaScript snippet, an SVG and a data URI, SHALL let visitors copy whichever is shown and download the SVG, and SHALL confirm when a copy succeeds.

#### Scenario: Copy SVG
- **WHEN** the visitor shows the SVG output and selects copy
- **THEN** that avatar's SVG string is on the clipboard, and the page says it was copied

#### Scenario: React snippet reflects current options safely
- **WHEN** the visitor types the name `Ma"p{le}` with tiles and radius 50 and copies the React snippet
- **THEN** the copied snippet is valid JSX that renders that exact name with the current theme, size and radius

#### Scenario: JavaScript snippet and data URI
- **WHEN** the visitor copies the JavaScript snippet and then the data URI
- **THEN** the snippet is a `createAvatar` call with the current options, and the data URI equals the library's output for them

#### Scenario: Clipboard refused
- **WHEN** the browser refuses clipboard access
- **THEN** the page shows the text selected in a field for manual copying, and says that copying failed

### Requirement: Variant, animation and colour controls
The playground SHALL let visitors switch every avatar between the tile and standalone variants, turn animation on, choose a state from a picker that previews every state, cycle through the states automatically, and turn colour off. Animation and state SHALL NOT apply to tiles: the animation controls are unavailable while the tile variant is selected, and choosing a state switches to the standalone variant with animation on. The stage, the app examples and the gallery all follow these settings.

#### Scenario: Switching to standalone
- **WHEN** the visitor selects "Standalone"
- **THEN** the stage, app example and gallery avatars are drawn without a background

#### Scenario: Choosing a state
- **WHEN** the visitor selects "Sleeping" in the state picker
- **THEN** the stage avatars have the sleeping state

#### Scenario: Controls disabled for tiles
- **WHEN** the tile variant is selected
- **THEN** the animate and cycle controls are disabled, and no avatar outside the state picker is animated

#### Scenario: Choosing a state from tiles
- **WHEN** the tile variant is selected and the visitor picks the "Working" state
- **THEN** the standalone variant and animation are selected, and the stage avatars have the working state

#### Scenario: Back to tiles after animating
- **WHEN** the visitor picks a state, selects "Tile" again and then copies the SVG and the React snippet
- **THEN** the previews show tiles with no error, and the copied output has no animation or state

#### Scenario: Cycling
- **WHEN** the visitor turns on cycling
- **THEN** the stage moves to the next state without further input, and picking a state turns cycling off

#### Scenario: No colour
- **WHEN** the visitor turns on "No colour"
- **THEN** every avatar on the page is drawn in greys

### Requirement: Large sizes
The playground SHALL let visitors preview avatars up to at least 400 pixels without the page scrolling sideways.

#### Scenario: Maximum size on a phone
- **WHEN** the stage, icon and gallery sizes are set to their maximums at a 400 pixel wide viewport
- **THEN** the page does not scroll horizontally, and the stage avatar keeps its proportions

## ADDED Requirements

### Requirement: App examples
The playground SHALL show the avatars inside example interface chrome (a sidebar list, a chat thread and a profile card), with an icon size the visitor can change independently of the stage, a light or dark surface, and optional per-bot statuses.

#### Scenario: Icon size
- **WHEN** the visitor sets the icon size to 56 pixels
- **THEN** the sidebar and chat avatars are 56 pixels, and the stage avatar is unchanged

#### Scenario: Mixed statuses
- **WHEN** animation is on with mixed statuses
- **THEN** the example bots show different states, an offline bot is drawn without colour, and the visitor's own name follows the selected state

### Requirement: Advanced options
The playground SHALL let visitors set an accessible title and an id prefix and turn name normalisation off, and SHALL reflect them in the previews and the output. An id prefix the library would reject SHALL be reported next to the field and not applied.

#### Scenario: Title
- **WHEN** the visitor enters a title
- **THEN** the stage avatar is exposed as an image with that title

#### Scenario: Invalid prefix
- **WHEN** the visitor enters an id prefix starting with a digit
- **THEN** the field is marked invalid and the page shows no error

### Requirement: Shareable settings
The playground SHALL keep every setting that differs from its default in the page URL, SHALL restore the settings from the URL on load, ignoring unknown or out-of-range values, and SHALL offer a reset to the defaults.

#### Scenario: Reload
- **WHEN** the visitor changes the name, theme, size, state and colour and reloads the page
- **THEN** the same settings are shown

#### Scenario: Reset
- **WHEN** the visitor selects reset
- **THEN** every setting returns to its default and the URL has no query

### Requirement: Page appearance
The playground SHALL follow the visitor's system light or dark preference by default, and SHALL let them force either.

#### Scenario: Forcing dark
- **WHEN** the visitor selects the dark appearance on a light system
- **THEN** the page is drawn dark, and still is after a reload
