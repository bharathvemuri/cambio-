import { useState } from 'react';

function Modal({ startGame, socket }: { startGame: (mode: string) => void; socket: any }) {

    const [showPlayerRoom, setShowPlayerRoom] = useState(false);
    const [nickname, setNickname] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [playersInRoom, setPlayersInRoom] = useState<string[]>([]);
    const [mode, setMode] = useState(true); // true ==> create && false ==> join

    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNickname(e.target.value);
    };

    const navigateToPlayerRoom = () => {
        setShowPlayerRoom(true);
        createRoom();
    }

    const createRoom = () => {
        if (!roomCode) {
            socket.emit('createRoom', { nickname }, (response: any) => {
                console.log("Response:", response);
                setRoomCode(response.roomId);
            });
        }
    }

    const handleJoinCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setJoinCode(e.target.value);
    }

    const copyOrConnect = async (e: React.MouseEvent<HTMLButtonElement>) => {
        
        if (mode) { // copy uuid url
            await navigator.clipboard.writeText(roomCode);
        } else { // join room
            socket.emit('joinRoom', { nickname, roomId:joinCode }, (response: any) => {
                //TODO: update player roster
                console.log("Response:", response);
            });
        }
    }

    const goBack = () => {
        setRoomCode('');
        setJoinCode('');
        setMode(true);
        setPlayersInRoom([]);
        setShowPlayerRoom(false);

    }

    const kickPlayer = (index: number) => {
        const updatedPlayers = [...playersInRoom];
        updatedPlayers.splice(index, 1);
        setPlayersInRoom(updatedPlayers);
    }

    return (
        <div className=" teleport fixed inset-0 flex items-center justify-center bg-black/50 z-51">
            <div className="bg-[var(--bg)] p-4 rounded-lg shadow-lg min-w-[300px] max-w-md">
                <div className="modal-title mb-4">
                    <h1 className="text-xl color-black-800 font-bold mb-4">camb.io</h1>
                </div>
                {showPlayerRoom === false ? (
                    <div className="setup-pg-1">
                        <div className="modal-content mb-4">
                            <form>
                                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                                    nickname:
                                </label>
                                <input
                                    type="text"
                                    id="nickname"
                                    className="border border-gray-300 bg-gray-200 color-black-800 rounded py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={nickname}
                                    onChange={handleNicknameChange}
                                />
                            </form>
                        </div>
                        <div className="modal-footer mb-4>">
                            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 m-2" onClick={() => startGame('computer')}>
                                vs Computer
                            </button>
                            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 m-2" onClick={navigateToPlayerRoom}>
                                vs Players
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="setup-pg-2">
                        <div className="modal-content mb-4">

                            <div className="connection-container">
                                <div className="flex border-b">
                                    <button
                                        onClick={() => setMode(true)}
                                        className={`px-1 text-sm rounded-tl w-1/2 ${!mode
                                            ? "border-b border-black border-r font-medium border-l border-t border-gray-300 text-white"
                                            : "text-gray-600 bg-gray-300 "
                                            }`}
                                    >
                                        create
                                    </button>

                                    <button
                                        onClick={() => setMode(false)}
                                        className={`px-1 text-sm rounded-tr w-1/2 ${mode
                                            ? "border-b border-black border-r font-medium border-r border-t border-gray-300 text-white"
                                            : "text-gray-600 bg-gray-300 "
                                            }`}
                                    >
                                        join
                                    </button>
                                </div>
                                <div className="room-link">
                                    {mode ? (
                                        <input
                                            disabled
                                            value={roomCode}
                                            onChange={handleJoinCodeInput}
                                            className="w-4/5 border border-gray-300 bg-gray-200 color-black-800 rounded-bl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <input
                                            value={joinCode}
                                            onChange={handleJoinCodeInput}
                                            className="w-4/5 border border-gray-300 bg-gray-200 color-black-800 rounded-bl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    )}
                                    <button className="w-1/5 px-4 py-2 bg-blue-500 text-white rounded-br hover:bg-blue-600" onClick={copyOrConnect}>
                                        icon
                                    </button>
                                </div>
                            </div>
                            <div className="room-container bg-gray-200 mt-4 w-full h-48 rounded-lg p-4">
                                <ul>
                                    <li className="text-gray-700 p-1 bg-gray-300 rounded mb-1 flex justify-between items-center">
                                        <span className="font-bold">
                                            {nickname ?? "Anonymous"} (you)
                                        </span>
                                    </li>
                                    {playersInRoom.map((player, index) => (
                                        <li key={index} className="text-gray-700 p-1 bg-gray-300 rounded mb-1 flex justify-between items-center">
                                            <span>{player}</span>
                                            <button className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600" onClick={() => kickPlayer(index)}>
                                                X
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="modal-footer mb-4>">
                            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 m-2" onClick={goBack}>
                                Back
                            </button>
                            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 m-2" onClick={() => startGame('players')}>
                                Start Game
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Modal;