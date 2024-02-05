import Joi from 'joi';

export const medecinGouv = Joi.object({
    rpps: Joi.string().required().description('RPPS number of the practitioner'),
    firstname: Joi.string().required().description('The firstname of the practitioner'),
    lastname: Joi.string().required().description('The lastname of the practitioner'),
    email: Joi.string().required().description('Email of the practitioner'),
    gender: Joi.string().required().description('The gender of the practitioner'),
}).description('Information about a practitioner using GOUV API')
    .label('MedecinGouv');

export const medecinInstamed = Joi.object({
    rpps: Joi.string().required().description('RPPS number of the practitioner'),
    firstname: Joi.string().required().description('The firstname of the practitioner'),
    lastname: Joi.string().required().description('The lastname of the practitioner'),
    email: Joi.string().required().description('Email of the practitioner'),
    phoneNumber: Joi.string().required().description('Phone number of the practitioner'),
    address: Joi.string().required().description('Address of the practitioner'),
    zipCode: Joi.string().required().description('Zip code of the practitioner'),
    city: Joi.string().required().description('City of the practitioner'),
}).description('Information about a practitioner using INSTAMED API')
    .label('MedecinInstamed');

export const arrayMedecinInstamed = Joi.array().items(medecinInstamed)
    .description('Array of practitioners')
    .label('ArrayMedecinInstamed');

export const medecin = Joi.object({
    rpps: Joi.string().required().description('RPPS number of the practitioner'),
    firstname: Joi.string().required().description('The firstname of the practitioner'),
    lastname: Joi.string().required().description('The lastname of the practitioner'),
    email: Joi.string().required().description('Email of the practitioner'),
    phoneNumber: Joi.string().required().description('Phone number of the practitioner'),
    address: Joi.string().required().description('Address of the practitioner'),
    zipCode: Joi.string().required().description('Zip code of the practitioner'),
    city: Joi.string().required().description('City of the practitioner'),
    gender: Joi.string().required().description('The gender of the practitioner'),
}).description('Information about a practitioner using both GOUV and INSTAMED API')
    .label('Medecin');

export const arrayMedecin = Joi.array().items(medecin)
    .description('Array of practitioners')
    .label('ArrayMedecin');

export const error404 = Joi.object({
    message: Joi.string().description('Error message'),
}).description('Error 404')
    .label('Error404');

export const rpps = Joi.object({
    rpps: Joi.string().required().description('RPPS number of the practitioner'),
});

export const names = Joi.object({
    firstname: Joi.string().required().description('Firstname of the practitioner'),
    lastname: Joi.string().required().description('Lastname of the practitioner'),
});

