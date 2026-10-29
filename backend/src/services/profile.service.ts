import {
  StudentProfile,
  IStudentProfile,
  ISkillEntry,
  IProjectEntry,
  ICertificationEntry,
  IEducationEntry,
  IExperienceEntry,
  ICareerInterests,
} from '../models/studentProfile.model';
import { User } from '../models/user.model';
import { AppError } from '../utils/appError';
import { getMongoConnectionState } from '../config/database';

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  location?: string;
  headline?: string;
  bio?: string;
  college?: string;
  degree?: string;
  department?: string;
  graduationYear?: number;
  careerInterests?: Partial<ICareerInterests>;
}

export class ProfileService {
  private checkDatabaseReady(): void {
    if (getMongoConnectionState() !== 'connected') {
      throw new AppError(
        'Database is not currently connected. Please ensure MongoDB is running and MONGODB_URI is configured.',
        503
      );
    }
  }

  private async getOrCreateProfile(userId: string): Promise<IStudentProfile> {
    this.checkDatabaseReady();

    let profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      const user = await User.findById(userId);
      if (!user) {
        throw AppError.notFound('User account not found');
      }

      profile = new StudentProfile({
        user: user._id,
        fullName: user.name,
        email: user.email,
      });
      await profile.save();

      user.profileId = profile._id;
      await user.save();
    }
    return profile;
  }

  public async getProfile(userId: string): Promise<IStudentProfile> {
    return this.getOrCreateProfile(userId);
  }

  public async updateProfile(userId: string, data: UpdateProfileInput): Promise<IStudentProfile> {
    const profile = await this.getOrCreateProfile(userId);

    if (data.fullName !== undefined) profile.fullName = data.fullName.trim();
    if (data.phone !== undefined) profile.phone = data.phone.trim();
    if (data.location !== undefined) profile.location = data.location.trim();
    if (data.headline !== undefined) profile.headline = data.headline.trim();
    if (data.bio !== undefined) profile.headline = data.bio.trim(); // Map bio to headline if provided
    if (data.college !== undefined) profile.college = data.college.trim();
    if (data.degree !== undefined) profile.degree = data.degree.trim();
    if (data.department !== undefined) profile.department = data.department.trim();
    if (data.graduationYear !== undefined) profile.graduationYear = data.graduationYear;

    if (data.careerInterests) {
      profile.careerInterests = {
        targetRoles: data.careerInterests.targetRoles ?? profile.careerInterests?.targetRoles ?? [],
        preferredLocations:
          data.careerInterests.preferredLocations ?? profile.careerInterests?.preferredLocations ?? [],
        preferredMode:
          data.careerInterests.preferredMode ?? profile.careerInterests?.preferredMode ?? 'Hybrid',
        careerGoals: data.careerInterests.careerGoals ?? profile.careerInterests?.careerGoals,
        targetCompensation:
          data.careerInterests.targetCompensation ?? profile.careerInterests?.targetCompensation,
      };
    }

    await profile.save();
    return profile;
  }

  // --- Skills ---
  public async addSkill(userId: string, skill: ISkillEntry): Promise<IStudentProfile> {
    const profile = await this.getOrCreateProfile(userId);

    // Prevent duplicate skill names (case-insensitive)
    const exists = profile.skills.some(
      (s) => s.name.toLowerCase() === skill.name.trim().toLowerCase()
    );
    if (exists) {
      throw AppError.conflict(`Skill '${skill.name}' is already in your profile`);
    }

    profile.skills.push({
      name: skill.name.trim(),
      category: skill.category,
      proficiency: skill.proficiency,
      verified: skill.verified ?? false,
    } as ISkillEntry);

    await profile.save();
    return profile;
  }

  public async updateSkill(
    userId: string,
    skillId: string,
    update: Partial<ISkillEntry>
  ): Promise<IStudentProfile> {
    const profile = await this.getOrCreateProfile(userId);
    const subdoc = profile.skills.id(skillId);

    if (!subdoc) {
      throw AppError.notFound('Skill not found in your profile');
    }

    if (update.name !== undefined) subdoc.name = update.name.trim();
    if (update.category !== undefined) subdoc.category = update.category;
    if (update.proficiency !== undefined) subdoc.proficiency = update.proficiency;
    if (update.verified !== undefined) subdoc.verified = update.verified;

    await profile.save();
    return profile;
  }

  public async removeSkill(userId: string, skillId: string): Promise<IStudentProfile> {
    const profile = await this.getOrCreateProfile(userId);
    const subdoc = profile.skills.id(skillId);

    if (!subdoc) {
      throw AppError.notFound('Skill not found in your profile');
    }

    subdoc.deleteOne();
    await profile.save();
    return profile;
  }

  // --- Projects ---
  public async addProject(userId: string, project: IProjectEntry): Promise<IStudentProfile> {
    const profile = await this.getOrCreateProfile(userId);

    profile.projects.push({
      title: project.title.trim(),
      technologies: project.technologies || [],
      link: project.link?.trim(),
      bullets: project.bullets || [],
    } as IProjectEntry);

    await profile.save();
    return profile;
  }

  public async updateProject(
    userId: string,
    projectId: string,
    update: Partial<IProjectEntry>
  ): Promise<IStudentProfile> {
    const profile = await this.getOrCreateProfile(userId);
    const subdoc = profile.projects.id(projectId);

    if (!subdoc) {
      throw AppError.notFound('Project not found in your profile');
    }

    if (update.title !== undefined) subdoc.title = update.title.trim();
    if (update.technologies !== undefined) subdoc.technologies = update.technologies;
    if (update.link !== undefined) subdoc.link = update.link.trim();
    if (update.bullets !== undefined) subdoc.bullets = update.bullets;

    await profile.save();
    return profile;
  }

  public async removeProject(userId: string, projectId: string): Promise<IStudentProfile> {
    const profile = await this.getOrCreateProfile(userId);
    const subdoc = profile.projects.id(projectId);

    if (!subdoc) {
      throw AppError.notFound('Project not found in your profile');
    }

    subdoc.deleteOne();
    await profile.save();
    return profile;
  }

  // --- Certifications ---
  public async addCertification(
    userId: string,
    cert: ICertificationEntry
  ): Promise<IStudentProfile> {
    const profile = await this.getOrCreateProfile(userId);

    profile.certifications.push({
      title: cert.title.trim(),
      issuer: cert.issuer.trim(),
      issueDate: cert.issueDate.trim(),
      credentialUrl: cert.credentialUrl?.trim(),
    } as ICertificationEntry);

    await profile.save();
    return profile;
  }

  public async updateCertification(
    userId: string,
    certId: string,
    update: Partial<ICertificationEntry>
  ): Promise<IStudentProfile> {
    const profile = await this.getOrCreateProfile(userId);
    const subdoc = profile.certifications.id(certId);

    if (!subdoc) {
      throw AppError.notFound('Certification not found in your profile');
    }

    if (update.title !== undefined) subdoc.title = update.title.trim();
    if (update.issuer !== undefined) subdoc.issuer = update.issuer.trim();
    if (update.issueDate !== undefined) subdoc.issueDate = update.issueDate.trim();
    if (update.credentialUrl !== undefined) subdoc.credentialUrl = update.credentialUrl.trim();

    await profile.save();
    return profile;
  }

  public async removeCertification(userId: string, certId: string): Promise<IStudentProfile> {
    const profile = await this.getOrCreateProfile(userId);
    const subdoc = profile.certifications.id(certId);

    if (!subdoc) {
      throw AppError.notFound('Certification not found in your profile');
    }

    subdoc.deleteOne();
    await profile.save();
    return profile;
  }

  // --- Education ---
  public async addEducation(userId: string, edu: IEducationEntry): Promise<IStudentProfile> {
    const profile = await this.getOrCreateProfile(userId);

    profile.educationHistory.push({
      institution: edu.institution.trim(),
      degree: edu.degree.trim(),
      field: edu.field.trim(),
      startDate: edu.startDate.trim(),
      endDate: edu.endDate.trim(),
      gpa: edu.gpa?.trim(),
    } as IEducationEntry);

    await profile.save();
    return profile;
  }

  public async updateEducation(
    userId: string,
    eduId: string,
    update: Partial<IEducationEntry>
  ): Promise<IStudentProfile> {
    const profile = await this.getOrCreateProfile(userId);
    const subdoc = profile.educationHistory.id(eduId);

    if (!subdoc) {
      throw AppError.notFound('Education entry not found in your profile');
    }

    if (update.institution !== undefined) subdoc.institution = update.institution.trim();
    if (update.degree !== undefined) subdoc.degree = update.degree.trim();
    if (update.field !== undefined) subdoc.field = update.field.trim();
    if (update.startDate !== undefined) subdoc.startDate = update.startDate.trim();
    if (update.endDate !== undefined) subdoc.endDate = update.endDate.trim();
    if (update.gpa !== undefined) subdoc.gpa = update.gpa.trim();

    await profile.save();
    return profile;
  }

  public async removeEducation(userId: string, eduId: string): Promise<IStudentProfile> {
    const profile = await this.getOrCreateProfile(userId);
    const subdoc = profile.educationHistory.id(eduId);

    if (!subdoc) {
      throw AppError.notFound('Education entry not found in your profile');
    }

    subdoc.deleteOne();
    await profile.save();
    return profile;
  }

  // --- Experience ---
  public async addExperience(userId: string, exp: IExperienceEntry): Promise<IStudentProfile> {
    const profile = await this.getOrCreateProfile(userId);

    profile.experience.push({
      role: exp.role.trim(),
      company: exp.company.trim(),
      location: exp.location?.trim(),
      startDate: exp.startDate.trim(),
      endDate: exp.endDate.trim(),
      current: exp.current ?? false,
      bullets: exp.bullets || [],
    } as IExperienceEntry);

    await profile.save();
    return profile;
  }

  public async updateExperience(
    userId: string,
    expId: string,
    update: Partial<IExperienceEntry>
  ): Promise<IStudentProfile> {
    const profile = await this.getOrCreateProfile(userId);
    const subdoc = profile.experience.id(expId);

    if (!subdoc) {
      throw AppError.notFound('Experience entry not found in your profile');
    }

    if (update.role !== undefined) subdoc.role = update.role.trim();
    if (update.company !== undefined) subdoc.company = update.company.trim();
    if (update.location !== undefined) subdoc.location = update.location.trim();
    if (update.startDate !== undefined) subdoc.startDate = update.startDate.trim();
    if (update.endDate !== undefined) subdoc.endDate = update.endDate.trim();
    if (update.current !== undefined) subdoc.current = update.current;
    if (update.bullets !== undefined) subdoc.bullets = update.bullets;

    await profile.save();
    return profile;
  }

  public async removeExperience(userId: string, expId: string): Promise<IStudentProfile> {
    const profile = await this.getOrCreateProfile(userId);
    const subdoc = profile.experience.id(expId);

    if (!subdoc) {
      throw AppError.notFound('Experience entry not found in your profile');
    }

    subdoc.deleteOne();
    await profile.save();
    return profile;
  }
}

export const profileService = new ProfileService();
