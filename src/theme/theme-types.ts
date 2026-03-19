import type { ChalkInstance } from "chalk"

export type PaletteColor =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "cyan"
  | "blue"
  | "purple"
  | "pink"
  | "white"
  | "gray"
  | "text"
  | "textMuted"
  | "surface"
  | "surfaceBright"
  | "surfaceDim"

export type SemanticColor =
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "muted"
  | "highlight"

export type GitFormatColorKey =
  | "key"
  | "date"
  | "author"
  | "email"
  | "text"
  | "hash"
  | "add"
  | "remove"
  | "change"
  | "path"
  | "num"
  | "oldHash"
  | "newHash"
  | "tag"

export type DiffColorKey = "oldRowNo" | "newRowNo" | "text"

export type BoxColorKey = "title" | "border"

export type DisplayColorKey =
  | "note"
  | "important"
  | "tip"
  | "success"
  | "caution"
  | "warning"
  | "error"
  | "highlight"

export type Palette = Record<PaletteColor, string>
export type SemanticMapping = Record<SemanticColor, PaletteColor>
export type GitFormatMapping = Record<GitFormatColorKey, PaletteColor>
export type DiffMapping = Record<DiffColorKey, PaletteColor>
export type BoxMapping = Record<BoxColorKey, PaletteColor>
export type DisplayMapping = Record<DisplayColorKey, PaletteColor>

export interface Theme {
  name: string
  displayName: string
  palette: Palette
  semantic: SemanticMapping
  gitFormat: GitFormatMapping
  diff: DiffMapping
  box: BoxMapping
  display: DisplayMapping
}

export type PaletteChalk = Record<PaletteColor, ChalkInstance>
export type SemanticChalk = Record<SemanticColor, ChalkInstance>
export type GitFormatChalk = Record<GitFormatColorKey, ChalkInstance>
export type DiffChalk = Record<DiffColorKey, ChalkInstance>
export type BoxChalk = Record<BoxColorKey, ChalkInstance>
export type DisplayChalk = Record<DisplayColorKey, ChalkInstance>
