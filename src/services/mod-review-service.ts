/**
 * Mod Review Service
 * 
 * Handles mod submission, review queue, and approval workflow.
 * Integrates with PII scanner and admin dashboard.
 */

export interface ModSubmission {
    id: string;
    name: string;
    author: string;
    authorEmail: string;
    componentName: string;
    description: string;
    version: string;
    files: Record<string, string>;
    metadata: Record<string, any>;
    tokenPrice: number;
    status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'flagged';
    submittedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    reviewNotes?: string;
    piiScanResult?: any;
    installCount: number;
    rating?: number;
}

export interface ReviewQueue {
    pending: ModSubmission[];
    underReview: ModSubmission[];
    flagged: ModSubmission[];
    totalCount: number;
}

export interface ReviewAction {
    submissionId: string;
    action: 'approve' | 'reject' | 'flag' | 'request_changes';
    reviewerId: string;
    notes: string;
    piiOverride?: boolean;
}

export interface ModReviewStats {
    totalSubmissions: number;
    pendingReview: number;
    approvedToday: number;
    rejectedToday: number;
    averageReviewTime: number; // in hours
    flaggedCount: number;
}

export class ModReviewService {
    private submissions: Map<string, ModSubmission> = new Map();
    private reviewQueue: ReviewQueue = {
        pending: [],
        underReview: [],
        flagged: [],
        totalCount: 0
    };

    constructor() {
        this.initializeMockData();
    }

    /**
     * Submit a mod for review
     */
    async submitMod(submission: Omit<ModSubmission, 'id' | 'status' | 'submittedAt' | 'installCount'>): Promise<ModSubmission> {
        const id = `submission-${Date.now()}`;
        const modSubmission: ModSubmission = {
            ...submission,
            id,
            status: 'pending',
            submittedAt: new Date().toISOString(),
            installCount: 0
        };

        this.submissions.set(id, modSubmission);
        this.reviewQueue.pending.push(modSubmission);
        this.reviewQueue.totalCount++;

        // Send notification to admin team
        await this.notifyAdmins('new_submission', modSubmission);

        return modSubmission;
    }

    /**
     * Get review queue
     */
    async getReviewQueue(): Promise<ReviewQueue> {
        return {
            ...this.reviewQueue,
            pending: [...this.reviewQueue.pending],
            underReview: [...this.reviewQueue.underReview],
            flagged: [...this.reviewQueue.flagged]
        };
    }

    /**
     * Get submission by ID
     */
    async getSubmission(id: string): Promise<ModSubmission | null> {
        return this.submissions.get(id) || null;
    }

    /**
     * Get submissions by author
     */
    async getSubmissionsByAuthor(authorEmail: string): Promise<ModSubmission[]> {
        return Array.from(this.submissions.values())
            .filter(submission => submission.authorEmail === authorEmail);
    }

    /**
     * Process review action
     */
    async processReviewAction(action: ReviewAction): Promise<ModSubmission> {
        const submission = this.submissions.get(action.submissionId);
        if (!submission) {
            throw new Error('Submission not found');
        }

        // Update submission status
        switch (action.action) {
            case 'approve':
                submission.status = 'approved';
                submission.reviewedAt = new Date().toISOString();
                submission.reviewedBy = action.reviewerId;
                submission.reviewNotes = action.notes;
                
                // Remove from queue
                this.removeFromQueue(action.submissionId);
                
                // Notify author
                await this.notifyAuthor(submission.authorEmail, 'approved', submission);
                break;

            case 'reject':
                submission.status = 'rejected';
                submission.reviewedAt = new Date().toISOString();
                submission.reviewedBy = action.reviewerId;
                submission.reviewNotes = action.notes;
                
                // Remove from queue
                this.removeFromQueue(action.submissionId);
                
                // Notify author
                await this.notifyAuthor(submission.authorEmail, 'rejected', submission);
                break;

            case 'flag':
                submission.status = 'flagged';
                submission.reviewedAt = new Date().toISOString();
                submission.reviewedBy = action.reviewerId;
                submission.reviewNotes = action.notes;
                
                // Move to flagged queue
                this.moveToFlagged(action.submissionId);
                
                // Notify author
                await this.notifyAuthor(submission.authorEmail, 'flagged', submission);
                break;

            case 'request_changes':
                submission.status = 'pending';
                submission.reviewedAt = new Date().toISOString();
                submission.reviewedBy = action.reviewerId;
                submission.reviewNotes = action.notes;
                
                // Keep in pending queue
                await this.notifyAuthor(submission.authorEmail, 'changes_requested', submission);
                break;
        }

        return submission;
    }

