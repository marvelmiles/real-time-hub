import { getStorage } from ".";
import { USER_KEY } from "../components/Auth";

const API_URL = "http://localhost:8000/api";

const registerUser = async (payload) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
};

const loginUser = async (payload) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  return {
    ...data.data.user,
    accessToken: data.data.accessToken,
  };
};

const getMessages = async (userId, conversationId) => {
  const res = await fetch(
    `${API_URL}/chat/conversation-messages/${conversationId}/${userId}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${
          getStorage(USER_KEY)?.currentUser?.accessToken
        }`,
      },
    }
  );
  const data = await res.json();

  return data.data;
};

const getUser = async (payload) => {
  const res = await fetch(`${API_URL}/dev/get-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();

  return data.data;
};

export { registerUser, loginUser, getMessages, getUser };
