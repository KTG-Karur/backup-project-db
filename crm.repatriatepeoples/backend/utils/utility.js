const NodeRSA = require('node-rsa');
const CryptoJS = require("crypto-js");
const secretKey = "KtgUserpassworD@2011"
const moment = require('moment');

async function encrptPassword(passcode) {
    try {
        var ciphertext = CryptoJS.AES.encrypt(passcode, secretKey).toString()
        return ciphertext
    } catch (error) {
        throw error;
    }
}

async function decrptPassword(passcode) {
    try {
        var bytes = CryptoJS.AES.decrypt(passcode, secretKey);
        var originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText
    } catch (error) {
        throw error;
    }
}

console.log(decrptPassword('U2FsdGVkX18eH5FDgnKlDrVm4r+3qiEeaxbSTaUh91w='))


function encryptObject(obj) {
    const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(obj), secretKey).toString();
    return ciphertext;
}

// Decryption function
function decryptObject(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
}

async function prefixZeroConst(number) {
    if (number < 1000) {
        return number.toString().padStart(4, '0');
    }
    return number.toString();
}

async function dateConversion(date, format = "DD-MM-YYYY") {
    const result = date ? moment(date).format(format) : "";
    return result
}

async function generateSerialNumber(codeFormat, count) {
    try {
        const value = parseInt(count) + parseInt(`0001`)
        const serialCount = await prefixZeroConst(value)
        const serialGenerator = codeFormat + serialCount
        return serialGenerator;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    encrptPassword,
    dateConversion,
    decrptPassword,
    encryptObject,
    generateSerialNumber,
    decryptObject,
    prefixZeroConst
};