    /**
     * Get review statistics
     */
    async getReviewStats(): Promise<ModReviewStats> {
        const today = new Date().toISOString().split('T')[0];
        const submissions = Array.from(this.submissions.values());
        
        const approvedToday = submissions.filter(s => 
            s.status === 'approved' && s.reviewedAt?.startsWith(today)
        ).length;

        const rejectedToday = submissions.filter(s => 
            s.status === 'rejected' && s.reviewedAt?.startsWith(today)
        ).length;

        const flaggedCount = submissions.filter(s => s.status === 'flagged').length;

        // Calculate average review time (mock data)
        const averageReviewTime = 24; // hours

        return {
            totalSubmissions: submissions.length,
            pendingReview: this.reviewQueue.pending.length,
            approvedToday,
            rejectedToday,
            averageReviewTime,
            flaggedCount
        };
    }

    /**
     * Get submission history for admin
     */
    async getSubmissionHistory(limit: number = 50): Promise<ModSubmission[]> {
        return Array.from(this.submissions.values())
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
            .slice(0, limit);
    }

    /**
     * Search submissions
     */
    async searchSubmissions(query: string, filters: {
        status?: string;
        author?: string;
        component?: string;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<ModSubmission[]> {
        let results = Array.from(this.submissions.values());

        // Apply filters
        if (filters.status) {
            results = results.filter(s => s.status === filters.status);
        }

        if (filters.author) {
            results = results.filter(s => 
                s.author.toLowerCase().includes(filters.author!.toLowerCase()) ||
                s.authorEmail.toLowerCase().includes(filters.author!.toLowerCase())
            );
        }

        if (filters.component) {
            results = results.filter(s => s.componentName === filters.component);
        }

        if (filters.dateFrom) {
            results = results.filter(s => s.submittedAt >= filters.dateFrom!);
        }

        if (filters.dateTo) {
            results = results.filter(s => s.submittedAt <= filters.dateTo!);
        }

        // Apply text search
        if (query) {
            const searchQuery = query.toLowerCase();
            results = results.filter(s => 
                s.name.toLowerCase().includes(searchQuery) ||
                s.description.toLowerCase().includes(searchQuery) ||
                s.author.toLowerCase().includes(searchQuery)
            );
        }

        return results.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }

    /**
     * Remove submission from queue
     */
    private removeFromQueue(submissionId: string): void {
        this.reviewQueue.pending = this.reviewQueue.pending.filter(s => s.id !== submissionId);
        this.reviewQueue.underReview = this.reviewQueue.underReview.filter(s => s.id !== submissionId);
        this.reviewQueue.flagged = this.reviewQueue.flagged.filter(s => s.id !== submissionId);
        this.reviewQueue.totalCount--;
    }

    /**
     * Move submission to flagged queue
     */
    private moveToFlagged(submissionId: string): void {
        const submission = this.submissions.get(submissionId);
        if (submission) {
            // Remove from other queues
            this.reviewQueue.pending = this.reviewQueue.pending.filter(s => s.id !== submissionId);
            this.reviewQueue.underReview = this.reviewQueue.underReview.filter(s => s.id !== submissionId);
            
            // Add to flagged if not already there
            if (!this.reviewQueue.flagged.find(s => s.id === submissionId)) {
                this.reviewQueue.flagged.push(submission);
            }
        }
    }

    /**
     * Notify admins about new submission
     */
    private async notifyAdmins(type: string, submission: ModSubmission): Promise<void> {
        console.log(`📧 Admin notification: ${type}`, {
            submissionId: submission.id,
            modName: submission.name,
            author: submission.author
        });
        
        // In a real implementation, this would send emails or push notifications
        // to the admin team
    }

    /**
     * Notify author about review result
     */
    private async notifyAuthor(email: string, action: string, submission: ModSubmission): Promise<void> {
        console.log(`📧 Author notification: ${action}`, {
            email,
            submissionId: submission.id,
            modName: submission.name
        });
        
        // In a real implementation, this would send an email to the author
    }

    /**
     * Initialize mock data for development
     */
    private initializeMockData(): void {
        const mockSubmissions: ModSubmission[] = [
            {
                id: 'submission-1',
                name: 'Dark Theme for Wave Tabs',
                author: 'modder123',
                authorEmail: 'modder123@example.com',
                componentName: 'wave-tabs',
                description: 'A sleek dark theme for the Wave Tabs component with smooth animations.',
                version: '1.0.0',
                files: {
                    'theme.css': '.wave-tabs { background: #1a1a1a; color: #ffffff; }',
                    'animations.js': '// Smooth transition animations'
                },
                metadata: {
                    category: 'theme',
                    tags: ['dark', 'theme', 'ui']
                },
                tokenPrice: 5,
                status: 'approved',
                submittedAt: '2024-01-15T10:30:00Z',
                reviewedAt: '2024-01-15T14:20:00Z',
                reviewedBy: 'admin1',
                reviewNotes: 'Great theme, approved!',
                installCount: 156,
                rating: 4.8
            },
            {
                id: 'submission-2',
                name: 'Enhanced Selector Hierarchy',
                author: 'devmaster',
                authorEmail: 'devmaster@example.com',
                componentName: 'selector-hierarchy',
                description: 'Improved selector hierarchy with better performance and visual indicators.',
                version: '1.0.0',
                files: {
                    'enhancement.js': '// Performance improvements',
                    'styles.css': '/* Visual enhancements */'
                },
                metadata: {
                    category: 'functionality',
                    tags: ['performance', 'ui', 'enhancement']
                },
                tokenPrice: 10,
                status: 'pending',
                submittedAt: '2024-01-16T09:15:00Z',
                installCount: 0
            },
            {
                id: 'submission-3',
                name: 'Custom Error Boundaries',
                author: 'errorhandler',
                authorEmail: 'errorhandler@example.com',
                componentName: 'error-boundary',
                description: 'Advanced error boundary with custom styling and recovery options.',
                version: '1.0.0',
                files: {
                    'error-boundary.tsx': '// React error boundary component',
                    'recovery.ts': '// Error recovery logic'
                },
                metadata: {
                    category: 'functionality',
                    tags: ['error-handling', 'react', 'recovery']
                },
                tokenPrice: 3,
                status: 'flagged',
                submittedAt: '2024-01-16T11:45:00Z',
                reviewedAt: '2024-01-16T15:30:00Z',
                reviewedBy: 'admin2',
                reviewNotes: 'Contains potential PII in comments - needs review',
                installCount: 0
            }
        ];

        mockSubmissions.forEach(submission => {
            this.submissions.set(submission.id, submission);
            
            if (submission.status === 'pending') {
                this.reviewQueue.pending.push(submission);
            } else if (submission.status === 'flagged') {
                this.reviewQueue.flagged.push(submission);
            }
        });

        this.reviewQueue.totalCount = this.reviewQueue.pending.length + this.reviewQueue.flagged.length;
    }
}

/**
 * Initialize mod review service
 */
export const initializeModReviewService = (): ModReviewService => {
    return new ModReviewService();
};
