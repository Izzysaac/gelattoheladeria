// Client-side hydration for RestaurantStatusBadge
// This component handles real-time status updates and client-side interactivity

import type { RestaurantSchedule, StatusThresholds, RestaurantStatusInfo } from '../../lib/types';
import { calculateRestaurantStatus, getStatusDisplayText, getStatusColor } from '../../lib/restaurantStatus';

class RestaurantStatusManager {
    private elements: Map<string, Element> = new Map();
    private intervals: Map<string, NodeJS.Timeout> = new Map();
    private schedules: Map<string, { schedule: RestaurantSchedule; thresholds: StatusThresholds }> = new Map();

    constructor() {
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    private init() {
        // Find all status badges
        const badges = document.querySelectorAll('.status-badge');
        
        badges.forEach(badge => {
            const badgeId = badge.getAttribute('id');
            if (!badgeId) return;

            // Get schedule data from data attributes (server-rendered)
            const scheduleData = badge.getAttribute('data-schedule');
            const thresholdsData = badge.getAttribute('data-thresholds');
            
            if (scheduleData) {
                try {
                    const schedule = JSON.parse(scheduleData);
                    const thresholds = thresholdsData ? JSON.parse(thresholdsData) : { closingSoon: 60, openingSoon: 60 };
                    
                    this.schedules.set(badgeId, { schedule, thresholds });
                    this.elements.set(badgeId, badge);
                    
                    // Set up real-time updates
                    this.setupRealTimeUpdates(badgeId);
                    
                    // Set up modal interactions
                    this.setupModalInteractions(badgeId);
                } catch (error) {
                    console.error('Error parsing restaurant schedule data:', error);
                }
            }
        });
    }

    private setupRealTimeUpdates(badgeId: string) {
        const { schedule, thresholds } = this.schedules.get(badgeId)!;
        const badge = this.elements.get(badgeId)!;

        // Update immediately
        this.updateBadge(badgeId);

        // Set up interval for updates (every minute)
        const interval = setInterval(() => {
            this.updateBadge(badgeId);
        }, 60000); // Update every minute

        this.intervals.set(badgeId, interval);

        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            const interval = this.intervals.get(badgeId);
            if (interval) {
                clearInterval(interval);
                this.intervals.delete(badgeId);
            }
        });
    }

    private updateBadge(badgeId: string) {
        const { schedule, thresholds } = this.schedules.get(badgeId)!;
        const badge = this.elements.get(badgeId)!;

        try {
            const statusInfo = calculateRestaurantStatus(schedule, thresholds);
            const statusText = getStatusDisplayText(statusInfo.status, statusInfo.nextChange);
            const statusColorClass = getStatusColor(statusInfo.status);

            // Update badge appearance
            badge.setAttribute('data-status', statusInfo.status);
            
            // Update CSS classes
            const colorClasses = [
                'text-green-600', 'bg-green-50', 'border-green-200',
                'text-red-600', 'bg-red-50', 'border-red-200',
                'text-orange-600', 'bg-orange-50', 'border-orange-200',
                'text-blue-600', 'bg-blue-50', 'border-blue-200',
                'text-gray-600', 'bg-gray-50', 'border-gray-200'
            ];

            colorClasses.forEach(cls => badge.classList.remove(cls));
            statusColorClass.split(' ').forEach(cls => badge.classList.add(cls));

            // Update status text
            const statusTextElement = badge.querySelector('.status-text');
            if (statusTextElement) {
                statusTextElement.textContent = statusText;
            }

            // Update status icon
            this.updateStatusIcon(badge, statusInfo.status);

            // Emit custom event for other components to listen
            badge.dispatchEvent(new CustomEvent('statusUpdate', {
                detail: { statusInfo, statusText }
            }));

        } catch (error) {
            console.error('Error updating restaurant status:', error);
        }
    }

    private updateStatusIcon(badge: Element, status: string) {
        const iconElement = badge.querySelector('.status-icon');
        if (!iconElement) return;

        let iconHTML = '';
        
        switch (status) {
            case 'open':
                iconHTML = `
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                `;
                break;
            case 'closed':
                iconHTML = `
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                `;
                break;
            case 'closingSoon':
            case 'openingSoon':
                iconHTML = `
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                    </svg>
                `;
                break;
        }

        iconElement.innerHTML = iconHTML;
    }

    private setupModalInteractions(badgeId: string) {
        const badge = this.elements.get(badgeId)!;
        const modalId = badge.getAttribute('aria-controls');
        const modal = document.getElementById(modalId!);
        
        if (!modal) return;

        // Open modal
        badge.addEventListener('click', () => {
            modal.classList.remove('hidden');
            badge.setAttribute('aria-expanded', 'true');
            
            // Focus management
            const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
            if (firstFocusable) {
                setTimeout(() => firstFocusable.focus(), 100);
            }

            // Update modal content with current status
            this.updateModalContent(modal, badgeId);
        });

        // Close modal handlers
        const closeButtons = modal.querySelectorAll('[data-close-modal]');
        closeButtons.forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeModal(modal, badge);
            });
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target === modal || target.classList.contains('modal-backdrop')) {
                this.closeModal(modal, badge);
            }
        });

        // Close on Escape key
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modal, badge);
            }
        });
    }

    private updateModalContent(modal: HTMLElement, badgeId: string) {
        const { schedule, thresholds } = this.schedules.get(badgeId)!;
        const statusInfo = calculateRestaurantStatus(schedule, thresholds);
        const statusText = getStatusDisplayText(statusInfo.status, statusInfo.nextChange);
        const statusColorClass = getStatusColor(statusInfo.status);

        // Update status summary in modal
        const statusSummary = modal.querySelector('.status-summary');
        if (statusSummary) {
            statusSummary.className = `status-summary inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium ${statusColorClass}`;
            
            const statusTextElement = statusSummary.querySelector('.status-text');
            if (statusTextElement) {
                statusTextElement.textContent = statusText;
            }

            // Update icon
            this.updateStatusIcon(statusSummary, statusInfo.status);
        }
    }

    private closeModal(modal: HTMLElement, badge: Element) {
        modal.classList.add('hidden');
        badge.setAttribute('aria-expanded', 'false');
        (badge as HTMLElement).focus();
    }

    // Public method to manually update a badge
    public updateBadgeStatus(badgeId: string) {
        if (this.elements.has(badgeId)) {
            this.updateBadge(badgeId);
        }
    }

    // Public method to add a new badge dynamically
    public addBadge(badgeId: string, schedule: RestaurantSchedule, thresholds: StatusThresholds) {
        const badge = document.getElementById(badgeId);
        if (!badge) return;

        this.schedules.set(badgeId, { schedule, thresholds });
        this.elements.set(badgeId, badge);
        
        this.setupRealTimeUpdates(badgeId);
        this.setupModalInteractions(badgeId);
    }

    // Cleanup method
    public cleanup() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();
        this.elements.clear();
        this.schedules.clear();
    }
}

// Initialize the manager
let restaurantStatusManager: RestaurantStatusManager;

// Auto-initialize when script loads
restaurantStatusManager = new RestaurantStatusManager();

// Export for manual control if needed
export { restaurantStatusManager };

// Also make it available globally for debugging
declare global {
    interface Window {
        restaurantStatusManager: RestaurantStatusManager;
    }
}

if (typeof window !== 'undefined') {
    window.restaurantStatusManager = restaurantStatusManager;
}
