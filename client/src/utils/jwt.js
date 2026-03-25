const decodeBase64Url = (base64Url) => {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;

  return atob(padded);
};

export const parseJwtPayload = (token) => {
  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = decodeBase64Url(parts[1]);
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

export const getRoleFromToken = (token) => {
  const payload = parseJwtPayload(token);
  return payload?.role ?? 'unknown';
};

export const isTokenExpired = (token) => {
  const payload = parseJwtPayload(token);

  if (!payload || typeof payload.exp !== 'number') {
    return true;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
};

export const isTokenValid = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }

  if (!parseJwtPayload(token)) {
    return false;
  }

  return !isTokenExpired(token);
};
