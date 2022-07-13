import { fastify as _f } from 'fastify'
import cors from 'fastify-cors'
import { coins } from './coin.mjs'

const fastify = _f()

fastify.register(cors, {})

fastify.get('/tokens', async (req, res)=>{
    return await coins.readCoins()
})

fastify.get('/tokens/mainnet', async (req, res)=>{
    return await coins.readCoins()
})

fastify.get('/tokens/testnet', async (req, res)=>{
    return await coins.readCoins('testnet')
})

fastify.listen(3000)
.then(console.log)
.catch(console.error)