import chalk, { type ChalkInstance } from "chalk"
import { catppuccinMocha } from "./catppuccin"
import type {
  BoxChalk,
  BoxColorKey,
  DiffChalk,
  DiffColorKey,
  DisplayChalk,
  DisplayColorKey,
  GitFormatChalk,
  GitFormatColorKey,
  PaletteChalk,
  PaletteColor,
  SemanticChalk,
  SemanticColor,
  Theme,
} from "./theme-types"

let currentTheme: Theme = catppuccinMocha

function hex(color: string): ChalkInstance {
  return chalk.hex(color)
}

function createPaletteChalk(theme: Theme): PaletteChalk {
  return Object.entries(theme.palette).reduce((obj, [key, value]) => {
    obj[key as PaletteColor] = hex(value)
    return obj
  }, {} as PaletteChalk)
}

function createSemanticChalk(
  theme: Theme,
  palette: PaletteChalk,
): SemanticChalk {
  return Object.entries(theme.semantic).reduce((obj, [key, value]) => {
    obj[key as SemanticColor] = palette[value]
    return obj
  }, {} as SemanticChalk)
}

function createGitFormatChalk(
  theme: Theme,
  palette: PaletteChalk,
): GitFormatChalk {
  return Object.entries(theme.gitFormat).reduce((obj, [key, value]) => {
    obj[key as GitFormatColorKey] = palette[value]
    return obj
  }, {} as GitFormatChalk)
}

function createDiffChalk(theme: Theme, palette: PaletteChalk): DiffChalk {
  return Object.entries(theme.diff).reduce((obj, [key, value]) => {
    obj[key as DiffColorKey] = palette[value]
    return obj
  }, {} as DiffChalk)
}

function createBoxChalk(theme: Theme, palette: PaletteChalk): BoxChalk {
  return Object.entries(theme.box).reduce((obj, [key, value]) => {
    obj[key as BoxColorKey] = palette[value]
    return obj
  }, {} as BoxChalk)
}

function createDisplayChalk(theme: Theme, palette: PaletteChalk): DisplayChalk {
  return Object.entries(theme.display).reduce((obj, [key, value]) => {
    obj[key as DisplayColorKey] = palette[value]
    return obj
  }, {} as DisplayChalk)
}

function initTheme(theme: Theme) {
  const palette = createPaletteChalk(theme)
  return {
    palette,
    semantic: createSemanticChalk(theme, palette),
    gitFormat: createGitFormatChalk(theme, palette),
    diff: createDiffChalk(theme, palette),
    box: createBoxChalk(theme, palette),
    display: createDisplayChalk(theme, palette),
  }
}

let themeChalk = initTheme(currentTheme)

export function getTheme(): Theme {
  return currentTheme
}

export function setTheme(theme: Theme): void {
  currentTheme = theme
  themeChalk = initTheme(theme)
}

export const palette: PaletteChalk = new Proxy({} as PaletteChalk, {
  get(_, key: string) {
    return themeChalk.palette[key as PaletteColor]
  },
})

export const semantic: SemanticChalk = new Proxy({} as SemanticChalk, {
  get(_, key: string) {
    return themeChalk.semantic[key as SemanticColor]
  },
})

export const gitFormat: GitFormatChalk = new Proxy({} as GitFormatChalk, {
  get(_, key: string) {
    return themeChalk.gitFormat[key as GitFormatColorKey]
  },
})

export const diff: DiffChalk = new Proxy({} as DiffChalk, {
  get(_, key: string) {
    return themeChalk.diff[key as DiffColorKey]
  },
})

export const box: BoxChalk = new Proxy({} as BoxChalk, {
  get(_, key: string) {
    return themeChalk.box[key as BoxColorKey]
  },
})

export const display: DisplayChalk = new Proxy({} as DisplayChalk, {
  get(_, key: string) {
    return themeChalk.display[key as DisplayColorKey]
  },
})

export { catppuccinMocha }
