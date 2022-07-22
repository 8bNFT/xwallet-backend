import fetch from 'node-fetch'
import fs from 'fs'

class Coins{
    constructor(){
        this.coins = {}
        this.interval = {}
    }

    readCoins(network = 'mainnet'){
        if(this.coins[network]) return this.coins[network].data
        return {}
    }

    lastUpdate(network = 'mainnet'){
        if(this.coins[network]) return this.coins[network].updated_at
        return false
    }

    async initialize(){
        const networks = ["mainnet", "testnet"]
        for(let network of networks){
            await this.tryStaticInit(network)
            this.interval[network] = setInterval(() => this.fetchTokenInformation(network), 900000)
            console.log(`Loaded token data and initialized interval for`, network)
        }

        console.log('Initialized:', networks.join(", "))
    }

    async tryStaticInit(network){
        try{
            const { data, updated_at } = JSON.parse(fs.readFileSync(`coins_${network}.json`))
            if(Date.now() - updated_at < 900000) return this.coins[network] = { data, updated_at }

            return this.fetchTokenInformation(network)
        }catch(e){
            console.log(e)
            return this.fetchTokenInformation(network)
        }
    }

    async fetchTokenInformation(network){
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

        if(network === "mainnet"){
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
        }

        this.coins[network] = {data: coins, updated_at: Date.now()}
        fs.writeFileSync(`coins_${network}.json`, JSON.stringify({data: coins, updated_at: Date.now()}))
    }
}

export const coins = new Coins()