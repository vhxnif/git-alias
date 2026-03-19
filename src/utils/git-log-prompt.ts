import {
    createPrompt,
    useEffect,
    useKeypress,
    useMemo,
    useState,
} from '@inquirer/core'
import type { ChalkInstance } from 'chalk'
import clipboard from 'clipboardy'
import type { ILLMClient } from '../llm/llm-types'
import { OllamaClient } from '../llm/ollama-client'
import { OpenAiClient } from '../llm/open-ai-client'
import { type TableConfig, table } from '../table'
import { color, colorHex, display, tableTitle } from './color-utils'
import { isEmpty } from './common-utils'
import { gitDiffBoxParse } from './git-diff-format'
import { formatGitShow } from './git-show-format'
import { exec, exit, terminal } from './platform-utils'
import { gitDiffSummary } from './prompt'
import { tableColumnWidth, tableDefaultConfig } from './table-utils'

export type GitLog = {
    hash: string
    date: string
    author: string
    time: string
    message: string
    ref: string[]
    body: string
    commitHash: string
    humanDate: string
}

type Mode = 'PAG' | 'ROW'
export type GitLogKey = keyof GitLog

export type GitLogConfig = {
    data: GitLog[]
    pageSize?: number
}

type ViewMode = 'LIST' | 'DETAIL' | 'DIFF' | 'AI_SUMMARY'

type DiffState = {
    files: DiffFile[]
    selectedIndex: number
    parentHash: string
}

type DiffFile = {
    name: string
    content: string
}

type LogDetail = {
    showDetail: string
    branchDetail: string
}

function gitLogValueFilter(logs: GitLog[], columns: GitLogKey[]): string[] {
    return logs.reduce((res, it) => {
        Object.entries(it)
            .filter((i) => columns.includes(i[0] as GitLogKey))
            .forEach((i) => {
                const v = i[1]
                if (typeof v === 'string') {
                    res.push(v)
                } else {
                    res.push(...v)
                }
            })
        return res
    }, [] as string[])
}

function maxWidth(strs: string[]): number {
    return strs
        .map((it) => Bun.stringWidth(it))
        .reduce((res, it) => (it > res ? it : res), 0)
}

function tableConfig(tableData: GitLog[]): TableConfig {
    const logFilter = (columns: GitLogKey[]) =>
        gitLogValueFilter(tableData, columns)
    const columnLimit = (terminal.column > 80 ? 80 : terminal.column) - 12
    const col1 = maxWidth(logFilter(['hash', 'date']))
    const col2 = maxWidth(logFilter(['author', 'time']))
    const col3 = columnLimit - col1 - col2
    return {
        ...tableDefaultConfig,
        columns: [
            {
                alignment: 'justify',
                width: col1,
            },
            {
                alignment: 'justify',
                width: col2,
            },
            {
                alignment: 'justify',
                width: col3,
            },
        ],
    } as TableConfig
}

function gitLogToTableData(
    logs: GitLog[],
    selectedIdx: number,
    yanked?: boolean
): string[][] {
    return logs.map((l, idx) => {
        const { hash, author, message, time, date, ref } = l
        const { yellow, blue, pink, mauve, surface2 } = color
        const refStr = ref.map(refParse).join('\n')
        const selectedMark = () => {
            if (selectedIdx === idx) {
                return `${
                    yanked
                        ? surface2.bold.bgHex(colorHex.sky)(hash)
                        : surface2.bold.bgHex(colorHex.yellow)(hash)
                }\n${mauve(date)}`
            }
            return `${yellow(hash)}\n${mauve(date)}`
        }

        return [
            selectedMark(),
            `${blue(author)}\n${mauve(time)}`,
            !isEmpty(refStr) ? `${pink(message)}\n${refStr}` : pink(message),
        ]
    })
}

