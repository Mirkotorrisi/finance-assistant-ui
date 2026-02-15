import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from './db/client'

// Check if auth is configured
const isAuthConfigured = Boolean(process.env.AUTH_SECRET)

// Warn if auth is not configured
if (!isAuthConfigured) {
  console.warn('AUTH_SECRET not configured. Authentication features will be disabled.')
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: isAuthConfigured ? DrizzleAdapter(db) : undefined,
  providers: [
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? [GitHub({
          clientId: process.env.AUTH_GITHUB_ID,
          clientSecret: process.env.AUTH_GITHUB_SECRET
        })]
      : []),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET
        })]
      : [])
  ],
  pages: {
    signIn: '/login'
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    }
  }
})
