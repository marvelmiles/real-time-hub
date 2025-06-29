import React, { useState } from "react";
import {
  decryptPrivateKey,
  encryptPrivateKey,
  exportPrivateKey,
  exportPublicKey,
  generateKeyPair,
} from "../utils/crypto";
import { getUser, loginUser, registerUser } from "../utils/api";

export const USER_KEY = "currentUser";

const Auth = ({ style, setUsers }) => {
  const [email, setEmail] = useState("");
  const [fullname, setFullname] = useState("");

  const [loading, setLoading] = useState(false);

  const password = "passwordHack2@#";

  const onRegister = async (role) => {
    try {
      setLoading(true);
      const names = fullname.split(" ");

      const payload = {
        email,
        role,
        password,
        lastname: names[0],
        firstname: names[1],
        image:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/1cAAn8B9XHhlYcAAAAASUVORK5CYII=",
      };
      const keyPair = await generateKeyPair();
      const exportedPublicKey = await exportPublicKey(keyPair.publicKey);
      const { encryptedPrivateKey, iv, salt } = await encryptPrivateKey(
        keyPair.privateKey,
        payload.password
      );

      await registerUser({
        ...payload,
        encryptedData: {
          publicKey: exportedPublicKey.toString(),
          encryptedPrivateKey: encryptedPrivateKey.toString(),
          iv,
          salt,
        },
      });
    } catch (err) {
      console.log(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async (_email) => {
    try {
      setLoading(true);

      const currentUser = await loginUser({ email: _email || email, password });

      const otherUser = await getUser({
        email:
          currentUser.role === "tutor"
            ? "martins@gmail.com"
            : "bidemi@gmail.com",
      });

      const privateKey = await decryptPrivateKey(
        currentUser.encryptedData.encryptedPrivateKey,
        password,
        currentUser.encryptedData.iv,
        currentUser.encryptedData.salt
      );

      currentUser.privateKey = await exportPrivateKey(privateKey);

      const users = { currentUser, otherUser };

      localStorage.setItem(USER_KEY, JSON.stringify(users));

      setUsers(users);
    } catch (err) {
      console.log(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={style}>
      <h3>Auth</h3>
      {loading ? <p>Processing...., please wait.</p> : null}
      <input
        placeholder="Fullname"
        type="text"
        value={fullname}
        onChange={(e) => setFullname(e.target.value)}
      />

      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={() => onRegister("student")}>Register student</button>

      <button onClick={() => onRegister("tutor")}>Register tutor</button>

      <button onClick={() => onLogin("bidemi@gmail.com")}>
        Login tutor bidemi@gmail.com
      </button>
      <button onClick={() => onLogin("martins@gmail.com")}>
        Login student martins@gmail.com
      </button>
      <button onClick={() => onLogin("")}>Login any user</button>
    </div>
  );
};

export default Auth;