function refParse(name: string): string {
    const branch = '\u21c4'
    const tag = '\u2691'
    const match = (str: string) => name.trim().startsWith(str)
    const iconShow = (icon: string, c: ChalkInstance) =>
        c(`${icon} ${name.trim()}`)
    if (match('origin')) {
        return iconShow(branch, color.sky)
    }
    if (match('HEAD ->')) {
        return iconShow(branch, color.green)
    }
    if (match('tag:')) {
        return iconShow(tag, color.red)
    }
    return iconShow(branch, color.peach)
}

type PageTableArg = {
    logs: GitLog[]
    selectedIdx: number
    yanked?: boolean
}

function pageTable({ logs, selectedIdx, yanked }: PageTableArg): string {
    return table.render(
        [
            tableTitle(['Hash\nDate', 'Author\nTime', 'Message\nRef']),
            ...gitLogToTableData(logs, selectedIdx, yanked),
        ],
        tableConfig(logs)
    )
}

function cardTableConfig() {
    return {
        ...tableDefaultConfig,
        columns: [
            {
                alignment: 'left',
                width: tableColumnWidth,
            },
        ],
    } as TableConfig
}

// --- Refactored Detail Formatting End ---

function rowCard(
    detailInfo: LogDetail | undefined,
    branchShow: boolean = false
): string {
    if (!detailInfo) {
        return table.render([['']], cardTableConfig())
    }
    const { showDetail, branchDetail } = detailInfo
    let display = formatGitShow(showDetail, { filePathWidth: tableColumnWidth }) // <-- Using new refactored function
    if (branchShow) {
        const bfFormat = branchInfoFormat(branchDetail)
        display = `${display}\n${color.mauve(
            '-'.repeat(tableColumnWidth)
        )}\n${bfFormat}`
    }
    return table.render([[display]], cardTableConfig())
}

function branchInfoFormat(branchInfo: string): string {
    const { green, red, yellow } = color
    const ft = (str: string) => {
        if (str.startsWith('*')) {
            return green(str)
        }
        if (str.startsWith('  remotes/')) {
            return red(str)
        }
        return yellow(str)
    }
    return branchInfo.split('\n').map(ft).join('\n')
}

function pages(data: GitLog[], pageSize: number): GitLog[][] {
    return data.reduce((arr, it) => {
        const last = arr[arr.length - 1]
        if (!last || last.length === pageSize) {
            arr.push([it])
        } else {
            last.push(it)
        }
        return arr
    }, [] as GitLog[][])
}

function prevIdx(idx: number): number {
    if (idx === -1) {
        return 0
    }
    const prev = idx - 1
    return prev < 0 ? idx : prev
}

function nextIdx(idx: number, length: number): number {
    if (idx === -1) {
        return 0
    }
    const next = idx + 1
    return next > length - 1 ? idx : next
}

type KeyHelp = { desc: string; key: string }

function _formatKeyLine(desc: string, key: string, width: number): string {
    const keyStr = color.teal(`<${key}>`)
    const descStr = color.blue(desc)
    const paddingWidth =
        width - Bun.stringWidth(descStr) - Bun.stringWidth(keyStr)
    const padding = '.'.repeat(paddingWidth > 0 ? paddingWidth : 0)
    return `${descStr}${color.surface2(padding)}${keyStr}`
}

function _createPlaceholder(width: number): string {
    return color.surface2(
        '· '
            .repeat(width / 2)
            .trim()
            .padEnd(width)
    )
}

