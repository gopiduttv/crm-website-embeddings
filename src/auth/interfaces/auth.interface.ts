export interface PracticeTokenPayload {
  practiceId: string;
  practiceName: string;
  domain: string;
  apiKey: string;
  permissions: string[];
  plan: string;
  isActive: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
