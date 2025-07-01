import React, { useCallback, useEffect, useRef, useState } from "react";
import { debounce, removeDuplicate, safelyBind } from "../utils";
import { decryptText, encryptMessage } from "../utils/crypto";
import { getMessages } from "../utils/api";
import { useSearchParams } from "react-router-dom";
import { CONVERSATION_PARAM_KEY } from "./Chats";

const ChatRoom = ({
  socketApi: { socket },
  style,
  currentUser,
  otherUser,
  selected,
}) => {
  const [chatMessage, setChatMessage] = useState("");

  const [chatMessages, setChatMessages] = useState([]);

  const [typing, setTyping] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const [fetchingMessages, setFetchingMessages] = useState(true);

  const stateRef = useRef({ isTyping: false });

  const conversationId = searchParams.get(CONVERSATION_PARAM_KEY) || "";

  useEffect(() => {
    const setup = async () => {
      try {
        if (!currentUser) return;

        setFetchingMessages(true);

        const messages = [];

        const data = conversationId
          ? await getMessages(currentUser.id, conversationId)
          : [];

        for (const msg of data) {
          const text = await decryptText(currentUser, msg);

          messages.push({
            ...msg,
            text,
          });
        }

        setChatMessages(messages);
      } catch (err) {
        console.log(err.response, err.data, err.stack, err.details);

        setChatMessage([]);
      } finally {
        setFetchingMessages(false);
      }
    };

    setup();
  }, [currentUser, conversationId]);

  const updateConversationId = useCallback(
    (msg) => {
      setSearchParams(
        (params) => {
          params.set(CONVERSATION_PARAM_KEY, msg.conversation.id);

          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (socket && currentUser) {
      socket.emit("join-chat-room");

      safelyBind(socket, "new-chat-message", async (msg) => {
        if (
          msg.conversation.id === conversationId ||
          msg.conversation.participants[otherUser.id]
        ) {
          updateConversationId(msg);

          const text = await decryptText(currentUser, msg);

          setChatMessages((messages = []) => {
            let newMessages = [];

            const newMessage = { ...msg, text };

            if (msg.sender.id === currentUser.id) {
              newMessages = messages.map((message) => {
                return message.tempId === msg.tempId ? newMessage : message;
              });
            } else newMessages = [...messages, newMessage];

            return removeDuplicate(newMessages);
          });

          if (msg.sender.id !== currentUser.id) {
            socket.emit("chat-message-delivered", msg.id);

            const id = setTimeout(() => {
              clearTimeout(id);

              socket.emit("chat-message-read", msg.id);
            }, 4000);
          }
        }
      });

      const onUpdateMessage = (message) => {
        setChatMessages((messages) => {
          return messages.map((msg) =>
            msg.id === message.id ? { ...msg, ...message } : msg
          );
        });
      };

      safelyBind(socket, "chat-message-saved", ({ tempId, message }) => {
        updateConversationId(message);
        setChatMessages((messages) => {
          return messages.map((msg) =>
            msg.tempId === tempId ? { ...msg, ...message } : msg
          );
        });
      });

      safelyBind(socket, "chat-message-read", onUpdateMessage);

      safelyBind(socket, "chat-message-delivered", onUpdateMessage);

      safelyBind(socket, "chat-user-typing", (from) => {
        setTyping(from);
      });

      safelyBind(socket, "chat-user-stopped-typing", () => {
        setTyping(null);
      });
    }
  }, [socket, currentUser, otherUser.id, conversationId, updateConversationId]);

  const sendChatMessage = async () => {
    if (!chatMessage || fetchingMessages) return;
    // client temp id to track pending message.
    const tempId = new Date().getTime(); // use uuid package for a more unique id

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
      sender: { role: currentUser.role, id: currentUser.id },
      receiver: { role: otherUser.role, id: otherUser.id },
      recipients: {
        [currentUser.id]: senderEncryptedMessage,
        [otherUser.id]: receiverEncryptedMessage,
      },
    };

    setChatMessages((messages = []) =>
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
    if (fetchingMessages) return;

    if (socket) {
      if (!stateRef.current.isTyping) {
        socket.emit("chat-user-typing", otherUser.id, currentUser);
        stateRef.current.isTyping = true;
      }

      stopTyping(socket);
    }
    setChatMessage(e.target.value);
  };

  const withConversation = conversationId || selected;

  return (
    <div
      style={{
        ...style,
        padding: "0px 8px",
      }}
    >
      <div>
        <div>
          <h4>
            {otherUser.firstname} {otherUser.lastname} is{" "}
            {otherUser.isLoggedIn ? "online" : "offline"}
          </h4>
        </div>

        {withConversation ? (
          <>
            {fetchingMessages ? (
              <h3>Fetching messages, please wait...</h3>
            ) : chatMessages.length ? (
              chatMessages.map((message, i) => (
                <div key={i} style={{ display: "flex", gap: "4px" }}>
                  <p>{message.text}</p>
                  <p>{message.createdAt ? "saved" : "pending"}</p>
                  {message.deliveredAt ? <p>delivered</p> : null}
                  {message.readAt ? <p>Read</p> : null}
                </div>
              ))
            ) : (
              <h3>You have no conversation together.</h3>
            )}

            {typing ? <p>{typing.firstname} is typing</p> : null}
            <input
              type="text"
              value={chatMessage}
              onChange={handleTyping}
              placeholder="Send message"
            />
            <button onClick={sendChatMessage}>Send message</button>
          </>
        ) : (
          <h3>Select a conversation </h3>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;
