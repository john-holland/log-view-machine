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
    averageReviewTime: number;
    flaggedCount: number;
}
export declare class ModReviewService {
    private submissions;
    private reviewQueue;
    constructor();
    /**
     * Submit a mod for review
     */
    submitMod(submission: Omit<ModSubmission, 'id' | 'status' | 'submittedAt' | 'installCount'>): Promise<ModSubmission>;
    /**
     * Get review queue
     */
    getReviewQueue(): Promise<ReviewQueue>;
    /**
     * Get submission by ID
     */
    getSubmission(id: string): Promise<ModSubmission | null>;
    /**
     * Get submissions by author
     */
    getSubmissionsByAuthor(authorEmail: string): Promise<ModSubmission[]>;
    /**
     * Process review action
     */
    processReviewAction(action: ReviewAction): Promise<ModSubmission>;
    /**
     * Get review statistics
     */
    getReviewStats(): Promise<ModReviewStats>;
    /**
     * Get submission history for admin
     */
    getSubmissionHistory(limit?: number): Promise<ModSubmission[]>;
    /**
     * Search submissions
     */
    searchSubmissions(query: string, filters: {
        status?: string;
        author?: string;
        component?: string;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<ModSubmission[]>;
    /**
     * Remove submission from queue
     */
    private removeFromQueue;
    /**
     * Move submission to flagged queue
     */
    private moveToFlagged;
    /**
     * Notify admins about new submission
     */
    private notifyAdmins;
    /**
     * Notify author about review result
     */
    private notifyAuthor;
    /**
     * Initialize mock data for development
     */
    private initializeMockData;
}
/**
 * Initialize mod review service
 */
export declare const initializeModReviewService: () => ModReviewService;