function _renderKeyHelp(normalKeys: KeyHelp[], rowKeys: KeyHelp[]): string {
    const calcWidth = (keys: KeyHelp[]) =>
        maxWidth(keys.map((k) => `${k.desc} <${k.key}>`)) + 4

    const normalColWidth = calcWidth(normalKeys)
    const rowColWidth = calcWidth(rowKeys)
    const maxRows = Math.max(normalKeys.length, rowKeys.length)

    const helpLines: string[] = []
    const normalTitle = 'NORMAL MODE'.padEnd(normalColWidth)
    const rowTitle = 'ROW MODE'.padEnd(rowColWidth)

    helpLines.push(
        ` ${display.highlight.bold(normalTitle)}   ${display.highlight.bold(
            rowTitle
        )}`
    )
    helpLines.push(
        ` ${color.mauve('-'.repeat(normalColWidth))}   ${color.mauve(
            '-'.repeat(rowColWidth)
        )}`
    )

    for (let i = 0; i < maxRows; i++) {
        const normalKey = normalKeys[i]
        const normalLine = normalKey
            ? _formatKeyLine(normalKey.desc, normalKey.key, normalColWidth)
            : _createPlaceholder(normalColWidth)

        const rowKey = rowKeys[i]
        const rowLine = rowKey
            ? _formatKeyLine(rowKey.desc, rowKey.key, rowColWidth)
            : _createPlaceholder(rowColWidth)

        helpLines.push(` ${normalLine}   ${rowLine}`)
    }

    return `\n${helpLines.join('\n')}`
}

function normalKeyMap(): KeyHelp[] {
    return [
        { desc: 'Switch Mode', key: 'space' },
        { desc: 'Up', key: 'k' },
        { desc: 'Down', key: 'j' },
        { desc: 'Quit', key: 'q' },
        { desc: 'Clear', key: 'c' },
    ]
}

function rowKeyMap(): KeyHelp[] {
    return [
        { desc: 'Yank Hash', key: 'y' },
        { desc: 'Show Branches', key: 'b' },
        { desc: 'AI Summary', key: 's' },
        { desc: 'Commit Diff', key: 'd' },
        { desc: 'View Details', key: 'enter' },
    ]
}

function key(desc: string, value: string): string {
    return `${desc} ${color.teal(`<${value}>`)}`
}

function statusPrompt({
    mode,
    data,
    pageIdx,
    rowIdx,
}: {
    mode: Mode
    data: GitLog[][]
    pageIdx: number
    rowIdx: number
}): string {
    const modeColor: Record<Mode, ChalkInstance> = {
        PAG: color.surface2.bold.bgHex(colorHex.green),
        ROW: color.surface2.bold.bgHex(colorHex.yellow),
    }
    const modeStatus = `${modeColor[mode](` ${mode} `)}`
    const help = `(Press${key('', 'h')} to view the key mapping.)`
    if (mode === 'PAG') {
        return `${key(modeStatus, `${pageIdx + 1}/${data.length}`)} ${help}`
    }
    return `${key(modeStatus, `${rowIdx + 1}/${data[pageIdx].length}`)} ${help}`
}

