import chalk, { type ChalkInstance } from 'chalk'
import { getTheme } from '../theme'
import type { PaletteColor } from '../theme/theme-types'

type ColorKey =
    | 'rosewater'
    | 'flamingo'
    | 'pink'
    | 'mauve'
    | 'red'
    | 'maroon'
    | 'peach'
    | 'yellow'
    | 'green'
    | 'teal'
    | 'sky'
    | 'sapphire'
    | 'blue'
    | 'lavender'
    | 'subtext1'
    | 'subtext0'
    | 'overlay2'
    | 'overlay1'
    | 'overlay0'
    | 'surface2'
    | 'surface1'
    | 'surface0'
    | 'base'
    | 'mantle'
    | 'crust'

const legacyToNew: Record<ColorKey, PaletteColor> = {
    rosewater: 'white',
    flamingo: 'pink',
    pink: 'pink',
    mauve: 'purple',
    red: 'red',
    maroon: 'red',
    peach: 'orange',
    yellow: 'yellow',
    green: 'green',
    teal: 'cyan',
    sky: 'cyan',
    sapphire: 'blue',
    blue: 'blue',
    lavender: 'purple',
    subtext1: 'text',
    subtext0: 'textMuted',
    overlay2: 'gray',
    overlay1: 'gray',
    overlay0: 'gray',
    surface2: 'surface',
    surface1: 'surfaceBright',
    surface0: 'surfaceDim',
    base: 'surfaceDim',
    mantle: 'surfaceDim',
    crust: 'surfaceDim',
}

function hex(color: string): ChalkInstance {
    return chalk.hex(color)
}

export const color: Record<ColorKey, ChalkInstance> = new Proxy(
    {} as Record<ColorKey, ChalkInstance>,
    {
        get(_, key: string) {
            const paletteKey = legacyToNew[key as ColorKey]
            if (!paletteKey) {
                return undefined
            }
            const theme = getTheme()
            return hex(theme.palette[paletteKey])
        },
    },
)

export const colorHex: Record<ColorKey, string> = new Proxy(
    {} as Record<ColorKey, string>,
    {
        get(_, key: string) {
            const paletteKey = legacyToNew[key as ColorKey]
            if (!paletteKey) {
                return ''
            }
            const theme = getTheme()
            return theme.palette[paletteKey]
        },
    },
)

export const display = {
    note: color.sky,
    important: color.pink,
    tip: color.green,
    success: color.green,
    caution: color.mauve,
    warning: color.peach,
    error: color.red,
    highlight: color.mauve,
}

export function tableTitle(strs: string[]) {
    return strs.map((it) => color.green.bold(it))
}

export type { ColorKey }