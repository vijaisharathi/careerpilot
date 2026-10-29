import { JobOpportunity, IJobOpportunity } from '../../models/jobOpportunity.model';
import { SEED_JOB_OPPORTUNITIES, SeedJobOpportunity } from '../../config/jobCatalog.data';
import { sanitizeSafeUrl } from '../../utils/urlValidator';
import { logger } from '../../utils/logger';

export interface IJobSourceProvider {
  readonly providerName: string;
  readonly isLiveSource: boolean;
  fetchOpportunities(): Promise<Array<Partial<IJobOpportunity>>>;
}

/**
 * Local Seed Provider:
 * Supplies realistic, verified-schema demonstration listings for campus placement training.
 * Explicitly marks opportunities with isVerifiedVacancy: false and demoDisclaimer.
 */
export class LocalSeedJobProvider implements IJobSourceProvider {
  public readonly providerName = 'Local Demonstration Seed Catalog';
  public readonly isLiveSource = false;

  public async fetchOpportunities(): Promise<Array<Partial<IJobOpportunity>>> {
    return SEED_JOB_OPPORTUNITIES.map((job: SeedJobOpportunity) => ({
      ...job,
      applicationUrl: sanitizeSafeUrl(job.applicationUrl),
      dataSourceType: 'seed_demonstration',
      isVerifiedVacancy: false,
    }));
  }
}

/**
 * Job Source Manager:
 * Coordinates opportunity providers and handles database synchronization.
 * Serves as the extension point for live verified third-party API adapters.
 */
export class JobSourceManager {
  private providers: IJobSourceProvider[] = [new LocalSeedJobProvider()];

  /**
   * Registers an external authorized job API provider (e.g., Adzuna, Handshake partner feed)
   */
  public registerProvider(provider: IJobSourceProvider): void {
    this.providers.push(provider);
    logger.info(`[JobSourceManager] Registered job provider: ${provider.providerName}`);
  }

  /**
   * Seeds demo opportunities into MongoDB if the collection is currently empty
   */
  public async seedIfEmpty(): Promise<number> {
    const existingCount = await JobOpportunity.countDocuments();
    if (existingCount > 0) {
      return existingCount;
    }

    logger.info('[JobSourceManager] Job collection is empty. Seeding initial demonstration listings...');
    return this.syncFromProvider(new LocalSeedJobProvider());
  }

  /**
   * Forces a refresh from a specific or all registered providers
   */
  public async syncFromProvider(provider: IJobSourceProvider): Promise<number> {
    const opportunities = await provider.fetchOpportunities();
    let syncedCount = 0;

    for (const item of opportunities) {
      if (!item.slug || !item.title) continue;

      await JobOpportunity.findOneAndUpdate(
        { slug: item.slug },
        { $set: item },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      syncedCount++;
    }

    logger.info(
      `[JobSourceManager] Synchronized ${syncedCount} opportunities from ${provider.providerName}`
    );
    return syncedCount;
  }
}

export const jobSourceManager = new JobSourceManager();

