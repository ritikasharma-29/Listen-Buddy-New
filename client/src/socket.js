// import { io } from "socket.io-client";

// const socket = io("http://127.0.0.1:5000");

// export default socket;

import { io } from "socket.io-client";

const socket = io("https://listen-buddy-backend.onrender.com", {
    autoConnect: true,
    transports: ["websocket", "polling"]
});

export default socket;