
// Fonction annexes
import fetch from "node-fetch";

export const fetchData = async (url, headers) => {
    const response = await fetch(url, { headers });
    return await response.json();
};

export const parseInstamedData = (data) => {
    const email = (data.email == null || data.email === "") ? "unknown" : data.email;
    const firstname = (data.firstName == null || data.firstName === "") ? "unknown" : data.firstName;
    const lastname = (data.lastName == null || data.lastName === "") ? "unknown" : data.lastName;
    const address = (data.address == null || data.address === "") ? "unknown" : data.address;
    const zipCode = (data.zipcode == null || data.zipcode === "") ? "unknown" : data.zipcode;
    const city = (data.city == null || data.city === "") ? "unknown" : data.city;
    const phoneNumber = (data.phoneNumber == null || data.phoneNumber === "") ? "unknown" : data.phoneNumber;
    const rpps = (data.idRpps == null || data.idRpps === "") ? "unknown" : data.idRpps;
    const specialty = (data.specialty == null || data.specialty === "") ? "unknown" : data.specialty;

    return {
        rpps: rpps,
        firstname: firstname,
        lastname: lastname,
        specialty: specialty,
        email: email,
        phoneNumber: phoneNumber,
        address: address,
        zipCode: zipCode,
        city: city,
    };
}

export const parseMultipleInstamedData = (data, nbPractitioner) => {
    // On va renvoyer un tableau avec les données de chaque médecin
    const result = [];
    for (let i = 0; i < nbPractitioner; i++) {
        const json = parseInstamedData(data['hydra:member'][i]);
        result.push(json);
    }
    return result;
}

export const parseGouvData = (data, rpps) => {
    let email;
    let gender;
    let firstname;
    let lastname;
    // On essaye re récupérer le genre du medecin
    try {
        gender = data.entry[0].resource.name[0].prefix[0];
    } catch (error) {
        // Si on ne trouve pas le genre, on le met à "unknown"
        gender = "unknown";
    }
    // On essaye de récupérer l'email du medecin
    try {
        const tabExtension = data.entry[0].resource.extension[0].extension;
        for (let i = 0; i < tabExtension.length; i++) {
            if (tabExtension[i].url === "value") {
                email = tabExtension[i].valueString;
            }
        }
    } catch (error) {
        // Si on ne trouve pas l'email, on le met à "unknown"
        email = "unknown";
        firstname = "unknown";
        lastname = "unknown";
    }
    // Si l'email n'est pas égal à "unknown", on essaye de récupérer le prénom et le nom
    if (email !== "unknown") {
        try {
            // Pour récupérer le prénom et le nom du médecin, on récupère ce qu'il y a avant le @ dans l'email
            // ensuite on split le résultat avec un point pour récupérer le prénom et le nom
            firstname = email.split('@')[0].split('.')[0];
            lastname = email.split('@')[0].split('.')[1];
        } catch (error) {
            // Si on ne trouve pas le prénom ou le nom, on les met à "unknown"
            firstname = "unknown";
            lastname = "unknown";
        }
    }
    return {
        rpps: rpps,
        firstname: firstname,
        lastname: lastname,
        email: email,
        gender: gender
    }
}

export const matchResult = (dataGouv, dataInstamed, rpps) => {
    let firstname = dataInstamed.firstname;
    let lastname = dataInstamed.lastname;
    let email = dataInstamed.email;
    const phoneNumber = dataInstamed.phoneNumber;
    const address = dataInstamed.address;
    const zipCode = dataInstamed.zipCode;
    const city = dataInstamed.city;
    const gender = dataGouv.gender
    const specialty = dataInstamed.specialty;


    // Si l'un des champs firstname, lastname ou email est égal à "unknown", on le remplace par la valeur correspondante dans dataGouv
    if (firstname === "unknown") {
        firstname = dataGouv.firstname;
    }
    if (lastname === "unknown") {
        lastname = dataGouv.lastname;
    }
    if (email === "unknown") {
        email = dataGouv.email;
    }

    return {
        rpps: rpps,
        firstname: firstname,
        lastname: lastname,
        specialty: specialty,
        email: email,
        phoneNumber: phoneNumber,
        address: address,
        zipCode: zipCode,
        city: city,
        gender: gender,
    }
}










