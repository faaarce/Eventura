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

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ApiError(400, "Email already registered");

    const hashedPassword = await bcrypt.hash(input.password, 10);

    let referralCode: string;
    do {
      referralCode = generateReferralCode();
    } while (await prisma.user.findUnique({ where: { referralCode } }));

    let referredById: number | undefined;

    // If referral code provided, validate and reward
    if (input.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: input.referralCode },
      });
      if (!referrer) throw new ApiError(400, "Invalid referral code");
      referredById = referrer.id;

      // Give referrer 10,000 points (expires in 3 months)
      await prisma.point.create({
        data: {
          userId: referrer.id,
          amount: 10000,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: input.role,
        referralCode,
        referredById,
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

    // If registered with referral, give new user 10,000 points too
    if (referredById) {
      await prisma.point.create({
        data: {
          userId: user.id,
          amount: 10000,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return { user, token };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new ApiError(401, "Invalid email or password");

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) throw new ApiError(401, "Invalid email or password");

    const token = this.generateToken(user.id, user.email, user.role);

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

  async getProfile(userId: number) {
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

    // Get available points
    const points = await prisma.point.findMany({
      where: {
        userId,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });
    const totalPoints = points.reduce((sum, p) => sum + p.amount, 0);

    return { ...user, totalPoints };
  }

  private generateToken(userId: number, email: string, role: string): string {
    return jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );
  }
}