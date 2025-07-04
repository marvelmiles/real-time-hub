import React, { useEffect, useRef } from "react";
import { decryptRecipientFile, encryptFile } from "../utils/crypto";

const FileUpload = ({ reset, receiver, sender, onUploads }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (reset) {
      inputRef.current.value = null;
    }
  }, [reset]);

  const uploadFiles = async (files) => {
    const encryptedFiles = [];

    for (const file of files) {
      const recipients = {};

      recipients[receiver.id] = await encryptFile(
        file,
        receiver.encryptedData.publicKey
      );

      recipients[sender.id] = await encryptFile(
        file,
        sender.encryptedData.publicKey
      );

      encryptedFiles.push({
        recipients,
        name: new Date().getTime().toString(),
        extention: file.name.split(".").pop(),
        mimetype: file.type,
        size: file.size,
      });
    }

    console.log(await decryptRecipientFile(sender, encryptedFiles[0]));

    onUploads(encryptedFiles);
  };

  const handleFileChange = (e) => {
    uploadFiles(Array.from(e.target.files));
  };

  return (
    <div>
      <input ref={inputRef} type="file" multiple onChange={handleFileChange} />
      {/* <button onClick={uploadFiles} disabled={uploading || files.length === 0}>
        {uploading ? "Encrypting & Uploading..." : "Upload Files"}
      </button> */}
    </div>
  );
};

export default FileUpload;
