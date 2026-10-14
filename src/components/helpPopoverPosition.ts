export interface HelpPopoverRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface HelpPopoverSize {
  width: number;
  height: number;
}

export interface HelpPopoverViewport {
  width: number;
  height: number;
}

export interface HelpPopoverPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
}

/**
 * Places the popover centered above its trigger, flipping below when there is
 * no room above, and clamps it horizontally so it never leaves the viewport.
 */
export function computeHelpPopoverPosition(
  trigger: HelpPopoverRect,
  content: HelpPopoverSize,
  viewport: HelpPopoverViewport,
  gap = 8,
  margin = 8,
): HelpPopoverPosition {
  const centeredLeft = trigger.left + trigger.width / 2 - content.width / 2;
  const maxLeft = Math.max(margin, viewport.width - margin - content.width);
  const left = Math.min(Math.max(centeredLeft, margin), maxLeft);

  const aboveTop = trigger.top - gap - content.height;
  const belowTop = trigger.top + trigger.height + gap;
  const fitsAbove = aboveTop >= margin;
  const fitsBelow = belowTop + content.height <= viewport.height - margin;
  const placement = fitsAbove || !fitsBelow ? 'top' : 'bottom';

  return {
    top: placement === 'top' ? Math.max(aboveTop, margin) : belowTop,
    left,
    placement,
  };
}
