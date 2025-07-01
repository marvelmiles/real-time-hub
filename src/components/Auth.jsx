import React, { useEffect, useState } from "react";
import {
  decryptPrivateKey,
  encryptPrivateKey,
  exportPrivateKey,
  exportPublicKey,
  generateKeyPair,
} from "../utils/crypto";
import { getUsers, loginUser, registerUser } from "../utils/api";
import { getStorage } from "../utils";
import { useNavigate } from "react-router-dom";

export const USER_KEY = "currentUser";

const Auth = ({ style, setCurrentUser, currentUser }) => {
  const [email, setEmail] = useState("");
  const [fullname, setFullname] = useState("");

  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState(null);

  const password = "passwordHack2@#";

  useEffect(() => {
    setCurrentUser(getStorage(USER_KEY) || null);
  }, [setCurrentUser]);

  useEffect(() => {
    const setup = async () => {
      try {
        setUsers(await getUsers());
      } catch (err) {
        console.log(err);
      }
    };

    setup();
  }, []);

  const navigate = useNavigate();

  const onRegister = async (role) => {
    try {
      setLoading(true);
      const names = fullname.split(" ");

      const payload = {
        email,
        role,
        password,
        lastname: names[0] || "",
        firstname: names[1] || "",
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

      const privateKey = await decryptPrivateKey(
        currentUser.encryptedData.encryptedPrivateKey,
        password,
        currentUser.encryptedData.iv,
        currentUser.encryptedData.salt
      );

      currentUser.privateKey = await exportPrivateKey(privateKey);

      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));

      setCurrentUser(currentUser);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const onLogout = () => {
    localStorage.removeItem(USER_KEY);
    setCurrentUser(null);

    navigate("/");
  };

  return (
    <div style={style}>
      <h3>Users Widget</h3>
      <div
        style={{
          display: "grid",
          gap: "8px",
          maxHeight: "200px",
          overflow: "auto",
        }}
      >
        {users ? (
          users.length ? (
            users.map((user, i) => {
              const isCurrentUser = currentUser?.id === user.id;

              return (
                <div
                  key={i}
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <div>
                    {user.firstname} {user.lastname} {user.role}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    {currentUser ? (
                      <>
                        {isCurrentUser ? null : (
                          <button onClick={() => navigate(`/chats/${user.id}`)}>
                            Message
                          </button>
                        )}
                        {isCurrentUser ? (
                          <button onClick={onLogout}>Logout</button>
                        ) : null}
                      </>
                    ) : (
                      <button onClick={() => onLogin(user.email)}>Login</button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <h4>Create a new user please.</h4>
          )
        ) : (
          <h4>Fetching users...</h4>
        )}
        --- Users Widget ---
      </div>
      <h3>Sign up / Register section</h3>
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
      <br />
      <br />
      <div>---- Sign up / Register ----</div>
    </div>
  );
};

export default Auth;
