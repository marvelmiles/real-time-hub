const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const generateKeyPair = async () => {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
};

const deriveKeyFromPassword = async (password, salt) => {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

const encryptPrivateKey = async (privateKey, password) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await deriveKeyFromPassword(password, salt);
  const exported = await crypto.subtle.exportKey("pkcs8", privateKey);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    exported
  );

  return {
    encryptedPrivateKey: btoa(
      String.fromCharCode(...new Uint8Array(encrypted))
    ),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
  };
};

const decryptPrivateKey = async (
  encryptedBase64,
  password,
  ivBase64,
  saltBase64
) => {
  const salt = Uint8Array.from(atob(saltBase64), (c) => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));
  const encrypted = Uint8Array.from(atob(encryptedBase64), (c) =>
    c.charCodeAt(0)
  );

  const aesKey = await deriveKeyFromPassword(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encrypted
  );

  return crypto.subtle.importKey(
    "pkcs8",
    decrypted,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
};

const exportPublicKey = async (publicKey) => {
  const raw = await crypto.subtle.exportKey("spki", publicKey);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
};

const encryptMessage = async (publicKeyBase64, message) => {
  if (!message) return "";

  const keyBuffer = Uint8Array.from(atob(publicKeyBase64), (c) =>
    c.charCodeAt(0)
  );
  const key = await crypto.subtle.importKey(
    "spki",
    keyBuffer.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
  const encoded = textEncoder.encode(message);
  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    encoded
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};

const decryptMessage = async (privateKey, encryptedMessage) => {
  if (!encryptedMessage) return "";
  const buffer = Uint8Array.from(atob(encryptedMessage), (c) =>
    c.charCodeAt(0)
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    buffer
  );

  return textDecoder.decode(decrypted);
};

const exportPrivateKey = async (privateKey) => {
  const rawKey = await crypto.subtle.exportKey("pkcs8", privateKey);
  return btoa(String.fromCharCode(...new Uint8Array(rawKey)));
};

const importPrivateKey = async (base64Key) => {
  const rawKey = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    "pkcs8",
    rawKey.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
};

const decryptText = async (currentUser, msg) => {
  if (!msg) return "";

  const privateKey = await importPrivateKey(currentUser.privateKey);

  const decrypted = await decryptMessage(
    privateKey,
    msg.recipients[currentUser.id]
  );

  return decrypted;
};

export const encryptFile = async (file, recipientPublicKeyBase64) => {
  // encrypt file is based on a hybrid encryption scheme

  const fileBuffer = await file.arrayBuffer();

  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization Vector
  const encryptedContent = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    fileBuffer
  );

  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
  const base64AesKey = btoa(String.fromCharCode(...new Uint8Array(rawAesKey)));

  const encryptedAesKey = await encryptMessage(
    recipientPublicKeyBase64,
    base64AesKey
  );

  const encryptedFileBase64 = btoa(
    String.fromCharCode(...new Uint8Array(encryptedContent))
  );
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return {
    encryptedFile: encryptedFileBase64,
    encryptedKey: encryptedAesKey,
    iv: ivBase64,
  };
};

export const decryptFile = async (fileMessage, privateKeyBase64) => {
  const privateKey = await importPrivateKey(privateKeyBase64);

  const base64AesKey = await decryptMessage(
    privateKey,
    fileMessage.encryptedKey
  );

  const aesKeyBuffer = Uint8Array.from(atob(base64AesKey), (c) =>
    c.charCodeAt(0)
  ).buffer;

  const aesKey = await crypto.subtle.importKey(
    "raw",
    aesKeyBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const ivBytes = Uint8Array.from(atob(fileMessage.iv), (c) => c.charCodeAt(0));

  const encryptedFileBuffer = Uint8Array.from(
    atob(fileMessage.encryptedFile),
    (c) => c.charCodeAt(0)
  ).buffer;

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    aesKey,
    encryptedFileBuffer
  );

  return new Uint8Array(decryptedBuffer);
};

export const decryptRecipientFile = async (
  receiver,
  fileMessage,
  type = "blob"
) => {
  const decrypted = await decryptFile(
    fileMessage.recipients[receiver.id],
    receiver.privateKey
  );

  const blob = new Blob([decrypted], { type: fileMessage.mimetype });

  const file =
    type === "blob"
      ? blob
      : new File([blob], `${fileMessage.name}.${fileMessage.extention}`, {
          type: fileMessage.mimetype,
          lastModified: Date.now(),
        });

  return file;
};

export {
  decryptText,
  generateKeyPair,
  encryptPrivateKey,
  decryptPrivateKey,
  exportPublicKey,
  encryptMessage,
  decryptMessage,
  exportPrivateKey,
  importPrivateKey,
};
