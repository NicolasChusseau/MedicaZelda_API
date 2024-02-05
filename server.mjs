'use strict';

// Les imports
import Hapi from '@hapi/hapi';
import Inert from '@hapi/inert';
import Vision from '@hapi/vision';
import HapiSwagger from 'hapi-swagger';
import {routes} from './routes.mjs';

export const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    routes: {
        cors: {
            origin: ["*"],
            additionalHeaders: ["cache-control", "x-requested-with", "authorization"]
        }
    }
});

const plugins = [
    Inert,
    Vision,
    {
        plugin: HapiSwagger,
        options: {
            info: {
                title: 'API Documentation',
                version: '1.0',
            },
        },
    },
];

await server.route(routes);

// Enregistrez les plugins sur le serveur
await server.register(plugins);

export const start = async () => {
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
    return server;
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});










