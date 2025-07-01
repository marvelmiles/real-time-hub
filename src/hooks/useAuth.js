import { useMemo } from "react";
import { getStorage } from "../utils";
import { USER_KEY } from "../components/Auth";

const useAuth = () => {
  return {
    currentUser: useMemo(() => {
      return getStorage(USER_KEY) || null;
    }, []),
  };
};

export default useAuth;
