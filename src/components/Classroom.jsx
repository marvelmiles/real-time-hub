import React, { useCallback, useEffect, useState } from "react";

const Classroom = ({
  socketApi: { socket, reconnect },
  style,
  currentUser,
}) => {
  const [classroomText, setClassroomMessage] = useState("");
  const [classroomMessage, setclassroomMessage] = useState("");

  const [classroomUsers, setClassroomUsers] = useState([]);

  const joinClassroom = useCallback(
    (socket) => {
      if (!socket.connected) {
        reconnect();
        socket = undefined;
      }

      if (socket) socket.emit("join-class-room", "channel-id", currentUser);
    },
    [reconnect, currentUser]
  );

  useEffect(() => {
    if (socket) {
      joinClassroom(socket);

      socket.on("joined-class-room", ({ firstname }) => {
        setClassroomUsers((users) => [firstname, ...users]);
      });

      socket.on("left-class-room", ({ firstname }) => {
        alert(`${firstname} left the room`);
        setClassroomUsers((users) =>
          users.filter((user) => user !== firstname)
        );
      });

      socket.on("class-room-broadcast", (data) => {
        console.log(`📨 Received: ${data}`);
        setclassroomMessage(data.classroomText);
      });
    }
  }, [joinClassroom, socket]);

  const sendClassroomMessage = () => {
    if (socket) {
      console.log(`📤 Sending: ${classroomText}`);
      socket.emit("class-room-broadcast", "channel-id", {
        classroomText,
      });
    }
  };

  const onLeaveClassroom = () => {
    if (socket) {
      socket.emit("leave-class-room");
      socket.disconnect();
    }
  };

  return (
    <div style={style}>
      <h3>CLASS ROOM</h3>
      <p> {JSON.stringify(classroomUsers)}</p>
      <input
        type="text"
        value={classroomText}
        onChange={(e) => setClassroomMessage(e.target.value)}
        placeholder="Type a classroomText"
      />
      <button onClick={sendClassroomMessage}>Send to classroom</button>
      <p>classroom says: {classroomMessage}</p>
      <button onClick={() => joinClassroom(socket)}>Join class room</button>
      <button onClick={onLeaveClassroom}>Leave class room</button>

      <p>---- CLASSROOM ---</p>
    </div>
  );
};

export default Classroom;
