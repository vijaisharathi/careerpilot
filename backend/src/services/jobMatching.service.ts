import { IJobOpportunity } from '../models/jobOpportunity.model';
import { IStudentProfile, ISkillEntry } from '../models/studentProfile.model';

export type EligibilityStatus = 'eligible' | 'ineligible' | 'unverified';
export type OverallEligibilityVerdict = 'Eligible' | 'Not Eligible' | 'Requires Verification';

export interface IMatchedJobSkill {
  name: string;
  studentProficiency: string;
  requiredProficiency: string;
  status: 'met' | 'exceeded' | 'partial';
  creditPercentage: number;
}

export interface IMissingJobSkill {
  name: string;
  requiredProficiency: string;
  importance: 'critical' | 'recommended';
}

export interface IEligibilityCriterion {
  criterion: string;
  required: string;
  studentValue: string;
  status: EligibilityStatus;
  note: string;
}

export interface IJobMatchResult {
  matchScore: number; // 0 - 100%
  suitability: 'High Match' | 'Moderate Match' | 'Developing Match';
  matchedSkills: IMatchedJobSkill[];
  missingSkills: IMissingJobSkill[];
  matchedPreferredSkills: string[];
  eligibility: {
    verdict: OverallEligibilityVerdict;
    summary: string;
    criteria: IEligibilityCriterion[];
  };
}

