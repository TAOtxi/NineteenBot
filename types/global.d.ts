interface UserConfig {
  username: string;
}

interface ServerConfig {
  host: string;
  version: string;
  auth?: 'microsoft' | 'offline' | 'mojang'; // default microsoft
  port?: number;                             // default 25565
}

interface AccountConfig {
  Users: Record<string, UserConfig>;
  Servers: Record<string, ServerConfig>;
}