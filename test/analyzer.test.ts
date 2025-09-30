import { GitAnalyzer } from '../src/core/analyzer';

describe('GitAnalyzer Coverage Tests', () => {
  let analyzer: GitAnalyzer;

  beforeEach(() => {
    // Create analyzer instance with a test repo path
    analyzer = new GitAnalyzer('/test/repo');
  });

  describe('Recommendation generation edge cases', () => {
    it('should generate risk recommendations for high-risk scenarios', () => {
      // Mock data that would trigger high-risk recommendations
      const mockHighRiskFiles = Array(15).fill({ path: 'file.ts', riskScore: 0.9 }); // More than 10 high-risk files
      const mockRiskFactors = {
        manyAuthorFiles: 8, // More than 5
        largeCommits: 12, // More than 10
        orphanFiles: 3,
        complexFiles: 5,
      };

      // Access private method using type assertion for coverage testing
      const generateRiskRecommendations = (analyzer as any).generateRiskRecommendations.bind(
        analyzer
      );
      const recommendations = generateRiskRecommendations(mockHighRiskFiles, mockRiskFactors);

      expect(recommendations).toContain(
        'Consider refactoring high-churn files to reduce complexity'
      );
      expect(recommendations).toContain(
        'Establish code ownership guidelines for frequently modified files'
      );
      expect(recommendations).toContain('Encourage smaller, more focused commits');
    });

    it('should generate governance recommendations for poor governance', () => {
      const mockGovernanceData = {
        conventionalCommits: 2,
        totalCommits: 10, // 20% conventional commits (< 50%)
        traceabilityScore: 0.2, // < 0.3
        shortMessages: 3, // 30% short messages (> 20%)
      };

      // Access private method for coverage
      const generateGovernanceRecommendations = (
        analyzer as any
      ).generateGovernanceRecommendations.bind(analyzer);
      const recommendations = generateGovernanceRecommendations(mockGovernanceData);

      expect(recommendations).toContain('Adopt conventional commit message format');
      expect(recommendations).toContain('Link commits to issues for better traceability');
      expect(recommendations).toContain('Write more descriptive commit messages');
    });

    it('should not generate recommendations when thresholds are not met', () => {
      // Mock data that does NOT trigger recommendations
      const mockLowRiskFiles = Array(5).fill({ path: 'file.ts', riskScore: 0.3 }); // Only 5 high-risk files (<=10)
      const mockLowRiskFactors = {
        manyAuthorFiles: 3, // <=5
        largeCommits: 8, // <=10
        orphanFiles: 1,
        complexFiles: 2,
      };

      const generateRiskRecommendations = (analyzer as any).generateRiskRecommendations.bind(
        analyzer
      );
      const recommendations = generateRiskRecommendations(mockLowRiskFiles, mockLowRiskFactors);

      expect(recommendations).not.toContain(
        'Consider refactoring high-churn files to reduce complexity'
      );
      expect(recommendations).not.toContain(
        'Establish code ownership guidelines for frequently modified files'
      );
      expect(recommendations).not.toContain('Encourage smaller, more focused commits');
    });

    it('should not generate governance recommendations when metrics are good', () => {
      const mockGoodGovernanceData = {
        conventionalCommits: 8,
        totalCommits: 10, // 80% conventional commits (>= 50%)
        traceabilityScore: 0.8, // >= 0.3
        shortMessages: 1, // 10% short messages (<= 20%)
      };

      const generateGovernanceRecommendations = (
        analyzer as any
      ).generateGovernanceRecommendations.bind(analyzer);
      const recommendations = generateGovernanceRecommendations(mockGoodGovernanceData);

      expect(recommendations).not.toContain('Adopt conventional commit message format');
      expect(recommendations).not.toContain('Link commits to issues for better traceability');
      expect(recommendations).not.toContain('Write more descriptive commit messages');
    });

    it('should handle edge case with zero total commits in governance', () => {
      const mockZeroCommitsData = {
        conventionalCommits: 0,
        totalCommits: 0, // Zero commits - should avoid division by zero
        traceabilityScore: 0,
        shortMessages: 0,
      };

      const generateGovernanceRecommendations = (
        analyzer as any
      ).generateGovernanceRecommendations.bind(analyzer);

      // Should not throw an error with zero commits
      expect(() => {
        const recommendations = generateGovernanceRecommendations(mockZeroCommitsData);
        expect(Array.isArray(recommendations)).toBe(true);
      }).not.toThrow();
    });

    it('should handle exactly threshold values', () => {
      // Test exactly at thresholds to cover boundary conditions
      const mockBoundaryRiskFiles = Array(10).fill({ path: 'file.ts', riskScore: 0.7 }); // Exactly 10 high-risk files
      const mockBoundaryRiskFactors = {
        manyAuthorFiles: 5, // Exactly 5
        largeCommits: 10, // Exactly 10
        orphanFiles: 0,
        complexFiles: 0,
      };

      const generateRiskRecommendations = (analyzer as any).generateRiskRecommendations.bind(
        analyzer
      );
      const recommendations = generateRiskRecommendations(
        mockBoundaryRiskFiles,
        mockBoundaryRiskFactors
      );

      // At exactly threshold values, recommendations should NOT be generated
      expect(recommendations).not.toContain(
        'Consider refactoring high-churn files to reduce complexity'
      );
      expect(recommendations).not.toContain(
        'Establish code ownership guidelines for frequently modified files'
      );
      expect(recommendations).not.toContain('Encourage smaller, more focused commits');
    });

    it('should handle boundary governance values', () => {
      const mockBoundaryGovernanceData = {
        conventionalCommits: 5,
        totalCommits: 10, // Exactly 50% conventional commits
        traceabilityScore: 0.3, // Exactly 0.3
        shortMessages: 2, // Exactly 20% short messages
      };

      const generateGovernanceRecommendations = (
        analyzer as any
      ).generateGovernanceRecommendations.bind(analyzer);
      const recommendations = generateGovernanceRecommendations(mockBoundaryGovernanceData);

      // At boundary values, some recommendations should NOT be generated
      expect(recommendations).not.toContain('Adopt conventional commit message format');
      expect(recommendations).not.toContain('Link commits to issues for better traceability');
      expect(recommendations).not.toContain('Write more descriptive commit messages');
    });
  });
});
