import { createRemoteJWKSet, jwtVerify } from "jose";

export interface AccessEnv {
  TEAM_DOMAIN?: string;
  POLICY_AUD?: string;
}

type AuthenticatedUser = {
  ok: true;
  userKey: string;
};

type AuthenticationFailure = {
  ok: false;
  response: Response;
};

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jsonError(message: string, status: number) {
  return Response.json(
    { error: message },
    { status, headers: { "cache-control": "no-store" } }
  );
}

function getJwks(teamDomain: string) {
  let jwks = jwksCache.get(teamDomain);
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(teamDomain.replace(/\/$/, "") + "/cdn-cgi/access/certs")
    );
    jwksCache.set(teamDomain, jwks);
  }
  return jwks;
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function authenticateAccessUser(
  request: Request,
  env: AccessEnv
): Promise<AuthenticatedUser | AuthenticationFailure> {
  const teamDomain = env.TEAM_DOMAIN?.replace(/\/$/, "");
  const audience = env.POLICY_AUD;

  if (!teamDomain || !audience) {
    return {
      ok: false,
      response: jsonError("Cloudflare Access is not configured", 503)
    };
  }

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) {
    return {
      ok: false,
      response: jsonError("Cloudflare Access authentication required", 401)
    };
  }

  try {
    const { payload } = await jwtVerify(token, getJwks(teamDomain), {
      issuer: teamDomain,
      audience
    });

    if (typeof payload.email !== "string" || !payload.email.trim()) {
      return {
        ok: false,
        response: jsonError("Authenticated identity has no email claim", 403)
      };
    }

    return {
      ok: true,
      userKey: await sha256(payload.email.trim().toLowerCase())
    };
  } catch {
    return {
      ok: false,
      response: jsonError("Invalid Cloudflare Access token", 403)
    };
  }
}