const PROFICIENCY_RANK: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export class JobMatchingService {
  /**
   * Evaluates student skills against an opportunity's required/preferred skills
   * and independently assesses academic eligibility criteria.
   */
  public evaluateMatch(job: IJobOpportunity, profile: IStudentProfile): IJobMatchResult {
    // 1. Build normalized map of student skills
    const studentSkillMap = new Map<string, ISkillEntry>();
    for (const sk of profile.skills || []) {
      studentSkillMap.set(this.normalizeSkillName(sk.name), sk);
    }

    // 2. Evaluate Required Skills
    const matchedSkills: IMatchedJobSkill[] = [];
    const missingSkills: IMissingJobSkill[] = [];
    let totalWeight = 0;
    let earnedWeight = 0;

    for (const req of job.requiredSkills || []) {
      const weight = req.weight || (req.importance === 'critical' ? 5 : 3);
      totalWeight += weight;

      const studentSkill = this.findMatchingStudentSkill(req.name, studentSkillMap);

      if (studentSkill) {
        const studentRank = PROFICIENCY_RANK[studentSkill.proficiency.toLowerCase()] || 2;
        const requiredRank = PROFICIENCY_RANK[req.minProficiency.toLowerCase()] || 2;

        let credit = 1.0;
        let status: 'met' | 'exceeded' | 'partial' = 'met';

        if (studentRank > requiredRank) {
          credit = 1.0;
          status = 'exceeded';
        } else if (studentRank === requiredRank) {
          credit = 1.0;
          status = 'met';
        } else if (requiredRank - studentRank === 1) {
          credit = 0.75;
          status = 'partial';
        } else {
          credit = 0.5;
          status = 'partial';
        }

        earnedWeight += weight * credit;
        matchedSkills.push({
          name: req.name,
          studentProficiency: studentSkill.proficiency,
          requiredProficiency: req.minProficiency,
          status,
          creditPercentage: Math.round(credit * 100),
        });
      } else {
        missingSkills.push({
          name: req.name,
          requiredProficiency: req.minProficiency,
          importance: req.importance,
        });
      }
    }

    // 3. Evaluate Preferred Skills (up to +10% bonus)
    const matchedPreferredSkills: string[] = [];
    for (const pref of job.preferredSkills || []) {
      if (this.findMatchingStudentSkill(pref, studentSkillMap)) {
        matchedPreferredSkills.push(pref);
      }
    }
    const preferredBonus = Math.min(10, matchedPreferredSkills.length * 2.5);

    // 4. Calculate Final Match Score (0 - 100%)
    const baseWeightedPercentage =
      totalWeight > 0 ? (earnedWeight / totalWeight) * 90 : 90;
    const rawScore = baseWeightedPercentage + preferredBonus;
    const matchScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    let suitability: 'High Match' | 'Moderate Match' | 'Developing Match' = 'Developing Match';
    if (matchScore >= 80) {
      suitability = 'High Match';
    } else if (matchScore >= 60) {
      suitability = 'Moderate Match';
    }

    // 5. Separate Academic Eligibility Assessment
    const eligibility = this.assessEligibility(job, profile);

    return {
      matchScore,
      suitability,
      matchedSkills,
      missingSkills,
      matchedPreferredSkills,
      eligibility,
    };
  }

  /**
   * Assesses degree, major, graduation year, and GPA against stated minimums.
   * Crucial rule: Missing information must be flagged as "unverified" rather than assuming eligibility.
   */
  private assessEligibility(
    job: IJobOpportunity,
    profile: IStudentProfile
  ): IJobMatchResult['eligibility'] {
    const minQual = job.minimumQualifications || {};
    const criteria: IEligibilityCriterion[] = [];

    // Criterion 1: Degree Level
    if (minQual.minDegreeLevel) {
      const studentDegree = profile.degree?.trim();
      if (!studentDegree) {
        criteria.push({
          criterion: 'Degree Level',
          required: minQual.minDegreeLevel,
          studentValue: 'Not specified in profile',
          status: 'unverified',
          note: `Requires ${minQual.minDegreeLevel}. Verify your active degree on the company portal.`,
        });
      } else {
        const matchesDegree = this.checkDegreeMatch(studentDegree, minQual.minDegreeLevel);
        criteria.push({
          criterion: 'Degree Level',
          required: minQual.minDegreeLevel,
          studentValue: studentDegree,
          status: matchesDegree ? 'eligible' : 'ineligible',
          note: matchesDegree
            ? `Student degree (${studentDegree}) satisfies the minimum degree requirement.`
            : `Degree (${studentDegree}) may not satisfy ${minQual.minDegreeLevel} requirement.`,
        });
      }
    }

    // Criterion 2: Major / Department
    if (minQual.allowedMajors && minQual.allowedMajors.length > 0) {
      const studentMajor = profile.department?.trim();
      if (!studentMajor) {
        criteria.push({
          criterion: 'Academic Major',
          required: minQual.allowedMajors.join(', '),
          studentValue: 'Not specified in profile',
          status: 'unverified',
          note: `Listing accepts: ${minQual.allowedMajors.slice(0, 3).join(', ')}. Major not specified in profile.`,
        });
      } else {
        const matchesMajor = minQual.allowedMajors.some(
          (m) =>
            m.toLowerCase().includes(studentMajor.toLowerCase()) ||
            studentMajor.toLowerCase().includes(m.toLowerCase())
        );
        criteria.push({
          criterion: 'Academic Major',
          required: minQual.allowedMajors.join(', '),
          studentValue: studentMajor,
          status: matchesMajor ? 'eligible' : 'ineligible',
          note: matchesMajor
            ? `Major (${studentMajor}) is listed among accepted academic disciplines.`
            : `Major (${studentMajor}) was not explicitly listed in accepted disciplines.`,
        });
      }
    }

    // Criterion 3: Graduation Year
    if (minQual.minGraduationYear || minQual.maxGraduationYear) {
      const gradYear = profile.graduationYear;
      const minYr = minQual.minGraduationYear || 2020;
      const maxYr = minQual.maxGraduationYear || 2030;
      const reqText = `${minYr} - ${maxYr}`;

      if (!gradYear) {
        criteria.push({
          criterion: 'Graduation Year',
          required: reqText,
          studentValue: 'Not specified in profile',
          status: 'unverified',
          note: `Targeting students graduating between ${reqText}. Graduation year is missing in profile.`,
        });
      } else {
        const inRange = gradYear >= minYr && gradYear <= maxYr;
        criteria.push({
          criterion: 'Graduation Year',
          required: reqText,
          studentValue: String(gradYear),
          status: inRange ? 'eligible' : 'ineligible',
          note: inRange
            ? `Graduation year (${gradYear}) is within the recruiting cycle (${reqText}).`
            : `Graduation year (${gradYear}) falls outside the target batch (${reqText}).`,
        });
      }
    }

    // Criterion 4: Minimum GPA
    if (minQual.minGpa) {
      const studentGpaRaw = this.extractNumericGpa(profile);
      if (studentGpaRaw === null) {
        criteria.push({
          criterion: 'Minimum GPA',
          required: `${minQual.minGpa.toFixed(1)} / 4.0`,
          studentValue: 'Not specified in profile',
          status: 'unverified',
          note: `Position specifies a minimum GPA of ${minQual.minGpa}. GPA not listed in profile.`,
        });
      } else {
        const meetsGpa = studentGpaRaw >= minQual.minGpa;
        criteria.push({
          criterion: 'Minimum GPA',
          required: `${minQual.minGpa.toFixed(1)} / 4.0`,
          studentValue: studentGpaRaw.toFixed(2),
          status: meetsGpa ? 'eligible' : 'ineligible',
          note: meetsGpa
            ? `Student GPA (${studentGpaRaw.toFixed(2)}) meets minimum requirement (${minQual.minGpa}).`
            : `Student GPA (${studentGpaRaw.toFixed(2)}) is below the stated minimum (${minQual.minGpa}).`,
        });
      }
    }

    // Overall verdict
    let verdict: OverallEligibilityVerdict = 'Eligible';
    const hasIneligible = criteria.some((c) => c.status === 'ineligible');
    const hasUnverified = criteria.some((c) => c.status === 'unverified');

    if (hasIneligible) {
      verdict = 'Not Eligible';
    } else if (hasUnverified) {
      verdict = 'Requires Verification';
    }

    const summary =
      verdict === 'Eligible'
        ? 'Your verified education and academic credentials satisfy all stated minimum qualifications.'
        : verdict === 'Requires Verification'
        ? 'Some candidate eligibility criteria cannot be verified from your profile. Review minimum requirements before applying.'
        : 'One or more academic prerequisites (degree, major, or graduation year) do not match this vacancy.';

    return {
      verdict,
      summary,
      criteria,
    };
  }

  private normalizeSkillName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[()./&+,_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private findMatchingStudentSkill(
    reqName: string,
    studentSkillMap: Map<string, ISkillEntry>
  ): ISkillEntry | undefined {
    const normReq = this.normalizeSkillName(reqName);

    // Exact match
    if (studentSkillMap.has(normReq)) {
      return studentSkillMap.get(normReq);
    }

    // Substring / synonym check
    for (const [normStudent, skill] of studentSkillMap.entries()) {
      if (
        normStudent === normReq ||
        normStudent.includes(normReq) ||
        normReq.includes(normStudent)
      ) {
        return skill;
      }

      // Synonyms
      if (
        (normReq.includes('react') && normStudent.includes('react')) ||
        (normReq.includes('node') && normStudent.includes('node')) ||
        (normReq.includes('ts') && normStudent.includes('typescript')) ||
        (normReq.includes('js') && normStudent.includes('javascript'))
      ) {
        return skill;
      }
    }

    return undefined;
  }

  private checkDegreeMatch(studentDegree: string, requiredDegree: string): boolean {
    const sd = studentDegree.toLowerCase();
    const rd = requiredDegree.toLowerCase();

    if (sd.includes(rd) || rd.includes(sd)) return true;
    if (rd.includes("bachelor") && (sd.includes('b.s') || sd.includes('b.tech') || sd.includes('bachelor') || sd.includes('b.e'))) {
      return true;
    }
    if (rd.includes("master") && (sd.includes('m.s') || sd.includes('m.tech') || sd.includes('master'))) {
      return true;
    }
    return false;
  }

  private extractNumericGpa(profile: IStudentProfile): number | null {
    // Check education entries or profile headline/metadata
    if (profile.educationHistory && profile.educationHistory.length > 0) {
      for (const edu of profile.educationHistory) {
        if (edu.gpa) {
          const match = edu.gpa.match(/([0-9]+\.[0-9]+|[0-9]+)/);
          if (match) {
            const val = parseFloat(match[1]);
            if (val > 0 && val <= 4.0) return val;
            if (val > 4.0 && val <= 10.0) return (val / 10.0) * 4.0; // Normalized 10.0 scale
          }
        }
      }
    }
    return null;
  }
}

export const jobMatchingService = new JobMatchingService();
