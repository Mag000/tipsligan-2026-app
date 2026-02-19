import { useState } from "react";

export interface TokenData {
  token: string;
  username: string;
  userId: number;
}

export default function useToken() {
  const getToken = (): TokenData | null => {
    const tokenString = localStorage.getItem("token");
    if (!tokenString) return null;
    try {
      return JSON.parse(tokenString);
    } catch {
      return null;
    }
  };

  const [token, setToken] = useState<TokenData | null>(getToken());

  const saveToken = (userToken: TokenData) => {
    localStorage.setItem("token", JSON.stringify(userToken));
    setToken(userToken);
  };

  const removeToken = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return {
    token,
    setToken: saveToken,
    removeToken,
  };
}
