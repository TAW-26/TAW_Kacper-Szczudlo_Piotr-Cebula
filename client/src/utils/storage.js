export const AUTH_TOKEN_KEY = 'gastrohub_token';
export const TABLE_ASSIGNMENTS_KEY = 'gastrohub_table_assignments';
export const TABLE_LAYOUT_KEY = 'gastrohub_table_layout';
export const TABLE_LAYOUT_POSITIONS_KEY = 'gastrohub_table_layout_positions';
export const ORDER_TABLE_MAP_KEY = 'gastrohub_order_table_map';
export const ORDER_TICKET_MAP_KEY = 'gastrohub_order_ticket_map';
export const TABLE_OPEN_TICKET_KEY = 'gastrohub_table_open_ticket';

export const loadJson = (key, fallback) => {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
};

export const saveJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const loadToken = () => localStorage.getItem(AUTH_TOKEN_KEY) ?? '';

export const saveToken = (token) => {
  if (!token) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token);
};
