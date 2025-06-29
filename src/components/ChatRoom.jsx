import React, { useCallback, useEffect, useRef, useState } from "react";
import { debounce, removeDuplicate } from "../utils";
import {
  decryptMessage,
  encryptMessage,
  importPrivateKey,
} from "../utils/crypto";
import { getMessages } from "../utils/api";

const ChatRoom = ({ socketApi: { socket }, style, currentUser, otherUser }) => {
  const [chatMessage, setChatMessage] = useState("");

  const [chatMessages, setChatMessages] = useState([]);

  const [typing, setTyping] = useState(null);

  const stateRef = useRef({ isTyping: false });

  const conversationId = "6860a5c36b14526b81255ce7";

  const decryptText = useCallback(
    async (msg) => {
      const privateKey = await importPrivateKey(currentUser.privateKey);

      const decrypted = await decryptMessage(
        privateKey,
        msg.recipients[currentUser.id]
      );

      return decrypted;
    },
    [currentUser.privateKey, currentUser.id]
  );

  useEffect(() => {
    const setup = async () => {
      try {
        const messages = [];

        const data = await getMessages(currentUser.id, conversationId);

        for (const msg of data) {
          messages.push({
            ...msg,
            text: await decryptText(msg),
          });
        }

        setChatMessages(messages);
      } catch (err) {
        console.log(err.response, err.data, err.stack, err.details);
      }
    };

    setup();
  }, [currentUser.id, conversationId, decryptText]);

  useEffect(() => {
    if (socket) {
      socket.emit("join-chat-room");

      socket.on("new-chat-message", async (msg) => {
        const text = await decryptText(msg);

        setChatMessages((messages) =>
          removeDuplicate([...messages, { ...msg, text }])
        );

        socket.emit("chat-message-delivered", msg.id);

        const id = setTimeout(() => {
          clearTimeout(id);

          socket.emit("chat-message-read", msg.id);
        }, 4000);
      });

      const onUpdateMessage = (message) => {
        setChatMessages((messages) => {
          return messages.map((msg) =>
            msg.id === message.id ? { ...msg, ...message } : msg
          );
        });
      };

      socket.on("chat-message-saved", ({ tempId, message }) => {
        setChatMessages((messages) => {
          return messages.map((msg) =>
            msg.tempId === tempId ? { ...msg, ...message } : msg
          );
        });
      });

      socket.on("chat-message-read", onUpdateMessage);

      socket.on("chat-message-delivered", onUpdateMessage);

      socket.on("chat-user-typing", (from) => {
        setTyping(from);
      });

      socket.on("chat-user-stopped-typing", () => {
        setTyping(null);
      });
    }
  }, [socket, decryptText]);

  const sendChatMessage = async () => {
    const tempId = new Date().getTime();

    const receiverEncryptedMessage = await encryptMessage(
      otherUser.encryptedData.publicKey,
      chatMessage
    );

    const senderEncryptedMessage = await encryptMessage(
      currentUser.encryptedData.publicKey,
      chatMessage
    );

    const message = {
      conversationId,
      tempId,
      sender: currentUser,
      receiver: otherUser,
      recipients: {
        [currentUser.id]: senderEncryptedMessage,
        [otherUser.id]: receiverEncryptedMessage,
      },
    };

    setChatMessages((messages) =>
      removeDuplicate([...messages, { ...message, text: chatMessage }])
    );

    socket.emit("send-chat-message", message);

    setChatMessage("");
  };

  const stopTyping = useRef(
    debounce((socket) => {
      socket.emit("chat-user-stopped-typing", otherUser.id, currentUser);
      stateRef.current.isTyping = false;
    }, 1000)
  ).current;

  const handleTyping = (e) => {
    if (socket) {
      if (!stateRef.current.isTyping) {
        socket.emit("chat-user-typing", otherUser.id, currentUser);
        stateRef.current.isTyping = true;
      }

      stopTyping(socket);
    }
    setChatMessage(e.target.value);
  };

  return (
    <div style={style}>
      <h3>CHAT ROOM</h3>
      {typing ? <p>{typing.firstname} is typing</p> : null}
      <input
        type="text"
        value={chatMessage}
        onChange={handleTyping}
        placeholder="Send a chat message"
      />
      <button onClick={sendChatMessage}>Message {otherUser.firstname}</button>
      <h4>Chat messages</h4>
      <div>
        {chatMessages.map((message, i) => (
          <div key={i} style={{ display: "flex", gap: "4px" }}>
            <p>{message.text}</p>
            <p>{message.createdAt ? "saved" : "pending"}</p>
            {message.deliveredAt ? <p>delivered</p> : null}
            {message.readAt ? <p>Read</p> : null}
          </div>
        ))}
      </div>
      <p> ----- CHAT ROOM----</p>
    </div>
  );
};

export default ChatRoom;
