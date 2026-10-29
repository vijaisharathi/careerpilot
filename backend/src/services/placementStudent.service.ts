import { Types } from 'mongoose';
import { AppError } from '../utils/appError';
import {
  User,
  StudentProfile,
  Institution,
  PlacementDrive,
  PlacementRegistration,
  PlacementAnnouncement,
  JobApplication,
} from '../models';
import { placementEligibilityService } from './placementEligibility.service';
import { auditLogService } from './auditLog.service';

export interface StudentActor {
  id: string;
  email: string;
  name: string;
  role: string;
  institutionId?: string;
}

export class PlacementStudentService {
  /**
   * Resolves the student's institution.
   */
  public async resolveStudentInstitution(actor: StudentActor) {
    const userObjectId = new Types.ObjectId(actor.id);
    const [user, profile] = await Promise.all([
      User.findById(userObjectId),
      StudentProfile.findOne({ user: userObjectId }),
    ]);

    if (!user || !profile) {
      throw AppError.notFound('Student profile not found');
    }

    let institution = null;
    if (user.institutionId) {
      institution = await Institution.findById(user.institutionId);
    } else if (profile.institutionId) {
      institution = await Institution.findById(profile.institutionId);
    } else if (profile.college) {
      institution = await Institution.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${profile.college.trim()}$`, 'i') } },
          { code: { $regex: new RegExp(`^${profile.college.trim()}$`, 'i') } },
        ],
      });
    }

    // Fallback: If no institution found, find default active one
    if (!institution) {
      institution = await Institution.findOne({ isActive: true });
    }

    if (!institution) {
      institution = await Institution.create({
        name: profile.college || 'Apex Institute of Technology',
        code: 'AIT',
        domain: 'apex.edu',
        departments: [
          'Computer Science and Engineering',
          'Information Technology',
          'Electronics and Communication Engineering',
          'Electrical and Electronics Engineering',
          'Mechanical Engineering',
          'Data Science and Artificial Intelligence',
        ],
        isActive: true,
      });
    }

    // Cache institution on profile
    if (!profile.institutionId) {
      profile.institutionId = institution._id;
      await profile.save();
    }
    if (!user.institutionId) {
      user.institutionId = institution._id;
      await user.save();
    }

    return { user, profile, institution };
  }

  /**
   * Lists available recruitment drives for the authenticated student.
   */
  public async getCampusDrives(
    actor: StudentActor
  ): Promise<{ institution: { id: string; name: string }; drives: any[] }> {
    const { profile, institution } = await this.resolveStudentInstitution(actor);

    const now = new Date();
    const drives = await PlacementDrive.find({
      institutionId: institution._id,
      status: { $in: ['published', 'registration_open', 'in_progress'] },
    })
      .sort({ registrationDeadline: 1 })
      .lean();

    // Check student registrations
    const userObjectId = new Types.ObjectId(actor.id);
    const registrations = await PlacementRegistration.find({
      studentId: userObjectId,
      driveId: { $in: drives.map((d) => d._id) },
    }).lean();

    const regMap = new Map<string, any>();
    for (const r of registrations) {
      regMap.set(r.driveId.toString(), r);
    }

    // Evaluate eligibility for each drive
    const results = await Promise.all(
      drives.map(async (drive) => {
        const registration = regMap.get(drive._id.toString());
        const eligibility = await placementEligibilityService.evaluateEligibility(profile, drive as any);

        const isOpen =
          ['published', 'registration_open'].includes(drive.status) &&
          new Date(drive.registrationDeadline) >= now;

        return {
          ...drive,
          id: drive._id.toString(),
          isRegistered: Boolean(registration),
          registrationDetails: registration
            ? {
                registrationId: registration._id.toString(),
                currentStage: registration.currentStage,
                eligibilityStatus: registration.eligibilityStatus,
                appliedDate: registration.appliedDate,
                stageHistory: registration.stageHistory,
                offerDetails: registration.offerDetails,
              }
            : null,
          eligibilityResult: {
            status: eligibility.status,
            passedChecks: eligibility.passedChecks,
            failedChecks: eligibility.failedChecks,
            notes: eligibility.notes,
          },
          isRegistrationOpen: isOpen,
        };
      })
    );

    return {
      institution: {
        id: institution._id.toString(),
        name: institution.name,
      },
      drives: results,
    };
  }

  /**
   * Registers a student for a published recruitment drive.
   */
  public async registerForCampusDrive(actor: StudentActor, driveId: string) {
    if (!Types.ObjectId.isValid(driveId)) {
      throw AppError.badRequest('Invalid recruitment drive ID format');
    }

    const { user, profile, institution } = await this.resolveStudentInstitution(actor);
    const driveObjectId = new Types.ObjectId(driveId);

    const drive = await PlacementDrive.findOne({
      _id: driveObjectId,
      institutionId: institution._id,
    });

    if (!drive) {
      throw AppError.notFound(
        'Recruitment drive not found or not available for your institution.'
      );
    }

    // Check status
    if (!['published', 'registration_open'].includes(drive.status)) {
      throw AppError.badRequest(
        `Registration is closed for this drive (current status: ${drive.status}).`
      );
    }

    // Check deadline
    if (new Date() > new Date(drive.registrationDeadline)) {
      throw AppError.badRequest('The registration deadline for this recruitment drive has passed.');
    }

    // Check existing registration
    const existingRegistration = await PlacementRegistration.findOne({
      driveId: drive._id,
      studentId: user._id,
    });

    if (existingRegistration) {
      throw AppError.conflict(
        'You have already submitted a registration for this recruitment drive.'
      );
    }

    // Evaluate rule-based eligibility
    const eligibility = await placementEligibilityService.evaluateEligibility(profile, drive);

    const registration = new PlacementRegistration({
      driveId: drive._id,
      studentId: user._id,
      institutionId: institution._id,
      eligibilityStatus: eligibility.status,
      eligibilityEvaluation: {
        calculatedAt: eligibility.calculatedAt,
        ruleVersion: eligibility.ruleVersion,
        passedChecks: eligibility.passedChecks,
        failedChecks: eligibility.failedChecks,
        notes: eligibility.notes,
        isOverridden: false,
      },
      currentStage: 'registered',
      stageHistory: [
        {
          stage: 'registered',
          timestamp: new Date(),
          updatedBy: user._id,
          comment: 'Candidate self-registered via Campus Recruitment Portal.',
        },
      ],
      appliedDate: new Date(),
    });

    await registration.save();

    // Link/record an application in JobApplication collection for unified application tracker
    try {
      await JobApplication.create({
        user: user._id,
        company: drive.companyName,
        jobTitle: drive.jobRole,
        applicationUrl: drive.applicationUrl,
        dateApplied: new Date(),
        status: 'Applied',
        source: 'Campus Recruitment Drive',
        notes: `Registered for on-campus drive: "${drive.driveTitle}". Status: Registered.`,
      });
    } catch {
      // Non-blocking if tracker already exists
    }

    // Update profile placement status to in_process if unplaced
    if (!profile.placementStatus || profile.placementStatus === 'unplaced') {
      profile.placementStatus = 'in_process';
      await profile.save();
    }

    await auditLogService.logEvent({
      eventType: 'candidate_registered',
      actor: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      action: `Student registered for recruitment drive "${drive.driveTitle}" at ${drive.companyName}`,
      targetId: registration._id.toString(),
      targetType: 'PlacementRegistration',
      metadata: { driveId: drive._id.toString(), eligibilityStatus: eligibility.status },
    });

    return {
      registrationId: registration._id.toString(),
      driveTitle: drive.driveTitle,
      companyName: drive.companyName,
      eligibilityStatus: eligibility.status,
      currentStage: 'registered',
      message: 'Registration submitted successfully.',
    };
  }

  /**
   * Retrieves student's active campus drive applications.
   */
  public async getStudentRegistrations(actor: StudentActor) {
    const userObjectId = new Types.ObjectId(actor.id);
    const registrations = await PlacementRegistration.find({ studentId: userObjectId })
      .populate('driveId')
      .sort({ appliedDate: -1 })
      .lean();

    return registrations.map((r) => ({
      id: r._id.toString(),
      drive: r.driveId,
      eligibilityStatus: r.eligibilityStatus,
      currentStage: r.currentStage,
      stageHistory: r.stageHistory,
      offerDetails: r.offerDetails,
      appliedDate: r.appliedDate,
    }));
  }

  /**
   * Retrieves campus announcements targeting the student.
   */
  public async getCampusAnnouncements(actor: StudentActor) {
    const { profile, institution } = await this.resolveStudentInstitution(actor);

    const filter: any = {
      institutionId: institution._id,
      isActive: true,
      $or: [{ expirationDate: { $exists: false } }, { expirationDate: { $gte: new Date() } }],
    };

    const announcements = await PlacementAnnouncement.find(filter)
      .populate('relatedDriveId', 'companyName driveTitle jobRole')
      .sort({ publicationDate: -1 })
      .lean();

    // Filter to those matching student department/grad year if specified
    const studentDept = (profile.department || '').toLowerCase();
    const studentYear = profile.graduationYear;

    const filtered = announcements.filter((a) => {
      if (a.targetDepartments && a.targetDepartments.length > 0) {
        const matchesDept = a.targetDepartments.some((d) =>
          studentDept.includes(d.toLowerCase())
        );
        if (!matchesDept) return false;
      }
      if (a.targetGraduationYears && a.targetGraduationYears.length > 0 && studentYear) {
        if (!a.targetGraduationYears.includes(studentYear)) return false;
      }
      return true;
    });

    return filtered.map((a) => ({
      id: a._id.toString(),
      title: a.title,
      content: a.content,
      relatedDrive: a.relatedDriveId,
      publicationDate: a.publicationDate,
    }));
  }
}

export const placementStudentService = new PlacementStudentService();
