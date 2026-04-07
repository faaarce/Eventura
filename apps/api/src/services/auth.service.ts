import { prisma } from "../utils/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ApiError, generateReferralCode } from "../utils/helpers.js";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: "CUSTOMER" | "ORGANIZER";
  referralCode?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

function generateToken(userId: string, email: string, role: string): string {
  return jwt.sign({ userId, email, role }, process.env.JWT_SECRET!, {
    expiresIn: "24h",
  });
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) throw new ApiError(400, "Email already registered");

  const hashedPassword = await bcrypt.hash(input.password, 10);

  let referralCode: string;
  do {
    referralCode = generateReferralCode();
  } while (await prisma.user.findUnique({ where: { referralCode } }));

  let referrer: { id: string } | null = null;
  if (input.referralCode) {
    referrer = await prisma.user.findUnique({
      where: { referralCode: input.referralCode },
      select: { id: true },
    });
    if (!referrer) throw new ApiError(400, "Invalid referral code");
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: input.role,
        referralCode,
        referredById: referrer?.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        referralCode: true,
        createdAt: true,
      },
    });

    if (referrer) {
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

      await tx.point.create({
        data: {
          userId: referrer.id,
          amount: 10000,
          expiresAt: threeMonthsLater,
        },
      });

      await tx.coupon.create({
        data: {
          code: `REF-${generateReferralCode()}`,
          discountAmount: 50000,
          userId: user.id,
          expiresAt: threeMonthsLater,
        },
      });
    }

    return user;
  });

  const token = generateToken(result.id, result.email, result.role);
  return { user: result, token };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (!user) throw new ApiError(401, "Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) throw new ApiError(401, "Invalid email or password");

  const token = generateToken(user.id, user.email, user.role);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      referralCode: user.referralCode,
    },
    token,
  };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      referralCode: true,
      profileImage: true,
      createdAt: true,
    },
  });
  if (!user) throw new ApiError(404, "User not found");

  const points = await prisma.point.findMany({
    where: { userId, isUsed: false, expiresAt: { gt: new Date() } },
  });
  const totalPoints = points.reduce((sum, p) => sum + p.amount, 0);

  const coupons = await prisma.coupon.findMany({
    where: { userId, isUsed: false, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      code: true,
      discountAmount: true,
      expiresAt: true,
    },
  });

  return { ...user, totalPoints, coupons };
}