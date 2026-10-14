CREATE TABLE IF NOT EXISTS online_players (
  id TEXT PRIMARY KEY NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  room_id TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  seen_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS online_players_seen ON online_players (seen_at);
CREATE TABLE IF NOT EXISTS online_rooms (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL,
  game TEXT NOT NULL,
  visibility TEXT NOT NULL,
  host_id TEXT NOT NULL,
  player_ids TEXT NOT NULL,
  state TEXT NOT NULL,
  body TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS online_rooms_lobby ON online_rooms (game, visibility, state, created_at);
CREATE TABLE IF NOT EXISTS online_invitations (
  id TEXT PRIMARY KEY NOT NULL,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS online_invitations_inbox ON online_invitations (to_id, status, expires_at);
