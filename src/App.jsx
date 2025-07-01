import { useSocket } from "./hooks/useSocket";
import Classroom from "./components/Classroom";
import { useEffect, useMemo, useState } from "react";
import Auth from "./components/Auth";
import { Route, Routes } from "react-router-dom";
import Chats from "./components/Chats";

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const socketOpts = useMemo(
    () => ({
      auth: {
        token: currentUser?.accessToken,
      },
    }),
    [currentUser?.accessToken]
  );

  const socketApi = useSocket(
    "http://localhost:8000",
    currentUser ? socketOpts : undefined
  );

  const { socket, connected } = socketApi;

  useEffect(() => {
    if (socket) {
      socket.on("error-response", (error) => {
        console.log(error);
      });

      socket.on("connect_error", (err) => {
        console.log("Socket Connection blocked:", err.message, err.data);
      });
    }
  }, [socket]);

  const props = {
    setCurrentUser,
    socketApi,
    currentUser,
    style: { margin: "15px 0px" },
  };

  return (
    <div>
      <h1>React + Socket.IO Demo</h1>
      <h2>Welcome to Real time Hub</h2>
      <h3>
        {connected
          ? `Socket connected to server successfully! ${connected}`
          : currentUser
          ? "Socket not connected to server"
          : "Not Signed in"}
      </h3>
      {currentUser ? (
        <h3>
          Signed In as {currentUser.role} {currentUser.firstname}{" "}
          {currentUser.lastname}
        </h3>
      ) : null}

      <Auth {...props} />

      {currentUser ? (
        <>
          <br /> <br />
          <Routes>
            <Route path="/chats/:userId" element={<Chats {...props} />} />
            <Route path="/classroom" element={<Classroom />} />
          </Routes>
        </>
      ) : null}
    </div>
  );
}

export default App;
