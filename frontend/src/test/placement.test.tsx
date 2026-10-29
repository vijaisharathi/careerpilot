import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../components/common/Badge';
import { Select } from '../components/common/FormControls';
import { placementService } from '../services/placement.service';
import { apiClient } from '../services/api.client';

describe('Phase 14: Placement Officer & Campus Management Frontend Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Badge component variants in Placement modules', () => {
    it('supports new placement variants: primary, secondary, default, success, warning', () => {
      const { rerender } = render(<Badge variant="success">Eligible</Badge>);
      expect(screen.getByText('Eligible')).toBeInTheDocument();

      rerender(<Badge variant="warning">Nearly Ready</Badge>);
      expect(screen.getByText('Nearly Ready')).toBeInTheDocument();

      rerender(<Badge variant="primary">Campus Drive</Badge>);
      expect(screen.getByText('Campus Drive')).toBeInTheDocument();

      rerender(<Badge variant="secondary">On-site</Badge>);
      expect(screen.getByText('On-site')).toBeInTheDocument();

      rerender(<Badge variant="default">Insufficient Data</Badge>);
      expect(screen.getByText('Insufficient Data')).toBeInTheDocument();
    });
  });

  describe('FormControls Select component flexibility', () => {
    it('supports rendering with options prop', () => {
      render(
        <Select
          label="Department"
          options={[
            { label: 'Computer Science', value: 'CS' },
            { label: 'Information Technology', value: 'IT' },
          ]}
        />
      );
      expect(screen.getByText('Computer Science')).toBeInTheDocument();
      expect(screen.getByText('Information Technology')).toBeInTheDocument();
    });

    it('supports rendering with custom children option tags', () => {
      render(
        <Select label="Status">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </Select>
      );
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Published')).toBeInTheDocument();
    });
  });

  describe('placementService API integration client', () => {
    it('calls getDashboardMetrics via apiClient.get', async () => {
      const mockData = {
        institution: { id: 'inst-1', name: 'Apex Institute of Technology', code: 'AIT' },
        metrics: {
          totalStudents: 150,
          completedProfiles: 120,
          completedAssessments: 100,
          placementReadyStudents: 85,
          nearlyReadyStudents: 35,
          activeDrivesCount: 4,
          totalCandidatesRegistered: 90,
          placementApplicationsCount: 90,
          studentsWithOffersCount: 25,
          pendingEligibilityReviews: 5,
          candidatesInInterview: 18,
        },
        upcomingDeadlines: [],
      };

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockData);

      const result = await placementService.getDashboardMetrics();
      expect(getSpy).toHaveBeenCalledWith('/placement/dashboard/metrics');
      expect(result.metrics.placementReadyStudents).toBe(85);
      expect(result.institution.name).toBe('Apex Institute of Technology');
    });

    it('calls getStudents with structured query parameters', async () => {
      const mockResult = {
        students: [
          {
            id: 'stu-1',
            profileId: 'prof-1',
            fullName: 'Aarav Sharma',
            email: 'aarav@example.com',
            department: 'Computer Science',
            degree: 'B.Tech',
            graduationYear: 2026,
            completionPercentage: 85,
            placementStatus: 'in_process' as const,
            skillsCount: 6,
            topSkills: ['React', 'TypeScript'],
            readinessCategory: 'Ready' as const,
            drivesAppliedCount: 2,
            hasOffer: false,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockResult);

      const result = await placementService.getStudents({
        department: 'Computer Science',
        readinessCategory: 'Ready',
      });

      expect(getSpy).toHaveBeenCalledWith(
        expect.stringContaining('/placement/students?department=Computer+Science&readinessCategory=Ready')
      );
      expect(result.students).toHaveLength(1);
      expect(result.students[0].fullName).toBe('Aarav Sharma');
    });

    it('calls updateCandidateStage with patch payload and offerDetails', async () => {
      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({ success: true });

      await placementService.updateCandidateStage(
        'drive-123',
        'reg-456',
        'offered',
        'Exceptional technical interview',
        { salary: '16 LPA', designation: 'Member of Technical Staff' }
      );

      expect(patchSpy).toHaveBeenCalledWith(
        '/placement/drives/drive-123/candidates/reg-456/stage',
        {
          stage: 'offered',
          comment: 'Exceptional technical interview',
          offerDetails: {
            salary: '16 LPA',
            designation: 'Member of Technical Staff',
          },
        }
      );
    });

    it('calls overrideCandidateEligibility with mandatory reason', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ success: true });

      await placementService.overrideCandidateEligibility(
        'drive-123',
        'reg-456',
        'eligible',
        'Dean approved equivalency for GPA cutoff'
      );

      expect(postSpy).toHaveBeenCalledWith(
        '/placement/drives/drive-123/candidates/reg-456/override-eligibility',
        {
          status: 'eligible',
          reason: 'Dean approved equivalency for GPA cutoff',
        }
      );
    });

    it('calls exportCsv via apiClient.downloadBlob with type query param', async () => {
      const mockBlob = new Blob(['name,email\nTest,test@example.com'], { type: 'text/csv' });
      const downloadSpy = vi.spyOn(apiClient, 'downloadBlob').mockResolvedValue(mockBlob);

      const blob = await placementService.exportCsv('students');
      expect(downloadSpy).toHaveBeenCalledWith('/placement/reports/export?type=students');
      expect(blob).toBe(mockBlob);
    });

    it('calls registerForCampusDrive for student 1-click registration', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ success: true });

      await placementService.registerForCampusDrive('drive-789');
      expect(postSpy).toHaveBeenCalledWith(
        '/placement/student/drives/drive-789/register',
        {}
      );
    });
  });
});

