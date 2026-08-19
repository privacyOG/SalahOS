# Managed display UX

SalahOS managed displays use a dedicated display surface rather than stretching phone layouts onto televisions or kiosk panels.

## Profiles

- `tv-16x9` is the primary prayer-board profile for 1080p and 4K televisions viewed from several metres away.
- `portrait-foyer` reorganizes prayer rows vertically for portrait foyer signage.
- `touch-display-2` reduces spacing and uses a two-column prayer grid for Raspberry Pi Touch Display 2-class screens viewed at close range.

## Readability

The display surface uses responsive large-type ranges for mosque identity, current time, prayer names, Adhan and Iqamah values. Prayer cards preserve strong contrast and the active prayer receives a stronger border/background treatment rather than relying on colour alone.

## Burn-in mitigation

The component accepts a small `burnInShift` value that offsets the entire frame. A host display controller can periodically rotate a bounded shift without changing content order or prayer semantics. Reduced-motion preferences disable the transition while preserving the positional change.

## Administrator recovery

The display root is keyboard-focusable and treats Escape or Backspace as administrator exit/recovery inputs when an `onAdministratorExit` handler is supplied. The visible footer keeps that recovery path discoverable for keyboard and remote-control operation.

## Boundaries

This surface does not own playlist scheduling, pairing, fleet synchronization or prayer calculation. Those systems provide the content and profile; the display surface renders it. Fullscreen browser/native kiosk activation remains a host-shell responsibility so platform-specific recovery controls are not hidden inside presentation code.
