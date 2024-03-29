import dotenv from "dotenv";
import {fetchData, parseInstamedData, parseGouvData, parseMultipleInstamedData, matchResult} from "./utils.mjs";
import {
    medecinGouv,
    medecinInstamed,
    error404,
    rpps,
    names,
    arrayMedecinInstamed,
    medecin,
    arrayMedecin,
    error503
} from "./joiObjects.mjs";
import {server} from "./server.mjs";

dotenv.config();

//on définie nos variables avant
const GOUV_URL = "https://gateway.api.esante.gouv.fr/fhir/v1/Practitioner?identifier="
const INSTAMED_URL = "https://data.instamed.fr/api"


// on définie nos routes ici
export const routes =[
    /**
     * fonction qui affiche server ok à la racine
     */
    {
        method: 'GET',
        path: '/',
        handler: () => {
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
            let data;
            try {
                data = await fetchData(apiUrl, headers);
            } catch (error) {
                return h.response({
                    message: "error : can't fetch data from GOUV API"
                }).code(503);
            }
            const result = parseGouvData(data, rpps);

            // Si tous les champs sont égaux à "unknown", on renvoie une erreur 404
            if (result.email === "unknown" && result.firstname === "unknown" && result.lastname === "unknown" && result.gender === "unknown") {
                return h.response({
                    message: "error : No practitioner found"
                }).code(404);
            }
            return h.response(result).code(200);
        },
        options: {
            tags: ['api'],
            description: 'Get information about a practitioner from GOUV API using RPPS',
            validate: {
                params: rpps,
            },
            response: {
                status: {
                    200: medecinGouv,
                    404: error404,
                    503: error503
                }
            },
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
            let data;
            try {
                data = await fetchData(apiUrl, headers);
            } catch (error) {
                return h.response({
                    message: "error : can't fetch data from INSTAMED API"
                }).code(503);
            }
            if (data.error) {
                return h.response({
                    data: data
                }).code(404);
            }
            const result = parseInstamedData(data);
            //Si tous les champs sont à unknown, on renvoie une erreur 404
            if (result.email === "unknown" && result.firstname === "unknown" && result.lastname === "unknown" && result.phoneNumber === "unknown" && result.address === "unknown" && result.zipCode === "unknown" && result.city === "unknown" && result.specialty === "unknown") {
                return h.response({
                    message: "error : No practitioner found"
                }).code(404);
            }

            return h.response(result).code(200);
        },
        options: {
            tags: ['api'],
            description: 'Get information about a practitioner from INSTAMED API using RPPS',
            validate: {
                params: rpps,
            },
            response: {
                status: {
                    200: medecinInstamed,
                    404: error404,
                    503: error503
                }
            },
        }
    },

    /**
     * fonction qui récupère toutes les données d'un medecin depuis l'API instamed via son nom et prénom
     * @param {string} firstname
     * @param {string} lastname
     */
    {
        method: 'GET',
        path: '/medecin_instamed/{firstname}/{lastname}',
        handler: async (request, h) => {
            // Si firstname ou lastname est égal à "null", ça veux dire qu'on ne doit pas prendre en compte ce paramètre, si les deux sont égaux à "null", on renvoie une erreur
            const firstname = request.params.firstname === "null" ? "" : request.params.firstname;
            const lastname = request.params.lastname === "null" ? "" : request.params.lastname;
            // Si le paramètre perPage est renseigné, on le prend en compte, sinon on prend 30 par défaut
            const nbPractitionerPerPage = request.query.perPage || 30;


            if (firstname === "" && lastname === "") {
                return h.response({
                    message: "error : You must provide at least one parameter"
                }).code(400);
            }

            const apiUrl = `${INSTAMED_URL}/rpps?firstName=${firstname}&lastName=${lastname}`;
            const headers = {
                'accept': 'application/ld+json',
            }
            let data;
            try {
                data = await fetchData(apiUrl, headers);
            } catch (error) {
                return h.response({
                    message: "error : can't fetch data from INSTAMED API"
                }).code(503);
            }

            // Si hydra:member est vide, on retourne une erreur 404
            if (data['hydra:totalItems'] === 0) {
                return h.response({
                    message: "error : No practitioner found"
                }).code(404);
            }


            // Le nombre de tour de boucle est le minimum entre le nombre de medecin par page et le nombre total de medecin
            const nbPractitioner = data['hydra:totalItems'];
            const tourBoucle = Math.min(nbPractitionerPerPage, nbPractitioner);

            const res = parseMultipleInstamedData(data, tourBoucle);
            return h.response(res).code(200);
        },
        options: {
            tags: ['api'],
            description: 'Get information about a practitioner from INSTAMED API using firstname and lastname',
            notes: 'You can ignore the firstname or the lastname by putting "null" in the url. But you must provide at least one parameter',
            validate: {
                params: names,
            },
            response: {
                status: {
                    200: arrayMedecinInstamed,
                    404: error404,
                    503: error503
                }
            },
        }
    },

    /**
     * Fonction qui récupère toutes les données des deux api via le rpps
     */
    {
        method: 'GET',
        path: '/medecin/{rpps}',
        handler: async (request, h) => {
            const rpps = request.params.rpps;
            // On appelle la route /medecin_gouv/{rpps} pour récupérer les données du gouvernement
            let gouvInfo = await server.inject({
                method: 'GET',
                url: `/medecin_gouv/${rpps}`
            });

            // On appelle la route /medecin_instamed/{rpps} pour récupérer les données d'instamed
            let instamedInfo = await server.inject({
                method: 'GET',
                url: `/medecin_instamed/${rpps}`
            });

            // Si les deux api renvoient une erreur 404, on renvoie une erreur 404
            if (gouvInfo.statusCode === 404 && instamedInfo.statusCode === 404) {
                return h.response({
                    message: "error : No practitioner found"
                }).code(404);
            }

            // Si l'une des deux api renvoie une erreur 503, on renvoie une erreur 503
            if (gouvInfo.statusCode === 503 || instamedInfo.statusCode === 503) {
                // On renvoie un message d'erreur dans lequel on précise quel api a renvoyé une erreur
                return h.response({
                    message: "error : can't fetch data from "
                        + (gouvInfo.statusCode === 503 ? "GOUV" : "")
                        + (gouvInfo.statusCode === 503 && instamedInfo.statusCode === 503 ? " and " : "")
                        + (instamedInfo.statusCode === 503 ? "INSTAMED" : "")
                        + " API"
                }).code(503);
            }

            gouvInfo = JSON.parse(gouvInfo.payload);
            instamedInfo = JSON.parse(instamedInfo.payload);

            // On compare les données des deux api
            const res = matchResult(gouvInfo, instamedInfo, rpps);

            return h.response(res).code(200);
        },
        options: {
            tags: ['api'],
            description: 'Get information about a practitioner from both GOUV and INSTAMED API using RPPS',
            validate: {
                params: rpps,
            },
            response: {
                status: {
                    200: medecin,
                    404: error404,
                    503: error503
                }
            },
        }
    },

    /**
     * Fonction qui récupère toutes les données des deux api via le nom et prénom
     */
    {
        method: 'GET',
        path: '/medecin/{firstname}/{lastname}',
        handler: async (request, h) => {
            // Si firstname ou lastname est égal à "null", ça veux dire qu'on ne doit pas prendre en compte ce paramètre, si les deux sont égaux à "null", on renvoie une erreur
            const firstname = request.params.firstname
            const lastname = request.params.lastname

            // On appelle la route /medecin_instamed/{firstname}/{lastname} pour récupérer les données d'instamed
            let instamedInfo = await server.inject({
                method: 'GET',
                url: `/medecin_instamed/${firstname}/${lastname}`
            });

            // Si l'api instamed renvoie une erreur 404, on renvoie une erreur 404
            if (instamedInfo.statusCode === 404) {
                return h.response({
                    message: "error : No practitioner found"
                }).code(404);
            }

            if (instamedInfo.statusCode === 503) {
                return h.response({
                    message: "error : can't fetch data from INSTAMED API"
                }).code(503);
            }

            // On ne prend que le payload de la réponse (json d'inforamtion sur le medecin)
            instamedInfo = JSON.parse(instamedInfo.payload);

            // On appelle la route /medecin_instamed/{rpps} pour récupérer les données du gouvernement pour chaque medecin trouvé
            let res = [];
            for (const instamed of instamedInfo) {
                let gouvInfo;
                try {
                    gouvInfo = await server.inject({
                        method: 'GET',
                        url: `/medecin_gouv/${instamed.rpps}`
                    });
                } catch (error) {
                    return h.response({
                        message: "error : can't fetch data from GOUV API"
                    }).code(503);
                }

                gouvInfo = JSON.parse(gouvInfo.payload);

                // On compare les données des deux api
                const result = matchResult(gouvInfo, instamed, instamed.rpps);
                res.push(result);
            }

            return h.response(res).code(200);
        },
        options: {
            tags: ['api'],
            description: 'Get information about a practitioner from both GOUV and INSTAMED API using firstname and lastname',
            notes: 'You can ignore the firstname or the lastname by putting "null" in the url. But you must provide at least one parameter',
            validate: {
                params: names,
            },
            response: {
                status: {
                    200: arrayMedecin,
                    404: error404,
                    503: error503
                }
            },
        }
    },


    // route par défaut (404)
    {
        method: "*",
        path: "/{any*}",
        handler: async (request, h) => {
            return h.response({
                message: "error : This route doesn't exist"
            }).code(404);
        }
    }
]