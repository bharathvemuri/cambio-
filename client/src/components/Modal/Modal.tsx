import { useState } from 'react';

function Modal({ startGame, socket }: { startGame: (mode: string) => void; socket: any }) {

    const [showPlayerRoom, setShowPlayerRoom] = useState(false);
    const [nickname, setNickname] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [playersInRoom, setPlayersInRoom] = useState<string[]>([]);

    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNickname(e.target.value);
    };

    const navigateToPlayerRoom = () => {
        socket.emit('createRoom', { nickname }, (response: any) => {
            setRoomCode(response.roomCode);
            setPlayersInRoom(response.players);
        });

        setShowPlayerRoom(true);
    }

    const goBack = () => {
        setShowPlayerRoom(false);
        setPlayersInRoom([]);
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
                            <div className="room-link">
                                <input
                                    disabled
                                    value={roomCode}
                                    className="border border-gray-300 bg-gray-200 color-black-800 rounded-l py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600" onClick={() => navigator.clipboard.writeText(roomCode)}>
                                    copy
                                </button>
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