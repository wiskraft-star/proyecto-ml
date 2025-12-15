import "server-only";

import { envServer, assertMlEnv } from "@/lib/env";
import type { MlOAuthTokenResponse } from "@/lib/ml/types";

export async function refreshMlAccessToken(): Promise<{ accessToken: string; raw: MlOAuthTokenResponse }> {
  assertMlEnv();

  const url = "https://api.mercadolibre.com/oauth/token";
  const body = {
    grant_type: "refresh_token",
    client_id: envServer.mlClientId,
    client_secret: envServer.mlClientSecret,
    refresh_token: envServer.mlRefreshToken,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`ML oauth error ${resp.status}: ${text.slice(0, 400)}`);
  }

  const json = (await resp.json()) as MlOAuthTokenResponse;
  if (!json.access_token) throw new Error("ML oauth: missing access_token");
  return { accessToken: json.access_token, raw: json };
}
