# Form control examples

## Select

Use the shared `AppSelect` for searchable single-choice fields. Plain options need only `label` and `value`:

```vue
<AppSelect v-model="output" label="Output" :options="[
  { label: 'Format', value: 'formatted' },
  { label: 'Minify', value: 'compact' },
]" />
```

### Grouped options with flags and country search

`group` adds a visible, accessible group heading; consecutive options with the same group are rendered together. Preserve the desired order in the options array. Ungrouped options can precede country groups (for example, UTC first).

`leadingText` adds a decorative emoji chip to the option and selected value. `description` appears below each option and beside the selected label. Search includes labels, values, groups, descriptions, and optional `keywords`. Exact metadata matches take precedence over substring matches (for example, `USA` should not match Jerusalem). Arrow-key navigation skips group headings.

```vue
<AppSelect v-model="zone" label="Time zone" :options="[
  { label: 'UTC', value: 'UTC', leadingText: '🌐', description: 'Coordinated Universal Time' },
  { label: 'America/Sao Paulo', value: 'America/Sao_Paulo', group: 'Brazil', leadingText: '🇧🇷', description: 'Brazil', keywords: ['BR', 'Brasil'] },
  { label: 'America/Chicago', value: 'America/Chicago', group: 'United States', leadingText: '🇺🇸', description: 'United States', keywords: ['US', 'USA'] },
  { label: 'America/New York', value: 'America/New_York', group: 'United States', leadingText: '🇺🇸', description: 'United States', keywords: ['US', 'USA'] },
]" />
```

The Time Zone Converter provides a live example in its **Local zone** field and **Add time zone** dialog. Check light and dark themes, including the Teleported dialog, when changing select states.
