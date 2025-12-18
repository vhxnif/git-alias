import { createPrompt, useState, useKeypress } from "@inquirer/core"
import { type Node, LinkedList } from "./linked-list"
import { color } from "./color-utils"

type Value<T> = {
  name: string
  value: T
}

export type SelectShowConfig<T> = {
  message: string
  data: Value<T>[]
  show: (v: T) => string
}

const find = (v: Node<Value<any>>, step: number) => {
  let tmp = v
  for (let i = step; i > 0; i--) {
    const node = tmp.prev
    if (node) {
      tmp = node
    }
  }
  return tmp
}

export default createPrompt<void, SelectShowConfig<any>>((config, done) => {
  const { message, data, show } = config
  const [cursor, setCursor] = useState<Node<Value<any>>>(
    new LinkedList(data).getHeader()!,
  )
  const [showFlg, setShowFlg] = useState<boolean>(false)
  useKeypress(async (key, rl) => {
    rl.clearLine(0)
    switch (key.name) {
      case "j":
        setCursor(cursor.next ? cursor.next : cursor)
        break
      case "k":
        setCursor(cursor.prev ? cursor.prev : cursor)
        break
      case "return":
        setShowFlg(!showFlg)
        break
      case "q":
        done()
    }
  })
  console.clear()
  if (showFlg) {
    return `${show(cursor.value.value)}`
  }
  let k = find(cursor, 2)
  const res = [k]
  for (let i = 0; i < 5; i++) {
    const v = k?.next
    if (v) {
      res.push(v)
      k = v
    }
  }
  const { yellow, surface2, green } = color
  const selectItem = res
    .map((it) =>
      it.value.name === cursor.value.name && it.idx === cursor.idx
        ? yellow.italic.bold(it.value.name)
        : surface2.italic(it.value.name),
    )
    .join("\n")
  return [`${green.bold(message)}`, selectItem]
})
