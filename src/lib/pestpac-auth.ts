const PESTPAC_TOKEN_URL = 'https://is.workwave.com/oauth2/token?scope=openid';

export async function getOAuthToken(
  clientId: string,
  clientSecret: string,
  username: string,
  password: string
): Promise<string> {
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(PESTPAC_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({ grant_type: 'password', username, password }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OAuth failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.access_token as string;
}
