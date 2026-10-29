import { Request, Response, NextFunction } from 'express';
import { profileService } from '../services/profile.service';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.getProfile(req.user.userId);
    sendSuccess(res, { profile }, 'Profile retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.updateProfile(req.user.userId, req.body);
    sendSuccess(res, { profile }, 'Profile updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

// Skills
export const addSkill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.addSkill(req.user.userId, req.body);
    sendSuccess(res, { profile, skills: profile.skills }, 'Skill added successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateSkill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.updateSkill(req.user.userId, req.params.id, req.body);
    sendSuccess(res, { profile, skills: profile.skills }, 'Skill updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const removeSkill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.removeSkill(req.user.userId, req.params.id);
    sendSuccess(res, { profile, skills: profile.skills }, 'Skill removed successfully', 200);
  } catch (error) {
    next(error);
  }
};

// Projects
export const addProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.addProject(req.user.userId, req.body);
    sendSuccess(res, { profile, projects: profile.projects }, 'Project added successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.updateProject(req.user.userId, req.params.id, req.body);
    sendSuccess(res, { profile, projects: profile.projects }, 'Project updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const removeProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.removeProject(req.user.userId, req.params.id);
    sendSuccess(res, { profile, projects: profile.projects }, 'Project removed successfully', 200);
  } catch (error) {
    next(error);
  }
};

// Certifications
export const addCertification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.addCertification(req.user.userId, req.body);
    sendSuccess(
      res,
      { profile, certifications: profile.certifications },
      'Certification added successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const updateCertification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.updateCertification(req.user.userId, req.params.id, req.body);
    sendSuccess(
      res,
      { profile, certifications: profile.certifications },
      'Certification updated successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

export const removeCertification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.removeCertification(req.user.userId, req.params.id);
    sendSuccess(
      res,
      { profile, certifications: profile.certifications },
      'Certification removed successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

// Education
export const addEducation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.addEducation(req.user.userId, req.body);
    sendSuccess(
      res,
      { profile, educationHistory: profile.educationHistory },
      'Education entry added successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const updateEducation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.updateEducation(req.user.userId, req.params.id, req.body);
    sendSuccess(
      res,
      { profile, educationHistory: profile.educationHistory },
      'Education entry updated successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

export const removeEducation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.removeEducation(req.user.userId, req.params.id);
    sendSuccess(
      res,
      { profile, educationHistory: profile.educationHistory },
      'Education entry removed successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

// Experience
export const addExperience = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.addExperience(req.user.userId, req.body);
    sendSuccess(res, { profile, experience: profile.experience }, 'Experience entry added successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateExperience = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.updateExperience(req.user.userId, req.params.id, req.body);
    sendSuccess(res, { profile, experience: profile.experience }, 'Experience entry updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const removeExperience = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(AppError.unauthorized());
    const profile = await profileService.removeExperience(req.user.userId, req.params.id);
    sendSuccess(res, { profile, experience: profile.experience }, 'Experience entry removed successfully', 200);
  } catch (error) {
    next(error);
  }
};

