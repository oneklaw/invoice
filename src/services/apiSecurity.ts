import { ApiCredential, OAuthToken } from '../types';

class ApiSecurityService {
  private rateLimitWindowSeconds = 60;
  private tokensRemaining = 60;
  private maxTokens = 60;
  private lastRefillTimestamp = Date.now();

  constructor() {
    // Start continuous token refill ticker
    setInterval(() => {
      this.refillTokens();
    }, 1000);
  }

  private refillTokens() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;
    const refillRate = this.maxTokens / this.rateLimitWindowSeconds; // 1 token per second
    const tokensToAdd = elapsedSeconds * refillRate;

    if (tokensToAdd >= 1) {
      this.tokensRemaining = Math.min(this.maxTokens, this.tokensRemaining + Math.floor(tokensToAdd));
      this.lastRefillTimestamp = now;
    }
  }

  public getRateLimitStatus(): {
    limit: number;
    remaining: number;
    resetSeconds: number;
    percentage: number;
  } {
    this.refillTokens();
    const resetSeconds = Math.max(0, Math.ceil(this.rateLimitWindowSeconds - ((Date.now() - this.lastRefillTimestamp) / 1000)));
    return {
      limit: this.maxTokens,
      remaining: this.tokensRemaining,
      resetSeconds,
      percentage: Math.round((this.tokensRemaining / this.maxTokens) * 100),
    };
  }

  public consumeToken(): {
    allowed: boolean;
    remaining: number;
    resetSeconds: number;
    headers: Record<string, string>;
  } {
    this.refillTokens();
    const resetSeconds = Math.max(0, Math.ceil(this.rateLimitWindowSeconds - ((Date.now() - this.lastRefillTimestamp) / 1000)));

    if (this.tokensRemaining > 0) {
      this.tokensRemaining -= 1;
      return {
        allowed: true,
        remaining: this.tokensRemaining,
        resetSeconds,
        headers: {
          'X-RateLimit-Limit': String(this.maxTokens),
          'X-RateLimit-Remaining': String(this.tokensRemaining),
          'X-RateLimit-Reset': String(resetSeconds),
          'Content-Type': 'application/json',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'X-Content-Type-Options': 'nosniff',
        },
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
      headers: {
        'X-RateLimit-Limit': String(this.maxTokens),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(resetSeconds),
        'Retry-After': String(resetSeconds),
        'Content-Type': 'application/json',
      },
    };
  }

  public generateOAuthToken(clientId: string, scopes: string[]): OAuthToken {
    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return {
      accessToken: `kero_live_${randomHex}`,
      tokenType: 'Bearer',
      expiresIn: 3600, // 1 hour
      scope: scopes.join(' '),
      createdAt: Date.now(),
    };
  }

  public createNewCredential(name: string, scopes: string[], orgId: string): ApiCredential {
    const id = 'key_' + Math.random().toString(36).substring(2, 9);
    const clientId = 'ivx_client_' + Math.random().toString(36).substring(2, 12);
    const clientSecretMasked = 'ivx_sec_' + '•'.repeat(24) + Math.random().toString(36).substring(2, 6);

    return {
      id,
      organizationId: orgId,
      name,
      clientId,
      clientSecretMasked,
      scopes,
      rateLimitPerMinute: 60,
      createdAt: new Date().toISOString(),
    };
  }
}

export const apiSecurityService = new ApiSecurityService();
