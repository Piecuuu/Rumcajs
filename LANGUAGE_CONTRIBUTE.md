# How to contribute to the translations

## Creating a translation
### Creating `lang/xx_XX.yml`:
* First, create the file `xx_XX.yml` in the `lang` folder. It is a file in the yaml format. `xx_XX` is the placeholder for your language code. An example being `en_US`.
* Second, [update `src/handlers/lang.ts`](#updating-srchandlerslangts).

### Updating `src/handlers/lang.ts`

At the end of the file is the `LanguageFlags` enum.

The format for entries is:
```ts
"FLAG" = "xx_XX"
```
Example:
```ts
export enum LanguageFlags {
  "🇵🇱" = "pl_PL",
}
```
Multiple entries example:
```ts
export enum LanguageFlags {
  "🇵🇱" = "pl_PL",
  "🇺🇸" = "en_US",
  "🇦🇺" = "en_US",
  "🇬🇧" = "en_US",
  "🇨🇦" = "en_US",
  "🇺🇦" = "ru_UA",
  "🇲🇪" = "empire_Latn",
}
```

## Updating an existing translation
* Edit a language file in the `lang` directory in the project root.

### Crediting yourself on translations
You may credit yourself at the beggining of the translation file you edited with a comment. You may add a link to your **GitHub** profile or your **GitHub** username. You may also add your **Discord** username, or **Discord** user ID. You may not put any other links to websites that are not _[github.com](https://github.com)_.
