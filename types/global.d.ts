interface UserConfig {
  username: string;
}

interface ServerConfig {
  host: string;
  version: string;
  auth: 'microsoft' | 'offline' | 'mojang';
  port?: number;
}

interface AccountConfig {
  Users: Record<string, UserConfig>;
  Servers: Record<string, ServerConfig>;
}