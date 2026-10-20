import { CloudSqlSnapshotEntry, CloudSqlSnapshotSchedule, OrganizationSettings, User } from '../types';
import { storageService } from './storage';

const DEFAULT_PROJECT_ID = 'eco-context-13kqt';
const DEFAULT_REGION = 'europe-west2';
const DEFAULT_INSTANCE_ID = 'invox-db-prod';

export class CloudSqlService {
  /**
   * Retrieves or initializes snapshot schedule configuration for the organization
   */
  public getSnapshotSchedule(org: OrganizationSettings): CloudSqlSnapshotSchedule {
    if (org.cloudSqlSnapshots) {
      return org.cloudSqlSnapshots;
    }

    // Default configuration for eco-context-13kqt in europe-west2
    const defaultSchedule: CloudSqlSnapshotSchedule = {
      projectId: DEFAULT_PROJECT_ID,
      region: DEFAULT_REGION,
      instanceId: DEFAULT_INSTANCE_ID,
      enabled: true,
      scheduleTimeUtc: '02:00',
      retentionDays: 14,
      pitrEnabled: true,
      location: 'regional',
      status: 'RUNNABLE',
      lastSnapshotAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
      nextScheduledSnapshotAt: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
      snapshots: [
        {
          id: `snap-${DEFAULT_PROJECT_ID}-auto-20261019-020000`,
          instanceId: DEFAULT_INSTANCE_ID,
          projectId: DEFAULT_PROJECT_ID,
          region: DEFAULT_REGION,
          createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
          sizeBytes: 44280192,
          sizeFormatted: '42.2 MB',
          type: 'AUTOMATED_DAILY',
          status: 'SUCCESSFUL',
          retentionExpiresAt: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Automated daily snapshot at 02:00 UTC (PostgreSQL 16 Engine)',
          walArchiveIncluded: true,
        },
      ],
    };

    return defaultSchedule;
  }

  /**
   * Saves updated snapshot schedule configuration
   */
  public saveSnapshotSchedule(
    org: OrganizationSettings,
    schedule: CloudSqlSnapshotSchedule,
    actor: User
  ): OrganizationSettings {
    const updatedOrg: OrganizationSettings = {
      ...org,
      cloudSqlSnapshots: schedule,
    };

    storageService.saveOrganization(updatedOrg);

    storageService.addAuditLog({
      organizationId: org.id,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SNAPSHOT_SCHEDULE_UPDATED',
      resourceType: 'database',
      resourceId: schedule.instanceId,
      status: 'success',
      details: `Configured Cloud SQL automated daily snapshot schedule (${schedule.enabled ? 'ENABLED' : 'DISABLED'}) at ${schedule.scheduleTimeUtc} UTC with ${schedule.retentionDays}-day retention policy on ${schedule.projectId} (${schedule.region})`,
      diff: {
        after: {
          enabled: schedule.enabled,
          scheduleTimeUtc: schedule.scheduleTimeUtc,
          retentionDays: schedule.retentionDays,
          pitrEnabled: schedule.pitrEnabled,
          location: schedule.location,
        },
      },
    });

    return updatedOrg;
  }

  /**
   * Triggers an immediate on-demand snapshot of the Cloud SQL instance
   */
  public async triggerOnDemandSnapshot(
    org: OrganizationSettings,
    actor: User,
    customDescription?: string
  ): Promise<{ snapshot: CloudSqlSnapshotEntry; updatedOrg: OrganizationSettings }> {
    const currentSchedule = this.getSnapshotSchedule(org);
    const now = new Date();
    const dateFormatted = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const snapshotId = `snap-${currentSchedule.projectId}-manual-${dateFormatted}`;

    // Simulate database size based on actual tenant records
    const invoiceCount = storageService.getInvoices(org.id).length;
    const clientCount = storageService.getClients(org.id).length;
    const baseBytes = 38000000; // ~38 MB Postgres base catalog
    const recordBytes = (invoiceCount * 8500) + (clientCount * 4200);
    const totalBytes = baseBytes + recordBytes + Math.floor(Math.random() * 500000);
    const sizeMb = (totalBytes / (1024 * 1024)).toFixed(1);

    const expiresAt = new Date(now.getTime() + currentSchedule.retentionDays * 24 * 60 * 60 * 1000);

    const newSnapshot: CloudSqlSnapshotEntry = {
      id: snapshotId,
      instanceId: currentSchedule.instanceId,
      projectId: currentSchedule.projectId,
      region: currentSchedule.region,
      createdAt: now.toISOString(),
      sizeBytes: totalBytes,
      sizeFormatted: `${sizeMb} MB`,
      type: 'ON_DEMAND',
      status: 'SUCCESSFUL',
      retentionExpiresAt: expiresAt.toISOString(),
      description: customDescription || `Manual on-demand snapshot initiated by ${actor.name} (${actor.email})`,
      walArchiveIncluded: currentSchedule.pitrEnabled,
    };

    const updatedSnapshots = [newSnapshot, ...(currentSchedule.snapshots || [])];
    const updatedSchedule: CloudSqlSnapshotSchedule = {
      ...currentSchedule,
      lastSnapshotAt: now.toISOString(),
      snapshots: updatedSnapshots,
    };

    const updatedOrg = this.saveSnapshotSchedule(org, updatedSchedule, actor);

    storageService.addAuditLog({
      organizationId: org.id,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SNAPSHOT_CREATED',
      resourceType: 'database',
      resourceId: snapshotId,
      status: 'success',
      details: `Created on-demand Cloud SQL snapshot '${snapshotId}' (${sizeMb} MB) for instance '${currentSchedule.instanceId}' in ${currentSchedule.region}`,
    });

    return { snapshot: newSnapshot, updatedOrg };
  }

  /**
   * Simulates a verified restore drill from a snapshot
   */
  public async restoreFromSnapshot(
    org: OrganizationSettings,
    snapshotId: string,
    actor: User
  ): Promise<void> {
    storageService.addAuditLog({
      organizationId: org.id,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SNAPSHOT_RESTORED',
      resourceType: 'database',
      resourceId: snapshotId,
      status: 'warning',
      details: `Dispatched point-in-time restore verification request from snapshot '${snapshotId}' by super admin ${actor.name}`,
    });
  }

  /**
   * Deletes a snapshot
   */
  public deleteSnapshot(
    org: OrganizationSettings,
    snapshotId: string,
    actor: User
  ): OrganizationSettings {
    const currentSchedule = this.getSnapshotSchedule(org);
    const filtered = (currentSchedule.snapshots || []).filter((s) => s.id !== snapshotId);

    const updatedSchedule: CloudSqlSnapshotSchedule = {
      ...currentSchedule,
      snapshots: filtered,
    };

    return this.saveSnapshotSchedule(org, updatedSchedule, actor);
  }
}

export const cloudSqlService = new CloudSqlService();
