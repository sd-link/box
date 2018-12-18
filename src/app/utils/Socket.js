//import io from 'socket.io-client';
import config from "../share-modal/config"

export let socket = null;

export function socketStartListening() {

    const io = window['io']

    if (!io) {

        // add dummy for client development
        socket = {
            on: function () {
            },
            emit: function () {
            },
        }

        console.warn("socket.io server not responding")
        return;
    }

    //  const socket = io(config.baseURL);
    socket = io.connect(config.baseURL);
    socket.on('this', function (data) {
        console.log("this", data);
        socket.emit('my other event', {my: 'data'});
    });

    socket.on('connect', function (data) {
        console.log("connect", data);

    });


    socket.on('connect', function (data) {
        console.log("connect", data);

    });


}

