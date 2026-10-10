import { io } from "socket.io-client";

const socket = io("https://listen-buddy-backend.onrender.com", {
    autoConnect: true,
    transports: ["websocket", "polling"]
});

export default socket;