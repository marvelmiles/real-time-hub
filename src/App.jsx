import { useSocket } from "./hooks/useSocket";
import ChatRoom from "./components/ChatRoom";
import Classroom from "./components/Classroom";
import { useEffect, useMemo, useState } from "react";
import Auth, { USER_KEY } from "./components/Auth";
import { getStorage } from "./utils";

function App() {
  const [users, setUsers] = useState(null);

  const currentUser = users?.currentUser;

  const otherUser = users?.otherUser;

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
    setUsers(getStorage(USER_KEY) || null);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("error-response", (error) => {
        console.log(error);
      });

      socket.on("connect_error", (err) => {
        console.log(
          "Connection blocked:",
          err.message,
          err.status,
          err.response,
          err.data
        );
      });
    }
  }, [socket]);

  const props = {
    setUsers,
    socketApi,
    currentUser,
    otherUser,
    style: { margin: "15px 0px" },
  };

  return (
    <div>
      <h1>React + Socket.IO Demo</h1>
      <h3>
        {connected
          ? `Server connected successfully! ${connected}`
          : currentUser
          ? "Awaiting connection..."
          : "Not Signed in"}
      </h3>

      <Auth {...props} />

      {currentUser ? (
        <>
          <h3>
            Signed In as {currentUser.role} {currentUser.firstname}{" "}
            {currentUser.lastname}
          </h3>
          <ChatRoom {...props} />

          <Classroom {...props} />
        </>
      ) : null}
    </div>
  );
}

export default App;
