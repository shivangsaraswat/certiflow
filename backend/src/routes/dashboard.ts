
import { Router } from 'express';
import { db } from '../lib/db.js';
import { certificates, templates, groups, signatures, users } from '../db/schema.js';
import { eq, sql, count } from 'drizzle-orm';

const router = Router();

// Get dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Parallelize queries for performance
        const [
            certsCount,
            templatesCount,
            groupsCount,
            signaturesCount,
            // Maybe recent certificates?
            recentCerts
        ] = await Promise.all([
            // Count certificates
            db.select({ count: count() })
                .from(certificates)
                .where(eq(certificates.userId, userId)),

            // Count templates
            db.select({ count: count() })
                .from(templates)
                .where(eq(templates.userId, userId)),

            // Count groups
            db.select({ count: count() })
                .from(groups)
                .where(eq(groups.userId, userId)),

            // Count signatures
            db.select({ count: count() })
                .from(signatures)
                .where(eq(signatures.userId, userId)),

            // Get recent 5 certificates for activity feed (optional, but good for dashboard)
            db.select()
                .from(certificates)
                .where(eq(certificates.userId, userId))
                .orderBy(sql`${certificates.createdAt} DESC`)
                .limit(5)
        ]);

        res.json({
            success: true,
            data: {
                certificates: certsCount[0]?.count || 0,
                templates: templatesCount[0]?.count || 0,
                groups: groupsCount[0]?.count || 0,
                signatures: signaturesCount[0]?.count || 0,
                recentActivity: recentCerts
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
    }
});

export default router;
