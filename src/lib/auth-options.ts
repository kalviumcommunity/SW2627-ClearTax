import bcrypt from "bcrypt";
import type { AuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getAuthSecret } from "@/lib/auth-env";
import { getPrismaClient } from "@/lib/prisma";
import { OWNER_ROLE, type AuthContext } from "@/lib/auth-context";
import { loginSchema } from "@/lib/validation/auth";

const INVALID_CREDENTIALS_HASH =
  "$2b$12$f3j8MVOgXMW/kkJzK.KeT.dv3QwY6fbz1tNAeb5Ts/85t2IBP3ZwK";

type AuthorizedUser = User & AuthContext;

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email and password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const validationResult = loginSchema
          .omit({
            next: true,
          })
          .safeParse(credentials);

        if (!validationResult.success) {
          return null;
        }

        const { email, password } = validationResult.data;
        const prisma = getPrismaClient();

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            businesses: {
              orderBy: {
                createdAt: "asc",
              },
              select: {
                id: true,
              },
              take: 1,
            },
          },
        });

        const passwordHash = user?.passwordHash ?? INVALID_CREDENTIALS_HASH;
        const validPassword = await bcrypt.compare(password, passwordHash);
        const businessId = user?.businesses[0]?.id;

        if (!user || !user.passwordHash || !validPassword || !businessId) {
          return null;
        }

        return {
          id: user.id,
          userId: user.id,
          email: user.email,
          name: user.name,
          businessId,
          role: OWNER_ROLE,
        } satisfies AuthorizedUser;
      },
    }),
    ...getGoogleProvider(),
  ],
  secret: getAuthSecret(),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return true;
      }

      if (!user.email) {
        return false;
      }

      return (await getAuthContextByEmail(user.email)) !== null;
    },
    async jwt({ token, user }) {
      if (!user) {
        return token;
      }

      const userWithContext = user as Partial<AuthContext> & User;
      const authContext =
        userWithContext.userId &&
        userWithContext.email &&
        userWithContext.businessId &&
        userWithContext.role
          ? {
              userId: userWithContext.userId,
              email: userWithContext.email,
              name: userWithContext.name ?? null,
              businessId: userWithContext.businessId,
              role: userWithContext.role,
            }
          : user.email
            ? await getAuthContextByEmail(user.email)
            : null;

      if (!authContext) {
        return token;
      }

      token.userId = authContext.userId;
      token.email = authContext.email;
      token.name = authContext.name;
      token.businessId = authContext.businessId;
      token.role = authContext.role;

      return token;
    },
    async session({ session, token }) {
      if (
        session.user &&
        token.userId &&
        token.email &&
        token.businessId &&
        token.role
      ) {
        session.user.id = token.userId;
        session.user.email = token.email;
        session.user.name = token.name ?? null;
        session.user.businessId = token.businessId;
        session.user.role = token.role;
      }

      return session;
    },
  },
};

async function getAuthContextByEmail(email: string) {
  const prisma = getPrismaClient();
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      email: true,
      name: true,
      businesses: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  const businessId = user?.businesses[0]?.id;

  if (!user || !businessId) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    businessId,
    role: OWNER_ROLE,
  } satisfies AuthContext;
}

function getGoogleProvider() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return [];
  }

  return [
    GoogleProvider({
      clientId,
      clientSecret,
    }),
  ];
}
