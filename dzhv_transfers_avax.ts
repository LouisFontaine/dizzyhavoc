import * as e from './ejra/mod.ts'
import AIQ from './lib/aiq.ts'

function foo(p:Promise<unknown>) {
    return p
        .then(result => ({ error: undefined, result }))
        .catch(error => ({ error, result: undefined }))
}

const url = 'https://api.avax.network/ext/bc/C/rpc'
const address = '0x3e6A2314eDB0599b2D4Bc23812EDEb993c1916E6'
const fromBlock = 40214687n // 169265912n  // await getDeployed({ url, address })
const height = 40954562n //await e.height().call(url)
const toBlock = height
const topics = ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']
const filters = new AIQ<Filter>()
const logs:Log[] = []
filters.push({ fromBlock, toBlock, address, topics })
for await (const filter of filters) {
    const { error, result } = await foo(e.logs({ filter }).call(url))
    console.log({ filter, error, result, logsLength: logs.length }, '\n')
    if (result) {
        logs.push(...result as Log[])
        if (filter.toBlock == height) break
    }
    if (error) {
        const from = filter.fromBlock as bigint
        const to = filter.toBlock as bigint
        if (from == to) throw error
        const l = { ...filter, toBlock: (to * 2n - (to - from)) / 2n }
        const r = { ...filter, fromBlock: l.toBlock + 1n }
        filters.unshift(r)
        filters.unshift(l)
    }
    // await new Promise(r => setTimeout(r, 1000))
}
Deno.writeTextFileSync('dzhv_transfers_avax', JSON.stringify(logs, (_, v) => typeof v == 'bigint' ? ''+v : v, 4))