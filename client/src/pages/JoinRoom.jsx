import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/JoinRoom.css";

function JoinRoom() {
    const [roomId, setRoomId] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleJoinRoom = async (e) => {
        e.preventDefault();

        if (!roomId.trim() || !username.trim()) {
            alert("Please enter room ID and username");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "https://listen-buddy-backend.onrender.com/api/rooms/join",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        roomId: roomId.trim().toUpperCase(),
                        username: username.trim()
                    })
                }
            );

            const data = await response.json();

            console.log("Join Room Response:", data);

            if (!response.ok) {
                alert(data.message || "Failed to join room");
                return;
            }

            if (!data.room) {
                alert("Room data not received from server");
                return;
            }

            localStorage.setItem("username", username.trim());

            navigate(`/room/${data.room.roomId}`);

        } catch (error) {
            console.error("Join Room Error:", error);
            alert("Cannot connect to server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="card">
                    <h1 className="page-title">Join Room</h1>

                    <p className="page-subtitle">
                        Enter a room and listen together.
                    </p>

                    <form className="form" onSubmit={handleJoinRoom}>

                        <div className="form-group">
                            <label>Room ID</label>

                            <input
                                type="text"
                                placeholder="Enter room ID"
                                value={roomId}
                                onChange={(e) =>
                                    setRoomId(e.target.value)
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label>Username</label>

                            <input
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) =>
                                    setUsername(e.target.value)
                                }
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? "Joining..." : "Join Room"}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}

export default JoinRoom;

