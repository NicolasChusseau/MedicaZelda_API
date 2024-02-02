'use strict';

// Les imports
import Hapi from '@hapi/hapi';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

//on définie nos variables avant
const GOUV_URL = "https://gateway.api.esante.gouv.fr/fhir/v1/Practitioner?identifier="
const INSTAMED_URL = "https://data.instamed.fr/api"

// Fonction pour effectuer une requête HTTP
const fetchData = async (url, headers) => {
    const response = await fetch(url, { headers });
    return await response.json();
};

// on définie nos routes ici
const routes =[
    /**
     * fonction qui affiche server ok à la racine
     */
    {
        method: 'GET',
        path: '/',
        handler: (request, h) => {
            return {message: 'server ok'};
        }
    },

    /**
     * fonction qui récupère toutes les données d'un medecin depuis l'API du gouvernement via son numéro rpps
     * @param {string} rpps
     */
    {
        method: 'GET',
        path: '/medecin_gouv/{rpps}',
        handler: async (request, h) => {
            const rpps = request.params.rpps;
            const apiUrl = `${GOUV_URL}${rpps}`;
            const headers = {
                'ESANTE-API-KEY': process.env.API_KEY
            };
            const data = await fetchData(apiUrl, headers);
            try {
                const tabExtension = data.entry[0].resource.extension[0].extension;
                let email = "";
                let gender = data.entry[0].resource.name[0].prefix[0];
                for (let i = 0; i < tabExtension.length; i++) {
                    if (tabExtension[i].url === "value") {
                        email = tabExtension[i].valueString;
                    }
                }
                // Pour récupérer le prénom et le nom du médecin, on récupère ce qu'il y a avant le @ dans l'email
                // ensuite on split le résultat avec un point pour récupérer le prénom et le nom
                let firstname = email.split('@')[0].split('.')[0];
                let lastname = email.split('@')[0].split('.')[1];
                return h.response({
                    email: email,
                    gender: gender,
                    firstname: firstname,
                    lastname: lastname
                }).code(200);
            } catch (error) {
                return h.response({
                    message: "error : This practitioner hasn't entered enough information"
                }).code(404);
            }
        }
    },

    /**
     * fonction qui récupère toutes les données d'un medecin depuis l'API instamed via son numéro rpps
     * @param {string} rpps
     */
    {
        method: 'GET',
        path: '/medecin_instamed/{rpps}',
        handler: async (request, h) => {
            const rpps = request.params.rpps;
            const apiUrl = `${INSTAMED_URL}/rpps/${rpps}`;
            const headers = {
                'accept': 'application/ld+json',
            }
            const data = await fetchData(apiUrl, headers);
            if (data.error) {
                return h.response({
                    data: data
                }).code(404);
            }
            return h.response(data).code(200);
        }
    },


    // route par défaut (404)
    {
        method: "*",
        path: "/{any*}",
        handler: async (request, h) => {
            return h.response({
                message: "route not found"
            }).code(404);
        },
    }
]


const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    routes: {
        cors: {
            origin: ["*"],
            additionalHeaders: ["cache-control", "x-requested-with", "authorization"]
        }
    }
});

server.route(routes);
export const init = async () => {
    await server.initialize();
    return server;
};

export const start = async () => {
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
    return server;
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});










