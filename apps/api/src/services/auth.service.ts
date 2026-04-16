import { prisma } from "../utils/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { ApiError, generateReferralCode } from "../utils/helpers.js";
import { sendWelcomeEmail, sendResetPasswordEmail } from "../utils/mail.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import type { GoogleUserInfo } from "../types/google.js";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const RESET_TOKEN_EXPIRY = "15m";

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

  const accessToken = generateAccessToken(result.id, result.email, result.role);
  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiredAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.refreshToken.upsert({
    where: { userId: result.id },
    update: { token: refreshToken, expiredAt },
    create: { token: refreshToken, expiredAt, userId: result.id },
  });

  // Fire-and-forget welcome email
  sendWelcomeEmail({
    email: result.email,
    name: result.name,
    role: result.role,
    referralCode: result.referralCode,
  });

  return { user: result, accessToken, refreshToken };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (!user) throw new ApiError(401, "Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) throw new ApiError(401, "Invalid email or password");

  const accessToken = generateAccessToken(user.id, user.email, user.role);

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiredAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.refreshToken.upsert({
    where: { userId: user.id },
    update: { token: refreshToken, expiredAt },
    create: { token: refreshToken, expiredAt, userId: user.id },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      referralCode: user.referralCode,
    },
    accessToken,
    refreshToken,
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

export async function updateProfile(
  userId: string,
  input: { name?: string; profileImage?: string },
  file?: Express.Multer.File,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  let profileImage = input.profileImage;

  // Kalau ada file upload, upload ke Cloudinary
  if (file) {
    // Hapus foto lama kalau ada
    if (user.profileImage) {
      try {
        await deleteImage(user.profileImage);
      } catch {
        // Ignore delete error — foto lama mungkin udah gak ada
      }
    }
    const { secure_url } = await uploadImage(file, "eventura/profiles");
    profileImage = secure_url;
  }

  return await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name && { name: input.name }),
      ...(profileImage !== undefined && { profileImage }),
    },
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
}

export async function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string },
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const valid = await bcrypt.compare(input.currentPassword, user.password);
  if (!valid) throw new ApiError(400, "Password lama salah");

  const hashed = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  return { message: "Password berhasil diubah" };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Selalu return success biar gak bisa enumerate email
  if (!user)
    return { message: "Jika email terdaftar, link reset sudah dikirim" };

  // Generate token
  const resetToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET_RESET!,
    { expiresIn: RESET_TOKEN_EXPIRY },
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
      resetTokenUsed: false,
    },
  });

  // Send email (fire-and-forget)
  sendResetPasswordEmail({
    email: user.email,
    name: user.name,
    resetToken,
  });

  return { message: "Jika email terdaftar, link reset sudah dikirim" };
}

export async function resetPassword(
  userId: string,
  newPassword: string,
  token: string,
) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
      resetTokenUsed: false,
    },
  });
  if (!user) throw new ApiError(400, "Token tidak valid atau sudah expired");

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetTokenUsed: true, // tandain udah dipake, token dibiarkan buat audit
    },
  });
  return { message: "Password berhasil direset. Silakan login." };
}

export async function getOrganizerPublicProfile(organizerId: string) {
  const user = await prisma.user.findUnique({
    where: { id: organizerId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      createdAt: true,
    },
  });
  if (!user) throw new ApiError(404, "Organizer not found");
  if (user.role !== "ORGANIZER")
    throw new ApiError(404, "User is not an organizer");

  // Count events
  const totalEvents = await prisma.event.count({ where: { organizerId } });

  // Review stats
  const reviewStats = await prisma.review.aggregate({
    where: { event: { organizerId } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  // Recent reviews
  const recentReviews = await prisma.review.findMany({
    where: { event: { organizerId } },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, profileImage: true } },
      event: { select: { id: true, name: true } },
    },
  });

  return {
    ...user,
    totalEvents,
    averageRating: reviewStats._avg.rating
      ? Math.round(reviewStats._avg.rating * 10) / 10
      : 0,
    totalReviews: reviewStats._count.rating,
    recentReviews,
  };
}

function generateAccessToken(
  userId: string,
  email: string,
  role: string,
): string {
  return jwt.sign({ userId, email, role }, process.env.JWT_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export async function refresh(refreshToken?: string) {
  if (!refreshToken) throw new ApiError(401, "No refresh token");

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: { select: { id: true, email: true, role: true } } },
  });

  if (!stored) throw new ApiError(401, "Refresh token not found");

  if (stored.expiredAt < new Date()) {
    // Hapus expired token
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new ApiError(401, "Refresh token expired");
  }

  const accessToken = generateAccessToken(
    stored.user.id,
    stored.user.email,
    stored.user.role,
  );

  return { accessToken };
}

export async function logout(refreshToken?: string) {
  if (!refreshToken) return { message: "Logout success" };

  try {
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });
  } catch {
    // Token mungkin udah gak ada — ignore
  }

  return { message: "Logout success" };
}

export async function googleLogin(accessToken: string) {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new ApiError(401, "Google token tidak valid");
  }

  const googleUser: GoogleUserInfo = await response.json();

  let user = await prisma.user.findUnique({
    where: { email: googleUser.email },
  });

  if (!user) {
    let referralCode: string;
    do {
      referralCode = generateReferralCode();
    } while (await prisma.user.findUnique({ where: { referralCode } }));

    user = await prisma.user.create({
      data: {
        name: googleUser.name,
        email: googleUser.email,
        password: "",
        profileImage: googleUser.picture,
        role: "CUSTOMER",
        provider: "GOOGLE",
        referralCode,
      },
    });
  }

  if (user.provider !== "GOOGLE") {
    throw new ApiError(
      400,
      "Email ini sudah terdaftar dengan email/password. Silakan login manual.",
    );
  }

  const token = generateToken(user.id, user.email, user.role);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      referralCode: user.referralCode,
      profileImage: user.profileImage,
    },
    token,
  };
}