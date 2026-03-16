"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";

export default function Providers({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  const msalInstance = useMemo(() => {
    const instance = new PublicClientApplication({
      auth: {
        clientId: process.env.NEXT_PUBLIC_AAD_CLIENT_ID!,
        authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AAD_TENANT_ID}`,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
      cache: { cacheLocation: "sessionStorage" },

    });

    instance.addEventCallback((event) => {
      if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        // @ts-ignore
        const account = event.payload.account;
        if (account) instance.setActiveAccount(account);
      }
    });

    return instance;
  }, []);

  useEffect(() => {
    (async () => {
      await msalInstance.initialize();

      const result = await msalInstance.handleRedirectPromise();
      if (result?.account) {
        msalInstance.setActiveAccount(result.account);
      } else {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) msalInstance.setActiveAccount(accounts[0]);
      }

      setReady(true);
    })();
  }, [msalInstance]);

  if (!ready) return <div style={{ padding: 24 }}>Cargando sesión…</div>;

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
