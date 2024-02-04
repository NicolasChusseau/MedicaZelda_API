import dotenv from "dotenv";
import {fetchData, parseInstamedData, parseGouvData, parseMultipleInstamedData} from "./utils.mjs";
import {medecinGouv, medecinInstamed, error404, rpps, names, tabMedecinInstamed} from "./joiObjects.mjs";

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

    {
        method: 'GET',
        path: '/testmedecingouv',
        handler: async (request, h) => {
            const rpps = "10002527652";
            const apiUrl = `${GOUV_URL}${rpps}`;
            const headers = {
                'ESANTE-API-KEY': process.env.API_KEY
            };
            const data = await fetchData(apiUrl, headers);
            const result = parseGouvData(data, rpps);
            return h.response(result).code(200);
        }
    },

    {
        method: 'GET',
        path: '/testmedecininstamed',
        handler: async (request, h) => {
            const rpps = "10002527652";
            const apiUrl = `${INSTAMED_URL}/rpps/${rpps}`;
            const headers = {
                'accept': 'application/ld+json',
            }
            const data = await fetchData(apiUrl, headers);
            const result = parseInstamedData(data);
            return h.response(result).code(200);
        },
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
                    404: error404
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
            const data = await fetchData(apiUrl, headers);
            if (data.error) {
                return h.response({
                    data: data
                }).code(404);
            }
            const result = parseInstamedData(data);
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
                    404: error404
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
            if (firstname === "" && lastname === "") {
                return h.response({
                    message: "error : You must provide at least one parameter"
                }).code(400);
            }

            // La valeur maximal de _per_page est 100 donc on va récupérer les 100 premiers médecins
            const nbPractitioner = 100;
            const apiUrl = `${INSTAMED_URL}/rpps?firstName=${firstname}&lastName=${lastname}&_per_page=${nbPractitioner}`;
            const headers = {
                'accept': 'application/ld+json',
            }
            const data = await fetchData(apiUrl, headers);

            // Si hydra:member est vide, on retourne une erreur 404
            if (data['hydra:totalItems'] === 0) {
                return h.response({
                    message: "error : No practitioner found"
                }).code(404);
            }
            const res = parseMultipleInstamedData(data, nbPractitioner);
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
                    200: tabMedecinInstamed,
                    404: error404
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