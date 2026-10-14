import { describe, expect, it } from 'vitest';
import { computeHelpPopoverPosition } from './helpPopoverPosition';

const viewport = { width: 1000, height: 800 };
const content = { width: 200, height: 60 };

describe('computeHelpPopoverPosition', () => {
  it('centers the popover above its trigger', () => {
    const position = computeHelpPopoverPosition({ top: 400, left: 500, width: 16, height: 16 }, content, viewport);

    expect(position).toEqual({ top: 400 - 8 - 60, left: 508 - 100, placement: 'top' });
  });

  it('clamps to the left viewport edge instead of extending past it', () => {
    const position = computeHelpPopoverPosition({ top: 400, left: 10, width: 16, height: 16 }, content, viewport);

    expect(position.left).toBe(8);
  });

  it('clamps to the right viewport edge', () => {
    const position = computeHelpPopoverPosition({ top: 400, left: 990, width: 16, height: 16 }, content, viewport);

    expect(position.left).toBe(1000 - 8 - 200);
  });

  it('flips below the trigger when there is no room above', () => {
    const position = computeHelpPopoverPosition({ top: 20, left: 500, width: 16, height: 16 }, content, viewport);

    expect(position).toMatchObject({ top: 20 + 16 + 8, placement: 'bottom' });
  });
});
