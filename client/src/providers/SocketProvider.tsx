import { createContext, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        socketRef.current = io('http://localhost:3000');

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    return (
        <SocketContext.Provider value={socketRef.current}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => {
    const socket = useContext(SocketContext);
    if (!socket) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return socket;
};
