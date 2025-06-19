// "use client";

// import React, { createContext, useContext, useEffect, useState } from "react";
// import { setAccessToken as setAxiosToken } from "../utils/axiosInstance";

// type AuthTokenContextType = {
//   accessToken: string | null;
//   setToken: (token: string) => void;
// };

// const AuthTokenContext = createContext<AuthTokenContextType | undefined>(undefined);

// export const AuthTokenProvider = ({ children }: { children: React.ReactNode }) => {
//   const [accessToken, setAccessToken] = useState<string | null>(null);

//   useEffect(() => {
//     const storedToken = sessionStorage.getItem("admin_access_token");
//     if (storedToken) {
//       setAccessToken(storedToken);
//       setAxiosToken(storedToken); // Sync with axios
//     }
//   }, []);

//   const setToken = (token: string) => {
//     sessionStorage.setItem("admin_access_token", token);
//     setAccessToken(token);
//     setAxiosToken(token);
//   };

//   return (
//     <AuthTokenContext.Provider value={{ accessToken, setToken }}>
//       {children}
//     </AuthTokenContext.Provider>
//   );
// };

// export const useAuthToken = () => {
//   const context = useContext(AuthTokenContext);
//   if (!context) throw new Error("useAuthToken must be used within AuthTokenProvider");
//   return context;
// };
