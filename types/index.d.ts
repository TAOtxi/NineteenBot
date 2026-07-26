interface UserConfig {
  Users: Record<string, {
    account: string;
  }>,

  Servers: Record<string, {
    host?: string,
    port?: number,
    version: string,
    auth?: 'microsoft' | 'mojang' | 'offline'
  }>,

  Admin: string[],
  mainAccount: string,
  autoAcceptTpaList: string[],
}