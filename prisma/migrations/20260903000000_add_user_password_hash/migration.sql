-- Add password hash storage for credentials-based demo authentication.
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
