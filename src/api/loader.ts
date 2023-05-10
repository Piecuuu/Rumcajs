import { dirname, importx } from "@discordx/importer";

const folder = dirname(import.meta.url)
importx(`${folder}/routes/**/*.{ts,js}`).then(() => {})
