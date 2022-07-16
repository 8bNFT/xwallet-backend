import fetch from 'node-fetch'
import fs from 'fs'

class Coins{
    constructor(){
        this.coins = {}
    }

    async readCoins(network = 'mainnet'){
        if(this.coins[network] && Date.now() - this.coins[network].expiration < 900000) return this.coins[network].data
        try{
            const _coins = JSON.parse(fs.readFileSync(`coins_${network}.json`).toString())
            if(Date.now() - _coins.expiration < 900000){
                this.coins[network] = _coins.data
                return this.coins[network]
            }
        }catch{}
        this.coins[network] = await this.fetchPrices(network)
        return this.coins[network].data
    }

    async fetchPrices(network){
        const { result } = await (await fetch(`https://api.${network == 'testnet' && 'ropsten.' || ''}x.immutable.com/v1/tokens`)).json()
        const coins = {}
        let symbols = []

        for(let coin of result){
            const ID = coin.token_address || coin.symbol

            coins[ID] = {
                ...coin,
                id: ID,
                price: false,
                minimum: 1 / (10**(coin.decimals - String(coin.quantum).length + 1)),
                precision: (coin.decimals - String(coin.quantum).length + 1)
            }

            symbols.push(coin.symbol)
        }

        const { data } = await (await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?CMC_PRO_API_KEY=27b33efc-d2c2-4a18-8056-67ecad6e2720&symbol=${symbols.join(',')}&skip_invalid=true`)).json()
        for(let [symbol, _stats] of Object.entries(data)){
            const token_address = symbol === "ETH" ? "ETH" : (_stats.platform?.token_address || "").toLowerCase()
            if(!token_address || !coins[token_address]) continue

            const stats = _stats.quote.USD
            coins[token_address] = {
                name: _stats.name,
                symbol,
                ...coins[token_address],
                price: stats.price,
                change: {
                    '1h': parseFloat((stats.percent_change_1h || 0).toFixed(2)),
                    '1d': parseFloat((stats.percent_change_24h || 0).toFixed(2)),
                    '7d': parseFloat((stats.percent_change_7d || 0).toFixed(2)),
                    '30d': parseFloat((stats.percent_change_30d || 0).toFixed(2))
                }
            }
        }

        const tokenInfo = {expiration: Date.now(), data: coins}

        fs.writeFileSync(`coins_${network}.json`, JSON.stringify(tokenInfo))
        return tokenInfo
    }
}

export const coins = new Coins()