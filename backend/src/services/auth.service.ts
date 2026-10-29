import { User, IUser } from '../models/user.model';
import { StudentProfile, IStudentProfile } from '../models/studentProfile.model';
import { AppError } from '../utils/appError';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../utils/jwt';
import { getMongoConnectionState } from '../config/database';
import { env } from '../config/env';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: 'student' | 'mentor' | 'placement_officer' | 'admin';
  institutionId?: string;
  profile?: {
    college?: string;
    university?: string;
    degree?: string;
    department?: string;
    graduationYear?: number;
    skills?: string[];
    targetRoles?: string[];
    bio?: string;
  };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RequestClientMeta {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    institutionId?: string;
    profileId?: string;
    createdAt: Date;
  };
  profile: IStudentProfile;
  tokens: AuthTokens;
  token: string; // Backward compatibility with initial frontend contract
}

export class AuthService {
  private checkDatabaseReady(): void {
    if (getMongoConnectionState() !== 'connected') {
      throw new AppError(
        'Database is not currently connected. Please ensure MongoDB is running and MONGODB_URI is configured.',
        503
      );
    }
  }

  public async register(input: RegisterInput, meta?: RequestClientMeta): Promise<AuthResponse> {
    this.checkDatabaseReady();

    const normalizedEmail = input.email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw AppError.conflict('An account with this email address already exists');
    }

    if (input.role === 'admin') {
      throw AppError.forbidden('Direct public registration for administrative accounts is prohibited.');
    }
    if (input.role === 'placement_officer') {
      throw AppError.forbidden('Direct public registration for administrative or placement officer accounts is prohibited.');
    }

    const assignedRole = input.role === 'mentor' ? 'mentor' : 'student';

    // 1. Create User
    const user = new User({
      name: input.name.trim(),
      email: normalizedEmail,
      password: input.password,
      role: assignedRole,
      status: 'active',
      lastLoginAt: new Date(),
    });

    // 2. Create StudentProfile
    const college = input.profile?.college || input.profile?.university || '';
    const degree = input.profile?.degree || '';
    const department = input.profile?.department || '';
    const graduationYear = input.profile?.graduationYear;
    const initialSkills = (input.profile?.skills || []).map((skillName) => ({
      name: skillName,
      category: 'languages' as const,
      proficiency: 'Intermediate' as const,
      verified: false,
    }));

    const studentProfile = new StudentProfile({
      user: user._id,
      fullName: input.name.trim(),
      email: normalizedEmail,
      headline: input.profile?.bio || '',
      college,
      degree,
      department,
      graduationYear,
      skills: initialSkills,
      careerInterests: {
        targetRoles: input.profile?.targetRoles || [],
        preferredLocations: [],
        preferredMode: 'Hybrid',
      },
    });

    await studentProfile.save();

    // Link profile to user
    user.profileId = studentProfile._id;

    // 3. Generate tokens with rotation tracking
    const accessToken = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      institutionId: user.institutionId?.toString(),
    });

    const { refreshToken, tokenId } = signRefreshToken(user._id.toString());
    const tokenHash = hashToken(refreshToken);

    // Refresh token expiry: 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    user.refreshTokens = [
      {
        tokenHash,
        tokenId,
        expiresAt,
        createdAt: new Date(),
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
      },
    ];

    await user.save();

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId?.toString(),
        profileId: studentProfile._id.toString(),
        createdAt: user.createdAt,
      },
      profile: studentProfile,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: env.JWT_EXPIRES_IN,
      },
      token: accessToken,
    };
  }

  public async login(input: LoginInput, meta?: RequestClientMeta): Promise<AuthResponse> {
    this.checkDatabaseReady();

    const normalizedEmail = input.email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password +refreshTokens');

    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password');
    }

    if (user.status === 'suspended') {
      throw AppError.forbidden('Your account has been suspended. Please contact platform administrators.');
    }

    user.lastLoginAt = new Date();

    // Find or create profile if absent
    let profile = await StudentProfile.findOne({ user: user._id });
    if (!profile) {
      profile = await StudentProfile.create({
        user: user._id,
        fullName: user.name,
        email: user.email,
      });
      user.profileId = profile._id;
    }

    // Generate token pair
    const accessToken = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      institutionId: user.institutionId?.toString(),
    });

    const { refreshToken, tokenId } = signRefreshToken(user._id.toString());
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Remove expired tokens and cap concurrent tokens to 5
    const now = new Date();
    const validTokens = (user.refreshTokens || []).filter((t) => t.expiresAt > now);

    validTokens.push({
      tokenHash,
      tokenId,
      expiresAt,
      createdAt: now,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    });

    // Keep last 5 sessions
    user.refreshTokens = validTokens.slice(-5);
    await user.save();

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId?.toString(),
        profileId: profile._id.toString(),
        createdAt: user.createdAt,
      },
      profile,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: env.JWT_EXPIRES_IN,
      },
      token: accessToken,
    };
  }

  public async refreshToken(
    oldRefreshToken: string,
    meta?: RequestClientMeta
  ): Promise<AuthTokens> {
    this.checkDatabaseReady();

    if (!oldRefreshToken) {
      throw AppError.unauthorized('Refresh token is required');
    }

    const decoded = verifyRefreshToken(oldRefreshToken);
    const oldHash = hashToken(oldRefreshToken);

    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user) {
      throw AppError.unauthorized('User not found');
    }

    const existingTokenIndex = user.refreshTokens.findIndex(
      (t) => t.tokenHash === oldHash && t.tokenId === decoded.tokenId
    );

    // If token wasn't found in DB, token reuse/theft is suspected
    if (existingTokenIndex === -1) {
      // Revoke all tokens for this user for security
      user.refreshTokens = [];
      await user.save();
      throw AppError.unauthorized('Invalid or revoked refresh token. Please sign in again.');
    }

    // Consume old refresh token (Token Rotation)
    user.refreshTokens.splice(existingTokenIndex, 1);

    // Issue new pair
    const newAccessToken = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const { refreshToken: newRefreshToken, tokenId } = signRefreshToken(user._id.toString());
    const newHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Filter out expired
    const now = new Date();
    user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt > now);

    user.refreshTokens.push({
      tokenHash: newHash,
      tokenId,
      expiresAt,
      createdAt: now,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    });

    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  public async logout(userId: string, refreshTokenToRevoke?: string): Promise<void> {
    this.checkDatabaseReady();

    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) return;

    if (refreshTokenToRevoke) {
      const hash = hashToken(refreshTokenToRevoke);
      user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== hash);
    } else {
      // Clear all active sessions for this user
      user.refreshTokens = [];
    }

    await user.save();
  }

  public async getProfile(userId: string): Promise<{ user: IUser; profile: IStudentProfile }> {
    this.checkDatabaseReady();

    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    let profile = await StudentProfile.findOne({ user: user._id });
    if (!profile) {
      profile = await StudentProfile.create({
        user: user._id,
        fullName: user.name,
        email: user.email,
      });
      user.profileId = profile._id;
      await user.save();
    }

    return { user, profile };
  }
}

export const authService = new AuthService();
