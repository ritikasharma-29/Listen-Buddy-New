import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import "../styles/Room.css";

function Room() {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [liveUsers, setLiveUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showAddSong, setShowAddSong] = useState(false);
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const audioRef = useRef(null);
    const currentSongRef = useRef(null);

    const [songTitle, setSongTitle] = useState("");
    const [songArtist, setSongArtist] = useState("");
    const [songUrl, setSongUrl] = useState("");

    // =========================
    // GET ROOM DATA
    // =========================

    const fetchRoom = async () => {
        try {
            const response = await fetch(
                `https://listen-buddy-backend.onrender.com/api/rooms/${roomId}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch room"
                );
            }

            setRoom(data.room);

            setLiveUsers(
                data.room.users.map(
                    (user) => user.username
                )
            );
        } catch (error) {
            console.error(
                "Fetch Room Error:",
                error
            );

            setError("Cannot connect to server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoom();
    }, [roomId]);

    // =========================
    // SOCKET.IO
    // =========================

    useEffect(() => {
        const username =
            localStorage.getItem("username") ||
            "Guest";

        console.log(
            "Joining room:",
            roomId
        );

        console.log(
            "Username:",
            username
        );

        // USER JOINED
        const handleUserJoined = (data) => {
            console.log(
                "USER JOINED:",
                data
            );

            setLiveUsers((prevUsers) => {
                if (
                    prevUsers.includes(
                        data.username
                    )
                ) {
                    return prevUsers;
                }

                return [
                    ...prevUsers,
                    data.username
                ];
            });
        };

        // USER LEFT
        const handleUserLeft = (data) => {
            console.log(
                "USER LEFT:",
                data
            );

            setLiveUsers((prevUsers) =>
                prevUsers.filter(
                    (username) =>
                        username !==
                        data.username
                )
            );
        };

        // REMOTE SONG SELECTED
        const handleRemoteSongSelected = (
            data
        ) => {
            console.log(
                "REMOTE SONG SELECTED:",
                data
            );

            setCurrentSong(data.song);

            currentSongRef.current =
                data.song;

            setIsPlaying(false);
        };

        const handleRemoteSongChanged = (data) => {
    console.log(
        "REMOTE SONG CHANGED:",
        data
    );

    setCurrentSong(data.song);

    currentSongRef.current =
        data.song;

    setIsPlaying(true);

    setTimeout(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;

            audioRef.current
                .play()
                .catch(error => {
                    console.log(
                        "Autoplay blocked:",
                        error
                    );
                });
        }
    }, 100);
};

        // REMOTE PLAY
        const handleRemotePlay = (data) => {
    console.log("REMOTE PLAY:", data);

    const song = currentSongRef.current;

    if (!song) {
        console.log("No current song");
        return;
    }

    if (String(song._id) !== String(data.songId)) {
        console.log("Song ID does not match");
        console.log("Current:", song._id);
        console.log("Received:", data.songId);
        return;
    }

    const audio = audioRef.current;

    if (!audio) {
        console.log("Audio element not ready");
        return;
    }

    const startPlayback = () => {
        audio.currentTime = data.currentTime || 0;

        audio.play()
            .then(() => {
                setIsPlaying(true);
                console.log("REMOTE SONG PLAYING");
                console.log("AUDIO PAUSED:", audio.paused);
                console.log("AUDIO CURRENT TIME:", audio.currentTime);
            })
            .catch((error) => {
                console.log("REMOTE PLAY FAILED:", error);
            });
    };

    // Wait until the new song is loaded
    if (audio.readyState >= 2) {
        startPlayback();
    } else {
        console.log("Waiting for audio to load...");

        audio.addEventListener("canplay", startPlayback, {
            once: true
        });
    }
};

        // REMOTE PAUSE
        const handleRemotePause = (data) => {
    console.log("REMOTE PAUSE:", data);

    const song = currentSongRef.current;

    if (!song) {
        return;
    }

    if (String(song._id) !== String(data.songId)) {
        console.log("Song ID does not match");
        return;
    }

    const audio = audioRef.current;

    if (!audio) {
        return;
    }

    audio.currentTime = data.currentTime || 0;
    audio.pause();

    setIsPlaying(false);

    console.log("REMOTE SONG PAUSED");
};

const handleRemoteSeek = (data) => {
    console.log("REMOTE SEEK:", data);

    if (
        !audioRef.current ||
        !currentSongRef.current
    ) {
        return;
    }

    if (
        String(currentSongRef.current._id) ===
        String(data.songId)
    ) {
        isRemoteSeek.current = true;

        audioRef.current.currentTime =
            data.currentTime;
    }
};

        // REGISTER EVENTS
        socket.on(
            "user-joined",
            handleUserJoined
        );

        socket.on(
            "user-left",
            handleUserLeft
        );

        socket.on(
            "song-selected",
            handleRemoteSongSelected
        );
 
        socket.on(
    "song-changed",
    handleRemoteSongChanged
); 
    socket.on(
    "seek-song",
    handleRemoteSeek
);
   

        const handleRemotePlaylistUpdated = (data) => {
    console.log("REMOTE PLAYLIST UPDATED:", data);

    setRoom((prevRoom) => {
        if (!prevRoom) {
            return prevRoom;
        }

        return {
            ...prevRoom,
            playlist: data.playlist
        };
    });
};

    const handleSyncPlayback = (data) => {
    console.log("SYNC PLAYBACK:", data);

    if (!room || !room.playlist) {
        return;
    }

    const song = room.playlist.find(
        item => String(item._id) === String(data.songId)
    );

    if (!song) {
        console.log("SYNC SONG NOT FOUND:", data.songId);
        return;
    }

    setCurrentSong(song);
    currentSongRef.current = song;

    setTimeout(() => {
        if (!audioRef.current) {
            return;
        }

        audioRef.current.currentTime =
            data.currentTime;

        if (data.isPlaying) {
            audioRef.current
                .play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch(error => {
                    console.log(
                        "Autoplay blocked:",
                        error
                    );
                });
        } else {
            setIsPlaying(false);
        }
    }, 200);
};

    socket.on("playlist-updated", handleRemotePlaylistUpdated);

        socket.on(
            "play-song",
            handleRemotePlay
        );

        socket.on(
            "pause-song",
            handleRemotePause
        );
 
        socket.on(
    "sync-playback",
    handleSyncPlayback
);

        // JOIN SOCKET ROOM
        socket.emit("join-room", {
            roomId: roomId,
            username: username
        });

        

        // CLEANUP
        return () => {
            socket.off(
                "user-joined",
                handleUserJoined
            );

            socket.off(
                "user-left",
                handleUserLeft
            );

            socket.off(
                "song-selected",
                handleRemoteSongSelected
            );

            socket.off(
    "song-changed",
    handleRemoteSongChanged
); 

            socket.off("playlist-updated", handleRemotePlaylistUpdated);

            socket.off(
                "play-song",
                handleRemotePlay
            );

            socket.off(
                "pause-song",
                handleRemotePause
            );

            socket.emit("leave-room", {
                roomId: roomId
            });
        };
    }, [roomId]);

    // =========================
    // ADD SONG
    // =========================

    const handleAddSong = async (e) => {
        e.preventDefault();

        if (
            !songTitle.trim() ||
            !songArtist.trim() ||
            !songUrl.trim()
        ) {
            alert(
                "Please fill all song details"
            );

            return;
        }

        try {
            const response = await fetch(
                `https://listen-buddy-backend.onrender.com/api/rooms/${roomId}/songs`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        title:
                            songTitle.trim(),

                        artist:
                            songArtist.trim(),

                        url:
                            songUrl.trim()
                    })
                }
            );

            const data =
                await response.json();

            console.log(
                "Add Song Response:",
                data
            );

            if (!response.ok) {
                alert(
                    data.message ||
                        "Failed to add song"
                );

                return;
            }

            setRoom(data.room);

            socket.emit("playlist-updated", {
    roomId: roomId,
    playlist: data.room.playlist
});

            setSongTitle("");
            setSongArtist("");
            setSongUrl("");

            setShowAddSong(false);

            alert(
                "Song added successfully"
            );
        } catch (error) {
            console.error(
                "Add Song Error:",
                error
            );

            alert(
                "Cannot connect to server"
            );
        }
    };
 
    const handleRemoveSong = async (songId) => {
    try {
        const response = await fetch(
            `https://listen-buddy-backend.onrender.com/api/rooms/${roomId}/songs/${songId}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.log(data.message);
            return;
        }

        setRoom(data.room);

        // Update playlist for other users
        socket.emit("playlist-updated", {
            roomId: roomId,
            playlist: data.room.playlist
        });

        // If removed song is currently playing
        if (
            currentSongRef.current &&
            String(currentSongRef.current._id) === String(songId)
        ) {
            setCurrentSong(null);
            currentSongRef.current = null;

            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            setIsPlaying(false);
        }

        console.log("Song removed successfully");

    } catch (error) {
        console.error("REMOVE SONG ERROR:", error);
    }
};

    // =========================
    // LEAVE ROOM
    // =========================

    const handleLeaveRoom = () => {
        navigate("/");
    };

    // =========================
    // PLAY / PAUSE
    // =========================

    const handlePlayPause = () => {
    const audio = audioRef.current;
    const song = currentSongRef.current;

    if (!audio || !song) {
        console.log("Audio or song not available");
        return;
    }

    // PAUSE
    if (isPlaying) {
        const currentTime = audio.currentTime;

        audio.pause();
        setIsPlaying(false);

        socket.emit("pause-song", {
            roomId: roomId,
            songId: song._id,
            currentTime: currentTime
        });

        console.log("Pause sent:", currentTime);
    }

    // PLAY
    else {
        const currentTime = audio.currentTime;

        audio.play()
            .then(() => {
                setIsPlaying(true);

                socket.emit("play-song", {
                    roomId: roomId,
                    songId: song._id,
                    currentTime: currentTime
                });

                console.log("Play sent:", currentTime);
            })
            .catch((error) => {
                console.log("Play failed:", error);
            });
    }
};

    // =========================
    // SELECT SONG
    // =========================

    const handleSelectSong = (song, autoPlay = false, notify = true) => {
    if (!song) return;

    setCurrentSong(song);
    currentSongRef.current = song;

    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }

    setIsPlaying(false);

    if (notify) {
        socket.emit("song-selected", {
            roomId,
            song: song
        });
    }

    if (autoPlay) {
        setTimeout(() => {
            if (audioRef.current) {
                audioRef.current
                    .play()
                    .then(() => {
                        setIsPlaying(true);
                    })
                    .catch(error => {
                        console.log("Local play failed:", error);
                    });
            }
        }, 300);
    }
};



    // =========================
    // NEXT SONG
    // =========================
   const handleNextSong = () => {
    if (!room?.playlist?.length) return;

    let nextSong;

    if (!currentSong) {
        nextSong = room.playlist[0];
    } else {
        const currentIndex = room.playlist.findIndex(
            song => String(song._id) === String(currentSong._id)
        );

        const nextIndex =
            (currentIndex + 1) % room.playlist.length;

        nextSong = room.playlist[nextIndex];
    }

    // Local browser
    handleSelectSong(nextSong, true, false);

    // Other browsers
    socket.emit("song-changed", {
        roomId,
        song: nextSong
    });
};

const isRemoteSeek = useRef(false);

const handlePreviousSong = () => {
    if (!room?.playlist?.length) return;

    let previousSong;

    if (!currentSong) {
        previousSong = room.playlist[0];
    } else {
        const currentIndex = room.playlist.findIndex(
            song => String(song._id) === String(currentSong._id)
        );

        const previousIndex =
            (currentIndex - 1 + room.playlist.length) %
            room.playlist.length;

        previousSong = room.playlist[previousIndex];
    }

    // Local browser
    handleSelectSong(previousSong, true, false);

    // Other browsers
    socket.emit("song-changed", {
        roomId,
        song: previousSong
    });
};
    

    // const handleNextSong = () => {
    //     if (
    //         !room ||
    //         room.playlist.length === 0
    //     ) {
    //         return;
    //     }

    //     const currentIndex =
    //         room.playlist.findIndex(
    //             (song) =>
    //                 song._id ===
    //                 currentSongRef
    //                     .current?._id
    //         );

    //     const nextIndex =
    //         currentIndex ===
    //             room.playlist.length -
    //                 1 ||
    //         currentIndex === -1
    //             ? 0
    //             : currentIndex + 1;

    //     const nextSong =
    //         room.playlist[
    //             nextIndex
    //         ];

    //     setCurrentSong(nextSong);

    //     currentSongRef.current =
    //         nextSong;

    //     setIsPlaying(false);
    //     if (audioRef.current) {
    //     audioRef.current.pause();
    //     audioRef.current.currentTime = 0;
    // }

    // socket.emit("song-changed", {
    //     roomId: roomId,
    //     song: nextSong
    // });
    // };

    

    // =========================
    // PREVIOUS SONG
    // =========================

//     const handlePreviousSong = () => {
//         if (
//             !room ||
//             room.playlist.length === 0
//         ) {
//             return;
//         }

//         const currentIndex =
//             room.playlist.findIndex(
//                 (song) =>
//                     song._id ===
//                     currentSongRef
//                         .current?._id
//             );

//         const previousIndex =
//             currentIndex <= 0
//                 ? room.playlist.length -
//                   1
//                 : currentIndex - 1;

//         const previousSong =
//             room.playlist[
//                 previousIndex
//             ];

//         setCurrentSong(
//             previousSong
//         );

//         currentSongRef.current =
//             previousSong;

//         setIsPlaying(false);
//         //(previousSong);


//     if (audioRef.current) {
//         audioRef.current.pause();
//         audioRef.current.currentTime = 0;
//     }

// socket.emit("song-changed", {
//     roomId: roomId,
//     song: previousSong
// });
//     };

    // =========================
    // LOADING
    // =========================

    if (loading) {
        return (
            <h2>
                Loading room...
            </h2>
        );
    }

    // =========================
    // ERROR
    // =========================

    if (error) {
        return (
            <div>
                <h2>
                    {error}
                </h2>

                <button
                    onClick={() =>
                        navigate("/")
                    }
                >
                    Go Home
                </button>
            </div>
        );
    }

    // =========================
    // ROOM UI
    // =========================

    return (
        <div className="room-page">

            {/* HEADER */}

            <header className="room-header">

                <div>
                    <h1>
                        🎵 Listen Buddy
                    </h1>

                    <p>
                        Listen together.
                        Stay connected.
                    </p>
                </div>

                <div className="room-info">

                    <span>
                        Room ID
                    </span>

                    <strong>
                        {room.roomId}
                    </strong>

                </div>

            </header>

            {/* MAIN */}

            <main className="room-container">

                {/* USERS */}

                <section className="users-section">

                    <h2>
                        👥 Users
                    </h2>

                    <div className="user-list">

                        {liveUsers.map(
                            (
                                username,
                                index
                            ) => (
                                <div
                                    className="user"
                                    key={
                                        index
                                    }
                                >

                                    <span>
                                        👤
                                    </span>

                                    <p>
                                        {
                                            username
                                        }
                                    </p>

                                </div>
                            )
                        )}

                    </div>

                </section>

                {/* PLAYER */}

                <section className="player-section">

                    <h2>
                        🎵 Music Player
                    </h2>

                    <div className="now-playing">

                        <div className="album-placeholder">
                            🎵
                        </div>

                        {currentSong ? (
                            <>

                                {/* <h3>
                                    {
                                        currentSong.title
                                    }
                                </h3>

                                <p>
                                    {
                                        currentSong.artist
                                    }
                                </p> */}

                                <h3>
    {currentSong.title}
</h3>

<p>
    {currentSong.artist}
</p>

<div className="song-status">
    {isPlaying ? "🎶 Playing now" : "⏸ Paused"}
</div>



                                <audio
                                    ref={
                                        audioRef
                                    }
                                    controls
                                    src={
                                        currentSong.url
                                    }
                                    onPlay={() =>
                                        setIsPlaying(
                                            true
                                        )
                                    }
                                    onPause={() =>
                                        setIsPlaying(
                                            false
                                        )
                                    }
                                    onEnded={
                                        handleNextSong
                                    }
                                    onSeeked={() => {
    if (isRemoteSeek.current) {
        isRemoteSeek.current = false;
        return;
    }

    if (
        !currentSongRef.current ||
        !audioRef.current
    ) {
        return;
    }

    socket.emit("seek-song", {
        roomId: roomId,
        songId: currentSongRef.current._id,
        currentTime: audioRef.current.currentTime
    });
}}

                                />

                            </>
                        ) : (
                            <>

                                <h3>
                                    No song playing
                                </h3>

                                <p>
                                    Select a song
                                    from the
                                    playlist
                                </p>

                            </>
                        )}

                    </div>

                    <div className="player-controls">
    <button
        type="button"
        onClick={handlePreviousSong}
    >
        ⏮
    </button>

    <button
        type="button"
        onClick={handlePlayPause}
    >
        {isPlaying ? "⏸" : "▶️"}
    </button>

    <button
        type="button"
        onClick={handleNextSong}
    >
        ⏭
    </button>
</div>

                </section>

                {/* PLAYLIST */}

                <section className="playlist-section">

                    <h2>
                        🎶 Playlist
                    </h2>

                    {!showAddSong && (
                        <div className="empty-playlist">

                            {room.playlist
                                .length ===
                                0 && (
                                <p>
                                    Your playlist
                                    is empty.
                                </p>
                            )}

                            <button
                                onClick={() =>
                                    setShowAddSong(
                                        true
                                    )
                                }
                            >
                                + Add Song
                            </button>

                        </div>
                    )}

                    {showAddSong && (
                        <form
                            className="add-song-form"
                            onSubmit={
                                handleAddSong
                            }
                        >

                            <input
                                type="text"
                                placeholder="Song title"
                                value={
                                    songTitle
                                }
                                onChange={(
                                    e
                                ) =>
                                    setSongTitle(
                                        e.target
                                            .value
                                    )
                                }
                            />

                            <input
                                type="text"
                                placeholder="Artist"
                                value={
                                    songArtist
                                }
                                onChange={(
                                    e
                                ) =>
                                    setSongArtist(
                                        e.target
                                            .value
                                    )
                                }
                            />

                            <input
                                type="text"
                                placeholder="Audio URL"
                                value={
                                    songUrl
                                }
                                onChange={(
                                    e
                                ) =>
                                    setSongUrl(
                                        e.target
                                            .value
                                    )
                                }
                            />

                            <div>

                                <button type="submit">
                                    Add Song
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowAddSong(
                                            false
                                        )
                                    }
                                >
                                    Cancel
                                </button>

                            </div>

                        </form>
                    )}

                    {room.playlist.length >
                        0 && (
                        <div className="song-list">

                            {room.playlist.map(
                                (
                                    song,
                                    index
                                ) => (
                                    <div
                                       className={`song ${
                                          currentSong?._id === song._id
                                          ? "active-song"
                                          : ""
                                        }`}
                                        key={index}
                                        onClick={() =>
                                          handleSelectSong(song)
                                        }
                                    >
                                    <div>
                                        <strong>
                                            {
                                                song.title
                                            }
                                        </strong>
                                    
                                        <p>
                                            {
                                                song.artist
                                            }
                                        </p>
                                    </div>
                                    <button
            type="button"
            className="remove-song"
            onClick={(e) => {
                e.stopPropagation();
                console.log("REMOVE BUTTON CLICKED:", song);
                handleRemoveSong(song._id);
            }}
        >
            🗑️
        </button>
                                    </div>
                                    
                                )
                                
                            )}
                            
                            


                        </div>
                    )}

                </section>

            </main>

            {/* LEAVE ROOM */}

            <div className="leave-container">

                <button
                    className="leave-button"
                    onClick={
                        handleLeaveRoom
                    }
                >
                    Leave Room
                </button>

            </div>

        </div>
    );
}

export default Room;