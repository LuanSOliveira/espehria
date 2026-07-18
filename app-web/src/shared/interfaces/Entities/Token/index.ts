export interface IJwtToken {
  sub: string;
  role: string[];
  iss: string;
  exp: number;
  iat: number;
}
