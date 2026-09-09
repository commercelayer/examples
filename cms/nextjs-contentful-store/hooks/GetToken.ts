import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { authenticate } from "@commercelayer/js-auth";

const clientId = process.env.NEXT_PUBLIC_CL_CLIENT_ID as string;

type UseGetToken = {
  (args: { scope: string; countryCode: string }): string;
};

export const useGetToken: UseGetToken = ({ scope, countryCode }) => {
  const [token, setToken] = useState("");

  useEffect(() => {
    let cancelled = false;
    const cookieName = `clAccessToken-${countryCode}`;

    const resolveToken = async () => {
      const cachedToken = Cookies.get(cookieName);
      if (cachedToken) {
        if (!cancelled) setToken(cachedToken);
        return;
      }

      if (!clientId || !scope) return;

      const auth = await authenticate("client_credentials", {
        clientId,
        scope: `market:code:${scope}`
      });
      if (cancelled || !auth?.accessToken) return;

      Cookies.set(cookieName, auth.accessToken, { expires: auth.expires });
      setToken(auth.accessToken);
    };

    void resolveToken();

    return () => {
      cancelled = true;
    };
  }, [scope, countryCode]);

  return token;
};
