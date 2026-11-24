# Spec Delta

## Purpose

A public demo site where people can type any name, see its avatar in every theme and copy the result, so they can judge Chara before installing it.

## ADDED Requirements

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

### Requirement: Static deployment
The playground SHALL build to static files that work from the GitHub Pages project path `/chara/`.

#### Scenario: Served from a sub-path
- **WHEN** the built site is served from `/chara/`
- **THEN** every asset loads and the page works
