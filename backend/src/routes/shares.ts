/**
 * Group Shares API Routes
 * Invitation and collaborative access management
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { db } from '../lib/db.js';
import { groupShares, groups, users } from '../db/schema.js';
import { eq, and, or } from 'drizzle-orm';

const router = Router({ mergeParams: true });

// =============================================================================
// Helper: Generate secure invite token
// =============================================================================
function generateInviteToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

// =============================================================================
// Helper: Check if user has access to group (owner or shared)
// =============================================================================
export async function hasGroupAccess(groupId: string, userId: string): Promise<{ hasAccess: boolean; isOwner: boolean }> {
    // Check if owner
    const group = await db
        .select({ userId: groups.userId })
        .from(groups)
        .where(eq(groups.id, groupId));

    if (group.length === 0) {
        return { hasAccess: false, isOwner: false };
    }

    if (group[0].userId === userId) {
        return { hasAccess: true, isOwner: true };
    }

    // Check if shared
    const share = await db
        .select()
        .from(groupShares)
        .where(
            and(
                eq(groupShares.groupId, groupId),
                eq(groupShares.inviteeId, userId),
                eq(groupShares.status, 'accepted')
            )
        );

    return { hasAccess: share.length > 0, isOwner: false };
}

// =============================================================================
// POST /api/groups/:groupId/shares/invite - Send invitation
// =============================================================================
router.post('/invite', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const { groupId } = req.params as { groupId: string };
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        // Verify user owns this group
        const group = await db
            .select({ id: groups.id, name: groups.name, userId: groups.userId })
            .from(groups)
            .where(eq(groups.id, groupId));

        if (group.length === 0) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        if (group[0].userId !== userId) {
            return res.status(403).json({ success: false, error: 'Only the group owner can invite users' });
        }

        // Check if email is the owner's email
        const inviter = await db
            .select({ email: users.email, name: users.name })
            .from(users)
            .where(eq(users.id, userId));

        if (inviter[0]?.email === email) {
            return res.status(400).json({ success: false, error: 'You cannot invite yourself' });
        }

        // Check if already invited
        const existingShare = await db
            .select()
            .from(groupShares)
            .where(
                and(
                    eq(groupShares.groupId, groupId),
                    eq(groupShares.inviteeEmail, email),
                    or(
                        eq(groupShares.status, 'pending'),
                        eq(groupShares.status, 'accepted')
                    )
                )
            );

        if (existingShare.length > 0) {
            return res.status(400).json({ success: false, error: 'User is already invited or has access' });
        }

        // Check if invitee exists in system
        const invitee = await db
            .select({ id: users.id, email: users.email, name: users.name })
            .from(users)
            .where(eq(users.email, email));

        // Reject invitation if user is not registered on the platform
        if (!invitee[0]) {
            return res.status(400).json({
                success: false,
                error: `The user "${email}" is not registered on this platform. They must create an account first before they can be invited to collaborate on groups.`
            });
        }

        // Create share record
        const shareId = uuidv4();
        const inviteToken = generateInviteToken();

        await db.insert(groupShares).values({
            id: shareId,
            groupId,
            inviterId: userId,
            inviteeId: invitee[0].id,
            inviteeEmail: email,
            status: 'pending',
            inviteToken,
            createdAt: new Date(),
        });

        // TODO: Send invitation email
        // For now, return the invite token (frontend can show it or send email)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const inviteLink = `${frontendUrl}/accept-invite/${inviteToken}`;

        res.json({
            success: true,
            data: {
                shareId,
                inviteLink,
                inviteeExists: !!invitee[0],
            },
        });
    } catch (error) {
        console.error('Error inviting user:', error);
        res.status(500).json({ success: false, error: 'Failed to send invitation' });
    }
});

// =============================================================================
// GET /api/groups/:groupId/shares - List all shares for a group
// =============================================================================
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const { groupId } = req.params as { groupId: string };

        // Verify user owns this group
        const group = await db
            .select({ userId: groups.userId })
            .from(groups)
            .where(eq(groups.id, groupId));

        if (group.length === 0) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        if (group[0].userId !== userId) {
            return res.status(403).json({ success: false, error: 'Only the group owner can view shares' });
        }

        // Get all shares with user info
        const shares = await db
            .select({
                id: groupShares.id,
                inviteeEmail: groupShares.inviteeEmail,
                inviteeId: groupShares.inviteeId,
                status: groupShares.status,
                createdAt: groupShares.createdAt,
                acceptedAt: groupShares.acceptedAt,
            })
            .from(groupShares)
            .where(
                and(
                    eq(groupShares.groupId, groupId),
                    or(
                        eq(groupShares.status, 'pending'),
                        eq(groupShares.status, 'accepted')
                    )
                )
            );

        // Fetch invitee names
        const sharesWithNames = await Promise.all(
            shares.map(async (share) => {
                let inviteeName = null;
                if (share.inviteeId) {
                    const user = await db
                        .select({ name: users.name })
                        .from(users)
                        .where(eq(users.id, share.inviteeId));
                    inviteeName = user[0]?.name || null;
                }
                return {
                    ...share,
                    inviteeName,
                };
            })
        );

        res.json({ success: true, data: sharesWithNames });
    } catch (error) {
        console.error('Error fetching shares:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch shares' });
    }
});

// =============================================================================
// DELETE /api/groups/:groupId/shares/:shareId - Revoke a share
// =============================================================================
router.delete('/:shareId', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const { groupId, shareId } = req.params as { groupId: string; shareId: string };

        // Verify user owns this group
        const group = await db
            .select({ userId: groups.userId })
            .from(groups)
            .where(eq(groups.id, groupId));

        if (group.length === 0) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        if (group[0].userId !== userId) {
            return res.status(403).json({ success: false, error: 'Only the group owner can revoke access' });
        }

        // Update share status to revoked
        await db
            .update(groupShares)
            .set({
                status: 'revoked',
                revokedAt: new Date(),
            })
            .where(
                and(
                    eq(groupShares.id, shareId),
                    eq(groupShares.groupId, groupId)
                )
            );

        res.json({ success: true });
    } catch (error) {
        console.error('Error revoking share:', error);
        res.status(500).json({ success: false, error: 'Failed to revoke access' });
    }
});

// =============================================================================
// POST /api/shares/accept/:token - Accept invitation via token
// =============================================================================
router.post('/accept/:token', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const { token } = req.params;

        // Find the share by token
        const share = await db
            .select()
            .from(groupShares)
            .where(eq(groupShares.inviteToken, token));

        if (share.length === 0) {
            return res.status(404).json({ success: false, error: 'Invalid or expired invitation' });
        }

        const shareRecord = share[0];

        if (shareRecord.status !== 'pending') {
            return res.status(400).json({ success: false, error: 'Invitation has already been used or revoked' });
        }

        // Verify the accepting user's email matches the invitation
        const acceptingUser = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, userId));

        if (acceptingUser[0]?.email !== shareRecord.inviteeEmail) {
            return res.status(403).json({
                success: false,
                error: 'This invitation was sent to a different email address',
            });
        }

        // Accept the invitation
        await db
            .update(groupShares)
            .set({
                status: 'accepted',
                inviteeId: userId,
                acceptedAt: new Date(),
            })
            .where(eq(groupShares.id, shareRecord.id));

        // Get group info for response
        const group = await db
            .select({ id: groups.id, name: groups.name })
            .from(groups)
            .where(eq(groups.id, shareRecord.groupId));

        res.json({
            success: true,
            data: {
                groupId: shareRecord.groupId,
                groupName: group[0]?.name,
            },
        });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({ success: false, error: 'Failed to accept invitation' });
    }
});

// =============================================================================
// GET /api/shares/pending - Get pending invitations for current user
// =============================================================================
router.get('/pending', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Get user's email
        const user = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, userId));

        if (user.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Find pending invitations for this email
        const pendingInvites = await db
            .select({
                id: groupShares.id,
                groupId: groupShares.groupId,
                inviteToken: groupShares.inviteToken,
                createdAt: groupShares.createdAt,
            })
            .from(groupShares)
            .where(
                and(
                    eq(groupShares.inviteeEmail, user[0].email),
                    eq(groupShares.status, 'pending')
                )
            );

        // Get group and inviter info
        const invitesWithDetails = await Promise.all(
            pendingInvites.map(async (invite) => {
                const groupInfo = await db
                    .select({ name: groups.name })
                    .from(groups)
                    .where(eq(groups.id, invite.groupId));

                const share = await db
                    .select({ inviterId: groupShares.inviterId })
                    .from(groupShares)
                    .where(eq(groupShares.id, invite.id));

                let inviterName = null;
                if (share[0]?.inviterId) {
                    const inviter = await db
                        .select({ name: users.name })
                        .from(users)
                        .where(eq(users.id, share[0].inviterId));
                    inviterName = inviter[0]?.name;
                }

                return {
                    ...invite,
                    groupName: groupInfo[0]?.name,
                    inviterName,
                };
            })
        );

        res.json({ success: true, data: invitesWithDetails });
    } catch (error) {
        console.error('Error fetching pending invitations:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch pending invitations' });
    }
});

// =============================================================================
// GET /api/shares/info/:token - Get invitation info by token (public, for accept page)
// =============================================================================
router.get('/info/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const share = await db
            .select({
                id: groupShares.id,
                groupId: groupShares.groupId,
                inviterId: groupShares.inviterId,
                inviteeEmail: groupShares.inviteeEmail,
                status: groupShares.status,
            })
            .from(groupShares)
            .where(eq(groupShares.inviteToken, token));

        if (share.length === 0) {
            return res.status(404).json({ success: false, error: 'Invalid invitation' });
        }

        const shareRecord = share[0];

        // Get group and inviter info
        const group = await db
            .select({ name: groups.name })
            .from(groups)
            .where(eq(groups.id, shareRecord.groupId));

        const inviter = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, shareRecord.inviterId));

        res.json({
            success: true,
            data: {
                groupName: group[0]?.name,
                inviterName: inviter[0]?.name,
                inviteeEmail: shareRecord.inviteeEmail,
                status: shareRecord.status,
            },
        });
    } catch (error) {
        console.error('Error fetching invitation info:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch invitation info' });
    }
});

export default router;
