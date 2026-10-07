import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, "")
  : "http://localhost:5000";

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  }
  return socketInstance;
};

// Singleton socket instance proxy so that:
// 1) socket.on / socket.emit work directly when imported as `import socket from "../services/socket"`
// 2) socket() works if called as a function `socket()`
const socketProxy = new Proxy(getSocket, {
  get(target, prop) {
    const instance = getSocket();
    const val = instance[prop];
    if (typeof val === "function") {
      return val.bind(instance);
    }
    return val;
  },
  apply(target, thisArg, argArray) {
    return getSocket();
  },
});

export const socket = socketProxy;
export default socketProxy;

