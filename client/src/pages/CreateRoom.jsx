import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CreateRoom.css";

function CreateRoom() {
    const [roomName, setRoomName] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        setError("");

        if (!roomName.trim() || !username.trim()) {
            setError("Please enter both room name and username.");
            return;
        }

        try {
            const response = await fetch(
                "https://listen-buddy-backend.onrender.com/api/rooms",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        roomName: roomName.trim(),
                        username: username.trim(),
                    }),
                }
            );

            const data = await response.json();

            console.log("CREATE ROOM RESPONSE:", data);

            if (!response.ok) {
                setError(data.message || "Failed to create room.");
                return;
            }

            localStorage.setItem("username", username.trim());

            navigate(`/room/${data.roomId}`);
        } catch (error) {
            console.error("Create room error:", error);
            setError("Unable to connect to the server.");
        }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="card">

                    <div
                        style={{
                            textAlign: "center",
                            fontSize: "45px",
                            marginBottom: "10px",
                        }}
                    >
                        🎵
                    </div>

                    <h1 className="page-title">
                        Create a Room
                    </h1>

                    <p className="page-subtitle">
                        Create a room and start listening together.
                    </p>

                    <form
                        className="form"
                        onSubmit={handleCreateRoom}
                    >

                        <div className="form-group">
                            <label htmlFor="roomName">
                                Room Name
                            </label>

                            <input
                                id="roomName"
                                type="text"
                                placeholder="Enter room name"
                                value={roomName}
                                onChange={(e) =>
                                    setRoomName(e.target.value)
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="username">
                                Username
                            </label>

                            <input
                                id="username"
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) =>
                                    setUsername(e.target.value)
                                }
                            />
                        </div>

                        {error && (
                            <p className="error-message">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            Create Room
                        </button>

                    </form>

                </div>
            </div>
        </div>
    );
}

export default CreateRoom;

