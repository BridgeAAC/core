# Translations

BridgeAAC's interface is in English, Spanish, French, German, Portuguese, Italian, Arabic, Chinese (Mandarin), Hindi and Tagalog.

## How it works

Interface text goes through `t()` from `src/i18n/t.ts`. The English text is the key:

```tsx
<h2>{t('Settings')}</h2>
toast(t('Opened "{0}" ({1} pages)', name, count));
```

`{0}`, `{1}` and so on are replaced by the extra arguments. Each language is a dictionary in `src/locales/<code>.ts`, loaded only when that language is in use, and cached for offline use like the rest of the app. A string with no translation shows in English.

The interface follows the board's language unless a language is picked in Settings > Display > App Interface Language.

Built-in content that is spoken (planner tasks, moods, games, About Me defaults) is kept in English in `src/ui/ToolsModal.tsx` and translated where it's shown or spoken, so `t(task.title)` works for the built-in tasks and leaves the user's own tasks as typed. For the Sentence Builder game, the translation of a target sentence is written as space-separated words with no punctuation, one tile per word.

Board words live in `src/data/multilingual.ts`, the Phrases soundboard in `src/data/soundboard-i18n.ts`, and the starting-board picker in `src/ui/pageset-i18n.ts`.

## Adding or changing text

1. Wrap new interface text in `t()`.
2. Run `npm run i18n:check` to list strings that are missing in each language.
3. Add the translations to every file in `src/locales/`.

`npm test` fails if any `t("...")` string is missing from a language, or if a translation drops a `{0}` placeholder.
