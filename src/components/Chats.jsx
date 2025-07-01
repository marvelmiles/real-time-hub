import React, { useEffect, useState } from "react";
import { getUser, getUserConversations } from "../utils/api";
import { useParams, useSearchParams } from "react-router-dom";
import { decryptText } from "../utils/crypto";
import useAuth from "../hooks/useAuth";
import ChatRoom from "./ChatRoom";

export const CONVERSATION_PARAM_KEY = "chat_cid";

const Chats = (props) => {
  const { userId } = useParams();

  const [searchParams, setSearchParams] = useSearchParams();

  const [chats, setChats] = useState([]);

  const [conversationSelected, setConversationSelected] = useState(false);

  const { currentUser } = useAuth();

  const [otherUser, setOtherUser] = useState(null);

  const [fetching, setFetching] = useState(true);

  const conversationId = searchParams.get(CONVERSATION_PARAM_KEY) || "";

  useEffect(() => {
    const setup = async () => {
      const user = await getUser({
        id: userId,
      });

      setOtherUser(user);
    };

    setup();
  }, [userId]);

  useEffect(() => {
    const setup = async () => {
      if (!currentUser || !otherUser) return;

      const data = (await getUserConversations(currentUser.id)) || [];

      let chats = [];

      for (const chat of data) {
        chats.push({
          ...chat,
          text: decryptText(currentUser, chat.lastMessage),
        });
      }

      if (!chats.find((chat) => !!chat.participants[otherUser.id])) {
        chats = [
          {
            participants: {
              [otherUser.id]: otherUser,
            },
          },
          ...chats,
        ];

        setConversationSelected(true);
      }

      setChats(chats);
      setFetching(false);
    };

    setup();
  }, [currentUser, otherUser]);

  const style = { border: "1px solid black" };
  return (
    <div style={props.style}>
      <h3>Chat Room</h3>
      {fetching ? (
        <h3>Fetching user conversations, please wait...</h3>
      ) : chats.length ? (
        <>
          <div style={{ display: "flex", alignItems: "stretch" }}>
            <div style={style}>
              <div style={{ padding: "0px 8px" }}>
                <h4>Conversations</h4>
              </div>
              <div
                style={{
                  display: "grid",
                  maxHeight: "200px",
                  overflow: "auto",
                }}
              >
                {chats.map((chat, i) => {
                  const user = chat.participants[userId];
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        if (chat.id)
                          setSearchParams((params) => {
                            params.set(CONVERSATION_PARAM_KEY, chat.id);
                            return params;
                          });
                      }}
                      style={{
                        padding: "0 8px",
                        cursor: "pointer",
                        borderLeft: (
                          chat.id
                            ? chat.id === conversationId
                            : user.id === userId
                        )
                          ? "4px solid red"
                          : "",
                      }}
                    >
                      <p>
                        {user.firstname} {user.lastname}
                      </p>
                      <p>{chat.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <ChatRoom
              {...props}
              style={style}
              otherUser={otherUser}
              selected={conversationSelected}
            />
          </div>
        </>
      ) : (
        <>
          <h3>Start a conversation with someone</h3>
        </>
      )}
      <p> ----- CHAT ROOM----</p>
    </div>
  );
};

export default Chats;
