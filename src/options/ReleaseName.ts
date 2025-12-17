import { BaseOption, OptionContext } from './BaseOption';

/**
 * Release configuration interface
 */
interface ReleaseConfig {
    name: string;
    expiry: string; // ISO date string (YYYY-MM-DD)
}

/**
 * Option 7: Release Name/Number
 * A versioned identifier tied to release schedules with automatic expiry
 */
export class ReleaseName extends BaseOption {
    readonly id = 'releaseName';
    readonly name = 'Release Name';
    readonly description = 'Current active release name based on expiry dates';

    generate(context: OptionContext): string {
        const releases = this.getConfig<ReleaseConfig[]>('releases', []);
        const defaultRelease = this.getConfig<string>('defaultRelease', 'stable');
        
        // Get current UTC date (time set to start of day for comparison)
        const now = new Date();
        const currentDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        // Filter and sort active (non-expired) releases
        const activeReleases = releases
            .filter(release => {
                const expiryDate = this.parseDate(release.expiry);
                return expiryDate && expiryDate >= currentDate;
            })
            .sort((a, b) => {
                const dateA = this.parseDate(a.expiry)!;
                const dateB = this.parseDate(b.expiry)!;
                return dateA.getTime() - dateB.getTime();
            });

        // Return earliest non-expired release, or default
        if (activeReleases.length > 0) {
            return this.sanitize(activeReleases[0].name);
        }

        return this.sanitize(defaultRelease);
    }

    /**
     * Parse ISO date string to Date object
     */
    private parseDate(dateStr: string): Date | null {
        if (!dateStr) return null;
        
        const date = new Date(dateStr + 'T00:00:00Z');
        return isNaN(date.getTime()) ? null : date;
    }

    /**
     * Sanitize release name for CSS class compatibility
     */
    private sanitize(value: string): string {
        return value
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-_]/g, '');
    }

    /**
     * Get list of expired releases (useful for cleanup notifications)
     */
    getExpiredReleases(): ReleaseConfig[] {
        const releases = this.getConfig<ReleaseConfig[]>('releases', []);
        const now = new Date();
        const currentDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        return releases.filter(release => {
            const expiryDate = this.parseDate(release.expiry);
            return expiryDate && expiryDate < currentDate;
        });
    }

    /**
     * Get the currently active release info
     */
    getActiveRelease(): ReleaseConfig | null {
        const releases = this.getConfig<ReleaseConfig[]>('releases', []);
        const now = new Date();
        const currentDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        const activeReleases = releases
            .filter(release => {
                const expiryDate = this.parseDate(release.expiry);
                return expiryDate && expiryDate >= currentDate;
            })
            .sort((a, b) => {
                const dateA = this.parseDate(a.expiry)!;
                const dateB = this.parseDate(b.expiry)!;
                return dateA.getTime() - dateB.getTime();
            });

        return activeReleases.length > 0 ? activeReleases[0] : null;
    }
}

