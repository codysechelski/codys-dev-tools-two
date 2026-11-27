export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

interface RadioMenuItem {
  checked: boolean;
}

interface MenuLike {
  getMenuItemById(id: string): RadioMenuItem | null;
}

// Checks the View → Theme radio item for `mode`. Only the matching item is assigned: Electron's
// radio items ignore the assigned value and treat any assignment as "check this one and uncheck
// the rest of its group", so writing `checked = false` to the others would check them instead.
export function syncThemeMenuChecked(menu: MenuLike | null, mode: ThemeMode): void {
  const item = menu?.getMenuItemById(`theme-${mode}`);
  if (item) item.checked = true;
}
