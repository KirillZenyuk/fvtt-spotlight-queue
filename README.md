# Spotlight Queue

A lightweight Foundry VTT module for managing a player spotlight queue.

## Usage

Players use the floating controls to request spotlight time:

- Speak
- Act
- React
- Question
- Urgent, as a visual modifier for the current request

Each player can have one active request. Pressing a different request type
updates the request without changing its queue position. Pressing the active
type again removes the request.

The queue panel is visible to everyone. Gamemasters can resolve requests, move
requests up or down, and clear the whole queue.

## Development

This module is plain JavaScript and does not require a build step.

For local development, place or symlink this repository into your Foundry VTT
data directory:

```text
Data/modules/fvtt-spotlight-queue
```

Then enable **Spotlight Queue** in the world's **Manage Modules** dialog.

## Files

- `module.json` - Foundry VTT module manifest.
- `scripts/spotlight-queue.js` - module entry point.
- `styles/spotlight-queue.css` - module styles.
- `lang/` - localization files.

## UI Position

The queue panel and player controls can be dragged to a custom position. The
position is saved per client. Double-click the drag handle to reset it.
