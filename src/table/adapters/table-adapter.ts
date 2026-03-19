import { type TableUserConfig, table } from 'table'
import { terminal } from '../../utils/platform-utils'
import type {
    ITablePort,
    TableAlignment,
    TableBorderConfig,
    TableConfig,
    TableData,
    TableLayoutConfig,
} from '../table-port'

// table 库特有的边框配置
const tableBorderConfig: TableBorderConfig = {
    topBody: `─`,
    topJoin: `┬`,
    topLeft: `╭`,
    topRight: `╮`,
    bottomBody: `─`,
    bottomJoin: `┴`,
    bottomLeft: `╰`,
    bottomRight: `╯`,
    bodyLeft: `│`,
    bodyRight: `│`,
    bodyJoin: `│`,
    joinBody: `─`,
    joinLeft: `├`,
    joinRight: `┤`,
    joinJoin: `┼`,
}

/**
 * table 库的适配器实现
 * 封装 table 库的具体实现细节
 */
export class TableLibAdapter implements ITablePort {
    render(data: TableData, config?: TableConfig): string {
        const tableConfig: TableUserConfig = {
            ...config,
            border: config?.border ?? tableBorderConfig,
        }
        return table(data, tableConfig)
    }

    print(data: TableData, config?: TableConfig): void {
        console.log(this.render(data, config))
    }

    autoLayout(layout: TableLayoutConfig): TableConfig {
        const { columnRatios, alignment = 'justify' } = layout
        const sum = columnRatios.reduce((acc, it) => acc + it, 0)
        const termCol = terminal.column || 80
        const curCol = termCol - 4 * columnRatios.length
        const maxColumn = 80
        const colNum = curCol > maxColumn ? maxColumn : curCol
        const calWidth = columnRatios.map((it) =>
            Math.floor(colNum * (it / sum))
        )

        return {
            border: tableBorderConfig,
            columns: calWidth.map((width) => ({
                alignment: alignment as TableAlignment,
                width,
            })),
        }
    }

    getDefaultConfig(): TableConfig {
        return {
            border: tableBorderConfig,
        }
    }

    partition<T>(data: T[], pageSize: number = 5): T[][] {
        return data.reduce((result, item, index) => {
            const chunkIndex = Math.floor(index / pageSize)
            if (!result[chunkIndex]) {
                result[chunkIndex] = []
            }
            result[chunkIndex].push(item)
            return result
        }, [] as T[][])
    }

    getMaxColumnWidth(): number {
        const col = terminal.column || 80
        return (col > 80 ? 80 : col) - 12
    }
}
