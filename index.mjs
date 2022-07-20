import { fastify as _f } from 'fastify'
import cors from 'fastify-cors'
import { coins } from './coin.mjs'

const fastify = _f()

fastify.register(cors, {})

fastify.get('/tokens', async (req, res)=>{
    return coins.readCoins()
})

fastify.get('/tokens/:network', async (req, res)=>{
    return coins.readCoins(req.params.network.toLowerCase())
})

fastify.get('/latest-update/:network', async(req, res)=>{
    const updated_at = coins.lastUpdate(req.params.network.toLowerCase())
    if(!updated_at) return { updated_at: false }

    return { updated_at: new Date(updated_at).toISOString() }
})

;(async()=>{
    await coins.initialize()
    try{
        const host = await fastify.listen(3333)
        console.log("Running token server on", host)
    }catch(err){
        console.error(err)
        process.exit(1)
    }
})()