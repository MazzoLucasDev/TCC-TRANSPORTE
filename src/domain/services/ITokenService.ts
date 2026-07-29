export interface ITokenService {
  generate(payload: { userId: string; userType: string }): string;
  verify(token: string): { userId: string; userType: string } | null;
}
