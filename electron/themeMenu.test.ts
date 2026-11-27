import { describe, expect, it } from 'vitest';
import { THEME_MODES, syncThemeMenuChecked, type ThemeMode } from './themeMenu';

// Mimics Electron's radio menu items: assigning `checked` (any value) checks that item and
// unchecks the others in its group.
function createThemeMenu(initial: ThemeMode) {
  const state: Record<string, boolean> = Object.fromEntries(THEME_MODES.map((mode) => [`theme-${mode}`, mode === initial]));
  const items = Object.fromEntries(
    Object.keys(state).map((id) => [
      id,
      {
        get checked() {
          return state[id];
        },
        set checked(_value: boolean) {
          for (const other of Object.keys(state)) state[other] = other === id;
        },
      },
    ]),
  );

  return {
    menu: { getMenuItemById: (id: string) => items[id] ?? null },
    checkedMode: () => THEME_MODES.find((mode) => state[`theme-${mode}`]),
  };
}

describe('syncThemeMenuChecked', () => {
  it.each(THEME_MODES)('leaves only %s checked', (mode) => {
    const { menu, checkedMode } = createThemeMenu('system');

    syncThemeMenuChecked(menu, mode);

    expect(checkedMode()).toBe(mode);
  });

  it('does nothing without a menu', () => {
    expect(() => syncThemeMenuChecked(null, 'dark')).not.toThrow();
  });
});
