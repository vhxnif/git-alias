import type { ChalkInstance } from 'chalk'
import { color } from './color-utils'

type RegKey = 'curlyBraces' | 'singleQuotes' | 'doubleQuotes' | 'number'

const reg: Record<RegKey, RegExp> = {
    curlyBraces: /\{([^{}]*)\}/g,
    singleQuotes: /'([^']+)'/g,
    doubleQuotes: /"([^"]+)"/g,
    number: /\d+/g,
}

const printErr = (str: string) => console.log(color.red(str))

const matchReplace = (str: string, reg: RegExp, color: ChalkInstance) =>
    str.replace(reg, (match) => color(match))
const mark = {
    singleQuotes: (str: string) => matchReplace(str, /'([^']+)'/g, color.green),
    doubleQuotes: (str: string) =>
        matchReplace(str, /"([^"]+)"/g, color.maroon),
    path: (str: string) =>
        matchReplace(str, /(\.\.\/)?([\w-]+\/)*[\w-]+\.\w+/g, color.mauve),
    number: (str: string) => matchReplace(str, /\s(\d+)\s/g, color.sky),
}

const printCmdLog = (str: string) => {
    let tmp = str
    Object.values(mark).forEach((it) => {
        tmp = it(tmp)
    })
    console.log(tmp)
}

async function errParse(e: unknown) {
    if (e instanceof Error) {
        printErr(e.message)
        return
    }
    console.log(e)
}

function isEmpty<T>(param: string | T[] | undefined | null) {
    if (!param) {
        return true
    }
    if (typeof param === 'string') {
        return param.length <= 0
    }
    const arr = param as Array<T>
    return arr.length <= 0
}

function lines(str: string, spliter: string = '\n'): string[] {
    return str
        .trim()
        .split(spliter)
        .map((it) => it.trim())
        .filter((it) => it)
}

// ---- Levenshtein distance ---- //
function levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length
    const n = str2.length
    const dp: number[][] = Array(m + 1)
        .fill(null)
        .map(() => Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1]
            } else {
                dp[i][j] =
                    Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1
            }
        }
    }
    return dp[m][n]
}

// ---- Branch name matching utilities ---- //
type MatchType = 'exact-word' | 'starts-with' | 'contains'

interface BranchMatchResult {
    type: MatchType
    distance: number
    distanceScore: number
    isLocal: boolean
}

function tokenizeBranchName(name: string): string[] {
    return name.split(/[-_/.]+/)
}

function getBestMatch(
    input: string,
    branchName: string
): { type: MatchType; distance: number; matchedToken: string } {
    const tokens = tokenizeBranchName(branchName)
    let bestPriority = 0 // 0: contains, 1: starts-with, 2: exact-word
    let bestDistance = levenshteinDistance(input, branchName)
    let bestMatchedToken = branchName

    for (const token of tokens) {
        if (token.toLowerCase() === input.toLowerCase()) {
            return { type: 'exact-word', distance: 0, matchedToken: token }
        }
        if (token.toLowerCase().startsWith(input.toLowerCase())) {
            const dist = levenshteinDistance(input, token)
            if (bestPriority < 1 && dist < bestDistance) {
                bestPriority = 1
                bestDistance = dist
                bestMatchedToken = token
            }
        } else if (token.toLowerCase().includes(input.toLowerCase())) {
            const dist = levenshteinDistance(input, token)
            if (bestPriority < 0 && dist < bestDistance) {
                bestDistance = dist
                bestMatchedToken = token
            }
        }
    }

    const typeMap: Record<number, MatchType> = {
        0: 'contains',
        1: 'starts-with',
        2: 'exact-word',
    }

    return {
        type: typeMap[bestPriority],
        distance: bestDistance,
        matchedToken: bestMatchedToken,
    }
}

function calculateBranchMatchScore(
    input: string,
    branchName: string,
    isRemote: boolean
): BranchMatchResult {
    const { type, distance, matchedToken } = getBestMatch(input, branchName)

    // Calculate distance score (1 for exact match, decreasing as distance increases)
    const maxDistance = Math.max(input.length, matchedToken.length)
    const distanceScore = maxDistance > 0 ? 1 - distance / maxDistance : 1

    return {
        type,
        distance,
        distanceScore,
        isLocal: !isRemote,
    }
}

export {
    type RegKey,
    printCmdLog,
    printErr,
    errParse,
    isEmpty,
    lines,
    reg,
    levenshteinDistance,
    tokenizeBranchName,
    getBestMatch,
    calculateBranchMatchScore,
    type BranchMatchResult,
}
