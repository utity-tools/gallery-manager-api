import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import prisma from "../db/prisma";
import { createError, ERRORS } from "../errors/AppErrors";
import { UserDTO } from "../dtos/UserDTO";
import { LoginInput, SignUpInput } from "../schemas/auth";
import { LoginResponse, SignupResponse } from "../types";

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function validatePassword(
  hash: string,
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(
  userId: string,
  email: string,
  slug: string,
): string {
  if (!JWT_SECRET) {
    throw createError(ERRORS.INTERNAL_ERROR, {
      message: "JWT_SECRET is not configured",
    });
  }

  return jwt.sign({ id: userId, email, slug }, JWT_SECRET, {
    expiresIn: "24h",
  });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "user";
  let slug = base;

  while (await prisma.user.findUnique({ where: { slug } })) {
    slug = `${base}-${randomBytes(3).toString("hex")}`;
  }

  return slug;
}

export async function signUp(input: SignUpInput): Promise<SignupResponse> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw createError(ERRORS.USER_EXISTS, {
      message: "A user with this email already exists",
    });
  }

  const name = input.name || input.email.split("@")[0];
  const passwordHash = await hashPassword(input.password);
  const slug = await generateUniqueSlug(name);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name,
      slug,
      type: input.type ?? "individual",
    },
  });

  const gallery = await prisma.gallery.create({
    data: {
      userId: user.id,
      title: name,
      description: "",
    },
  });

  return {
    user: new UserDTO(user),
    gallery: { id: gallery.id, title: gallery.title },
  };
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { galleries: true },
  });

  if (!user || !user.passwordHash) {
    throw createError(ERRORS.INVALID_CREDENTIALS);
  }

  const isValid = await validatePassword(user.passwordHash, input.password);
  if (!isValid) {
    throw createError(ERRORS.INVALID_CREDENTIALS);
  }

  const gallery = user.galleries[0];
  if (!gallery) {
    throw createError(ERRORS.INTERNAL_ERROR, {
      message: "No gallery found for user",
    });
  }

  const accessToken = generateToken(user.id, user.email, user.slug);

  return {
    user: new UserDTO(user),
    gallery: { id: gallery.id, title: gallery.title },
    accessToken,
  };
}