export default createPrompt<void, GitLogConfig>((config, _done) => {
    const { data, pageSize = 5 } = config
    const dataPages = pages(data, pageSize)

    const client: ILLMClient =
        process.env.GIT_ALIAS === 'ollama'
            ? new OllamaClient()
            : new OpenAiClient()

    const [viewStack, setViewStack] = useState<ViewMode[]>(['LIST'])
    const [mode, setMode] = useState<Mode>('PAG')
    const [pageIdx, setPageIdx] = useState<number>(0)
    const [rowIdx, setRowIdx] = useState<number>(-1)
    const [show, setShow] = useState<string>(
        pageTable({ logs: dataPages[0], selectedIdx: -1 })
    )
    const [keyBar, setKeyBar] = useState<boolean>(false)

    const [detailInfo, setDetailInfo] = useState<LogDetail | null>(null)
    const [showBranch, setShowBranch] = useState<boolean>(false)
    const [diffState, setDiffState] = useState<DiffState | null>(null)
    const [aiSummaryStream, setAiSummaryStream] = useState<string>('')

    const currentView = viewStack[viewStack.length - 1]
    const commitHash = dataPages[pageIdx]?.[rowIdx]?.commitHash

    const pushView = (view: ViewMode) => setViewStack([...viewStack, view])
    const popView = () => {
        if (viewStack.length > 1) {
            setViewStack(viewStack.slice(0, -1))
            setDiffState(null)
            setDetailInfo(null)
            setShowBranch(false)
            setAiSummaryStream('')
        } else {
            exit()
        }
    }

    const refreshTableShow = (pIdx: number, rIdx: number, yanked?: boolean) => {
        setShow(
            pageTable({
                logs: dataPages[pIdx],
                selectedIdx: rIdx,
                yanked,
            })
        )
    }

    const logDetailInfo = useMemo<Promise<LogDetail | undefined>>(async () => {
        if (commitHash) {
            return {
                showDetail: await exec(`git show --stat ${commitHash}`),
                branchDetail: await exec(
                    `git branch -a --contains ${commitHash}`
                ),
            }
        }
        return void 0
    }, [pageIdx, rowIdx])

    useEffect(() => {
        setShowBranch(false)
    }, [pageIdx, rowIdx])

    const changeMode = (m: Mode) => {
        setMode(m === 'PAG' ? 'ROW' : 'PAG')
        const rIdx = m === 'PAG' ? 0 : -1
        setRowIdx(rIdx)
        refreshTableShow(pageIdx, rIdx)
    }

    const getNewIdx = (newIdx: number, setState: (n: number) => void) => {
        setState(newIdx)
        return newIdx
    }
    const pageIdxMove = (newIdx: number) => getNewIdx(newIdx, setPageIdx)
    const rowIdxMove = (newIdx: number) => getNewIdx(newIdx, setRowIdx)
    const pagePrevIdx = (pIdx: number) => pageIdxMove(prevIdx(pIdx))
    const pageNextIdx = (pIdx: number) =>
        pageIdxMove(nextIdx(pIdx, dataPages.length))
    const rowPrevIdx = (rIdx: number) => rowIdxMove(prevIdx(rIdx))
    const rowNextIdx = (pIdx: number, rIdx: number) =>
        rowIdxMove(nextIdx(rIdx, dataPages[pIdx].length))

    const isPage = () => mode === 'PAG'

    const prev = (pIdx: number, rIdx: number) => {
        if (isPage()) {
            refreshTableShow(pagePrevIdx(pIdx), rIdx)
            return
        }
        refreshTableShow(pIdx, rowPrevIdx(rIdx))
    }

    const next = (pIdx: number, rIdx: number) => {
        if (isPage()) {
            refreshTableShow(pageNextIdx(pIdx), rIdx)
            return
        }
        refreshTableShow(pIdx, rowNextIdx(pIdx, rIdx))
    }

    const yankHash = (pIdx: number, rIdx: number) => {
        if (isPage()) {
            return
        }
        const { commitHash } = dataPages[pIdx][rIdx]
        clipboard.writeSync(commitHash)
        refreshTableShow(pIdx, rIdx, true)
    }

    const enterDetailView = async () => {
        if (isPage()) return
        const info = await logDetailInfo
        if (info) {
            setDetailInfo(info)
            pushView('DETAIL')
        }
    }

    const toggleBranchInDetail = async () => {
        if (currentView !== 'DETAIL') return
        setShowBranch(!showBranch)
    }

    const enterDiffView = async () => {
        if (isPage()) return
        if (!commitHash) return

        const res = await exec(`git log -1 ${commitHash} --pretty=%P`)
        const pHash = res.split(' ')[0]
        const diffStr = await exec(`git diff ${pHash} ${commitHash}`)
        const diffBoxs = gitDiffBoxParse(diffStr)

        if (diffBoxs.length === 0) return

        setDiffState({
            files: diffBoxs.map((b) => ({
                name: b.fileName(),
                content: b.text(),
            })),
            selectedIndex: 0,
            parentHash: pHash,
        })
        pushView('DIFF')
    }

    const enterAiSummary = async () => {
        if (isPage()) return
        if (!commitHash) return

        pushView('AI_SUMMARY')

        const diff = await exec(`git show ${commitHash}`)
        let current = ''
        await client.stream({
            messages: [client.system(gitDiffSummary), client.user(diff)],
            model: client.defaultModel(),
            f: async (str: string) => {
                current = current + str
                setAiSummaryStream(current)
            },
        })
    }

    const handleListKey = (key: { name: string }) => {
        switch (key.name) {
            case 'space':
                changeMode(mode)
                break
            case 'h':
                setKeyBar(!keyBar)
                break
            case 'j':
                next(pageIdx, rowIdx)
                break
            case 'k':
                prev(pageIdx, rowIdx)
                break
            case 'return':
                enterDetailView()
                break
            case 'd':
                enterDiffView()
                break
            case 's':
                enterAiSummary()
                break
            case 'y':
                yankHash(pageIdx, rowIdx)
                break
            case 'q':
                exit()
                break
        }
    }

    const handleDetailKey = (key: { name: string }) => {
        switch (key.name) {
            case 'b':
                toggleBranchInDetail()
                break
            case 'q':
            case 'return':
                popView()
                break
        }
    }

    const handleDiffKey = (key: { name: string }) => {
        if (!diffState) return
        switch (key.name) {
            case 'j':
                if (diffState.selectedIndex < diffState.files.length - 1) {
                    setDiffState({
                        ...diffState,
                        selectedIndex: diffState.selectedIndex + 1,
                    })
                }
                break
            case 'k':
                if (diffState.selectedIndex > 0) {
                    setDiffState({
                        ...diffState,
                        selectedIndex: diffState.selectedIndex - 1,
                    })
                }
                break
            case 'q':
                popView()
                break
        }
    }

    const handleSummaryKey = (key: { name: string }) => {
        switch (key.name) {
            case 'q':
                popView()
                break
        }
    }

    useKeypress(async (key, rl) => {
        rl.clearLine(0)
        switch (currentView) {
            case 'LIST':
                handleListKey(key)
                break
            case 'DETAIL':
                handleDetailKey(key)
                break
            case 'DIFF':
                handleDiffKey(key)
                break
            case 'AI_SUMMARY':
                handleSummaryKey(key)
                break
        }
    })

    const status = () => {
        const s = statusPrompt({
            mode,
            pageIdx,
            rowIdx,
            data: dataPages,
        })
        if (keyBar && currentView === 'LIST') {
            return `${s}${_renderKeyHelp(normalKeyMap(), rowKeyMap())}`
        }
        return s
    }

    if (currentView === 'LIST') {
        return `${show}${status()}`
    }

    if (currentView === 'DETAIL' && detailInfo) {
        return `${rowCard(detailInfo, showBranch)}\n${color.teal('<b>')} ${color.blue('toggle branch')} ${color.teal('<q/return>')} ${color.blue('back')}`
    }

    if (currentView === 'DIFF' && diffState) {
        const { files, selectedIndex } = diffState
        const fileList = files
            .map((f, i) =>
                i === selectedIndex
                    ? color.yellow(`▶ ${f.name}`)
                    : color.overlay1(`  ${f.name}`)
            )
            .join('\n')
        const selectedFile = files[selectedIndex]
        const { blue, yellow, mauve } = color
        const { author, humanDate } = dataPages[pageIdx][rowIdx]
        return `${blue.bold(author)} (${mauve(humanDate)}) ${yellow(commitHash)}

${color.teal.bold('Files:')}
${fileList}

${selectedFile.content}

${color.teal('<j/k>')} ${color.blue('switch file')} ${color.teal('<q>')} ${color.blue('back')}`
    }

    if (currentView === 'AI_SUMMARY') {
        const { blue, yellow, mauve } = color
        const { author, humanDate } = dataPages[pageIdx][rowIdx]
        return `${blue.bold(author)} (${mauve(humanDate)}) ${yellow(commitHash)}

${aiSummaryStream}

${color.teal('<q>')} ${color.blue('back')}`
    }

    return ''
})
