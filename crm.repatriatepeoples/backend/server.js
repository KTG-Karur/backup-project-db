'use strict';
const PORT = "5007"

const start = async ()=>{
    try {
        const fastify = require('./app');
        const { initSocket } = require('./socket-manager');
        initSocket(fastify.server);
        await fastify.listen({port : PORT})
        console.log(`App Listening On Port : ${PORT}`)
    } catch (error) {
        // fastify.log.error(error)
        console.log(error)
        process.exit(1)
    }
}

start()