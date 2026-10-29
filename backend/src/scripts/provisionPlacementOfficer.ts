import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { User } from '../models/user.model';
import { Institution } from '../models/institution.model';
import { auditLogService } from '../services/auditLog.service';

/**
 * CLI Tool to bootstrap or provision a Placement Officer account.
 * Usage:
 *   npx ts-node src/scripts/provisionPlacementOfficer.ts <email> <password> <name> [institutionCode] [department]
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error(
      'Usage: npm run provision:officer -- <email> <password> <name> [institutionCode] [department]'
    );
    process.exit(1);
  }

  const [email, password, name, institutionCode = 'AIT', department = ''] = args;

  try {
    await connectDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    let existing = await User.findOne({ email: normalizedEmail });

    // Find or create institution
    let institution = await Institution.findOne({ code: institutionCode.toUpperCase().trim() });
    if (!institution) {
      institution = await Institution.create({
        name: `${institutionCode.toUpperCase()} Institute of Technology`,
        code: institutionCode.toUpperCase().trim(),
        domain: `${institutionCode.toLowerCase()}.edu`,
        isActive: true,
      });
      console.log(`[Provisioning] Created new institution: ${institution.name} (${institution.code})`);
    }

    if (existing) {
      existing.role = 'placement_officer';
      existing.status = 'active';
      existing.password = password;
      existing.institutionId = institution._id;
      if (department) existing.assignedDepartment = department.trim();
      await existing.save();
      console.log(`[Provisioning] Updated existing user ${normalizedEmail} to placement_officer role.`);
    } else {
      existing = new User({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: 'placement_officer',
        status: 'active',
        institutionId: institution._id,
        assignedDepartment: department ? department.trim() : undefined,
        lastLoginAt: new Date(),
      });
      await existing.save();
      console.log(
        `[Provisioning] Successfully provisioned Placement Officer: ${normalizedEmail} (${name}) for ${institution.name}`
      );
    }

    await auditLogService.logEvent({
      eventType: 'placement_officer_provisioned',
      actor: {
        id: 'system-cli',
        email: 'cli@careerpilot.ai',
        name: 'CLI Bootstrap',
        role: 'admin',
      },
      action: `Provisioned Placement Officer ${normalizedEmail} via CLI tool`,
      targetId: existing._id.toString(),
      targetType: 'User',
      metadata: { institutionCode: institution.code, email: normalizedEmail },
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Provisioning Error]', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();

