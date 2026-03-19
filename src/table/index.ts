/**
 * Table 防腐层统一导出
 * 提供统一的 table 接口，底层实现可替换
 */

export { TableLibAdapter } from './adapters/table-adapter'
export * from './table-port'

// 默认导出单例实例
import { TableLibAdapter } from './adapters/table-adapter'
export const table = new TableLibAdapter()
