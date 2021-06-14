/* eslint-disable no-plusplus */
/* eslint-disable max-len */
/* eslint-disable no-console */
/* eslint indent: "error" */
const fs = require('fs');
const { spawn } = require('child_process');
const { once } = require('process');
const { datafusion_v1beta1 } = require('googleapis');


const isFunction = callback => callback instanceof Function

const checkIsParamsString = params => typeof params === 'string'

const checkIfParamsArrayIsEmpty = params => Boolean(params.length)

const checkBufferObject = element => element instanceof Object && element.name && Buffer.isBuffer(element.buffer)

// const checkCommandForIO = element => element.includes('-in') || element.includes('-out')
//     || element.includes('-keyout') || element.includes('-signkey') || element.includes('-key')

const checkCommandForIO = element => element == '-in' || element == '-out'
|| element == '-keyout' || element == '-signkey' || element == '-key'  || element == '-config';

const checkDataTypeCompatibility = (params) => {
    const allowedParamsDataTypes = ['string', 'object']
    return allowedParamsDataTypes.includes(typeof params)
}


module.exports = async function openssl(params) {
    const stdout = [];
    const stderr = [];
    const dir = 'openssl/';
    let parameters = params;
    let dataOut = '';


    // if (!isFunction(callback)) {
    //     throw new Error(`Callback must be a function, but got a ${typeof callback}`)
    // }

    if (!checkDataTypeCompatibility(parameters)) {
        throw new Error(`Parameters  must be string or an array, but got ${typeof parameters}`);
    }

    if (checkIsParamsString(parameters)) {
        parameters = parameters.split(' ')
    }

    if (!checkIfParamsArrayIsEmpty(parameters)) throw new Error('Array of params must contain at least one parameter');

    if (parameters[0] === 'openssl') parameters.shift()


    for (let i = 0; i <= parameters.length - 1; i++) {

        if (checkBufferObject(parameters[i])) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            const filename = dir + parameters[i].name

            fs.writeFileSync(filename, parameters[i].buffer, (err) => {
                if (err) {
                    throw new Error(err);
                }
            });

            parameters[i] = parameters[i].name
            parameters[i] = dir + parameters[i];
        }

        if (checkCommandForIO(parameters[i]) && typeof parameters[i + 1] !== 'object') {
            parameters[i + 1] = dir + parameters[i + 1];
        }
    }


    const openSSLProcess = spawn('openssl', parameters);

    openSSLProcess.stdout.on('data', (data) => {
        dataOut += data.toString();
    });

    openSSLProcess.stderr.on('data', (data) => {
        console.error(data);
    });

    await new Promise(resolve => openSSLProcess.on('close', resolve));

    return dataOut;
}
