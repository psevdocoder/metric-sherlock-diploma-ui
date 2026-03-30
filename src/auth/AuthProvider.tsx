import { createContext, type PropsWithChildren, useEffect, useRef, useState } from 'react';
import Keycloak, { type KeycloakTokenParsed } from 'keycloak-js';
import { env } from '../config/env';

type ParsedToken = KeycloakTokenParsed & {
  roles?: string[];
  preferred_username?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  team_name?: string;
};

export interface AuthUser {
  username: string;
  full_name: string;
  given_name: string;
  family_name: string;
  team_name: string;
}

export interface AuthContextValue {
  status: 'loading' | 'authenticated' | 'error';
  token: string | null;
  roles: string[];
  user: AuthUser | null;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function isPkceAvailable(): boolean {
  return Boolean(window.isSecureContext && window.crypto && 'subtle' in window.crypto);
}

function extractRoles(token: ParsedToken | undefined): string[] {
  const directRoles = token?.roles ?? [];

  if (directRoles.includes('admin')) {
    return ['admin'];
  }

  if (directRoles.includes('user')) {
    return ['user'];
  }

  return [];
}

function extractUser(token: ParsedToken | undefined): AuthUser | null {
  if (!token) {
    return null;
  }

  return {
    username: token.preferred_username ?? '',
    full_name: token.name ?? token.preferred_username ?? '',
    given_name: token.given_name ?? '',
    family_name: token.family_name ?? '',
    team_name: token.team_name ?? '',
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const keycloakRef = useRef<Keycloak | null>(null);
  const [authState, setAuthState] = useState<{
    status: 'loading' | 'authenticated' | 'error';
    token: string | null;
    roles: string[];
    user: AuthUser | null;
    error: string | null;
  }>({
    status: 'loading',
    token: null,
    roles: [],
    user: null,
    error: null,
  });

  useEffect(() => {
    let disposed = false;

    const keycloak = new Keycloak({
      url: env.keycloak_url,
      realm: env.keycloak_realm,
      clientId: env.keycloak_client_id,
    });

    keycloakRef.current = keycloak;

    const syncState = () => {
      if (disposed) {
        return;
      }

      const parsedToken = keycloak.tokenParsed as ParsedToken | undefined;
      setAuthState({
        status: 'authenticated',
        token: keycloak.token ?? null,
        roles: extractRoles(parsedToken),
        user: extractUser(parsedToken),
        error: null,
      });
    };

    keycloak.onAuthSuccess = syncState;
    keycloak.onAuthRefreshSuccess = syncState;
    keycloak.onAuthLogout = () => {
      if (disposed) {
        return;
      }

      setAuthState({
        status: 'loading',
        token: null,
        roles: [],
        user: null,
        error: null,
      });
    };

    void (async () => {
      try {
        const initOptions = {
          onLoad: 'login-required' as const,
          checkLoginIframe: false,
          ...(isPkceAvailable() ? { pkceMethod: 'S256' as const } : {}),
        };

        const authenticated = await keycloak.init({
          ...initOptions,
        });

        if (!authenticated) {
          await keycloak.login({
            redirectUri: window.location.href,
          });
          return;
        }

        syncState();
      } catch (error) {
        if (disposed) {
          return;
        }

        setAuthState({
          status: 'error',
          token: null,
          roles: [],
          user: null,
          error: error instanceof Error ? error.message : 'Не удалось инициализировать SSO',
        });
      }
    })();

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (authState.status !== 'authenticated') {
      return;
    }

    const intervalId = window.setInterval(() => {
      void (async () => {
        try {
          await keycloakRef.current?.updateToken(60);
        } catch {
          await keycloakRef.current?.login({
            redirectUri: window.location.href,
          });
        }
      })();
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [authState.status]);

  async function login() {
    await keycloakRef.current?.login({
      redirectUri: window.location.href,
    });
  }

  async function logout() {
    await keycloakRef.current?.logout({
      redirectUri: window.location.origin,
    });
  }

  async function refreshToken() {
    if (!keycloakRef.current) {
      return null;
    }

    try {
      await keycloakRef.current.updateToken(60);
      const parsedToken = keycloakRef.current.tokenParsed as ParsedToken | undefined;

      setAuthState({
        status: 'authenticated',
        token: keycloakRef.current.token ?? null,
        roles: extractRoles(parsedToken),
        user: extractUser(parsedToken),
        error: null,
      });

      return keycloakRef.current.token ?? null;
    } catch {
      await keycloakRef.current.login({
        redirectUri: window.location.href,
      });

      return null;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
