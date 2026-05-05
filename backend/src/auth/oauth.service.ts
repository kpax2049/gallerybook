import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthProvider } from '@prisma/client';
import * as argon from 'argon2';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

type OAuthConfig = {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
};

type OAuthIdentity = {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  fullName?: string;
  avatarUrl?: string;
};

type AuthenticatedOAuthUser = {
  id: number;
  email: string;
  tokenVersion: number;
};

@Injectable()
export class OAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  getAuthorizationUrl(provider: OAuthProvider, state: string) {
    const providerConfig = this.getProviderConfig(provider);

    if (provider === OAuthProvider.GOOGLE) {
      const params = new URLSearchParams({
        client_id: providerConfig.clientId,
        redirect_uri: providerConfig.callbackUrl,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        access_type: 'offline',
        prompt: 'select_account',
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: providerConfig.callbackUrl,
      scope: 'read:user user:email',
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async authenticate(
    provider: OAuthProvider,
    code: string,
  ): Promise<AuthenticatedOAuthUser> {
    if (!code) {
      throw new BadRequestException('Missing OAuth authorization code.');
    }

    const identity =
      provider === OAuthProvider.GOOGLE
        ? await this.getGoogleIdentity(code)
        : await this.getGithubIdentity(code);

    if (!identity.email || !identity.emailVerified) {
      throw new BadRequestException(
        'OAuth provider did not return a verified email address.',
      );
    }

    return this.findOrCreateUser(identity);
  }

  private async findOrCreateUser(
    identity: OAuthIdentity,
  ): Promise<AuthenticatedOAuthUser> {
    const email = identity.email.trim().toLowerCase();
    const linkedAccount = await this.prisma.oauthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: identity.provider,
          providerAccountId: identity.providerAccountId,
        },
      },
      select: {
        user: {
          select: { id: true, email: true, tokenVersion: true },
        },
      },
    });

    if (linkedAccount?.user) {
      return linkedAccount.user;
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, email: true, tokenVersion: true },
    });

    if (existingUser) {
      await this.prisma.oauthAccount.create({
        data: {
          provider: identity.provider,
          providerAccountId: identity.providerAccountId,
          email,
          userId: existingUser.id,
        },
      });
      await this.updateMissingAvatar(existingUser.id, identity.avatarUrl);
      return existingUser;
    }

    const username = await this.createUniqueUsername(
      identity.fullName ?? identity.email,
      email,
    );
    const hash = await argon.hash(
      `oauth:${identity.provider}:${identity.providerAccountId}:${randomBytes(32).toString('hex')}`,
    );

    const user = await this.prisma.user.create({
      data: {
        email,
        hash,
        fullName: identity.fullName,
        username,
        profile: {
          create: {
            avatarUrl: identity.avatarUrl ?? null,
          },
        },
        oauthAccounts: {
          create: {
            provider: identity.provider,
            providerAccountId: identity.providerAccountId,
            email,
          },
        },
      },
      select: { id: true, email: true, tokenVersion: true },
    });

    return user;
  }

  private async updateMissingAvatar(userId: number, avatarUrl?: string) {
    if (!avatarUrl) return;

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { avatarUrl: true },
    });

    if (profile?.avatarUrl) return;

    await this.prisma.profile.upsert({
      where: { userId },
      create: { userId, avatarUrl },
      update: {
        avatarUrl: {
          set: avatarUrl,
        },
      },
    });
  }

  private async createUniqueUsername(nameOrEmail: string, email: string) {
    const emailLocalPart = email.split('@')[0];
    const base =
      this.slugifyUsername(emailLocalPart) ||
      this.slugifyUsername(nameOrEmail) ||
      'user';

    for (let i = 0; i < 50; i += 1) {
      const suffix = i === 0 ? '' : String(i + 1);
      const username = `${base}${suffix}`;
      const existing = await this.prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });

      if (!existing) return username;
    }

    return `${base}${randomBytes(4).toString('hex')}`;
  }

  private slugifyUsername(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 32);
  }

  private async getGoogleIdentity(code: string): Promise<OAuthIdentity> {
    const providerConfig = this.getProviderConfig(OAuthProvider.GOOGLE);
    const token = await this.exchangeToken(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: providerConfig.clientId,
        client_secret: providerConfig.clientSecret,
        redirect_uri: providerConfig.callbackUrl,
        grant_type: 'authorization_code',
      },
    );

    const userInfo = await this.fetchJson<{
      sub: string;
      email: string;
      email_verified: boolean;
      name?: string;
      picture?: string;
    }>('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    return {
      provider: OAuthProvider.GOOGLE,
      providerAccountId: userInfo.sub,
      email: userInfo.email,
      emailVerified: userInfo.email_verified,
      fullName: userInfo.name,
      avatarUrl: userInfo.picture,
    };
  }

  private async getGithubIdentity(code: string): Promise<OAuthIdentity> {
    const providerConfig = this.getProviderConfig(OAuthProvider.GITHUB);
    const token = await this.exchangeToken(
      'https://github.com/login/oauth/access_token',
      {
        code,
        client_id: providerConfig.clientId,
        client_secret: providerConfig.clientSecret,
        redirect_uri: providerConfig.callbackUrl,
      },
    );

    const [profile, emails] = await Promise.all([
      this.fetchJson<{
        id: number;
        name?: string;
        login: string;
        email?: string;
        avatar_url?: string;
      }>('https://api.github.com/user', {
        headers: this.githubHeaders(token.access_token),
      }),
      this.fetchJson<
        Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>
      >('https://api.github.com/user/emails', {
        headers: this.githubHeaders(token.access_token),
      }),
    ]);

    const primaryEmail =
      emails.find((email) => email.primary && email.verified) ??
      emails.find((email) => email.verified);

    return {
      provider: OAuthProvider.GITHUB,
      providerAccountId: String(profile.id),
      email: primaryEmail?.email ?? profile.email,
      emailVerified: Boolean(primaryEmail?.verified),
      fullName: profile.name ?? profile.login,
      avatarUrl: profile.avatar_url,
    };
  }

  private async exchangeToken(
    url: string,
    body: Record<string, string>,
  ): Promise<{ access_token: string }> {
    const token = await this.fetchJson<{ access_token?: string }>(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body).toString(),
    });

    if (!token.access_token) {
      throw new BadRequestException('OAuth provider did not return a token.');
    }

    return { access_token: token.access_token };
  }

  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);

    if (!response.ok) {
      throw new BadRequestException('OAuth provider request failed.');
    }

    return (await response.json()) as T;
  }

  private githubHeaders(accessToken: string) {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'gallerybook',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  private getProviderConfig(provider: OAuthProvider): OAuthConfig {
    const prefix = provider === OAuthProvider.GOOGLE ? 'GOOGLE' : 'GITHUB';
    const providerPath = provider.toLowerCase();
    const backendUrl =
      this.config.get<string>('BACKEND_URL') ?? 'http://localhost:3333';
    const clientId = this.config.get<string>(`${prefix}_OAUTH_CLIENT_ID`);
    const clientSecret = this.config.get<string>(
      `${prefix}_OAUTH_CLIENT_SECRET`,
    );
    const callbackUrl =
      this.config.get<string>(`${prefix}_OAUTH_CALLBACK_URL`) ??
      `${backendUrl}/auth/oauth/${providerPath}/callback`;

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        `${prefix}_OAUTH_CLIENT_ID and ${prefix}_OAUTH_CLIENT_SECRET must be configured.`,
      );
    }

    return { clientId, clientSecret, callbackUrl };
  }
}
