import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Organization, OrganizationPlan, OrganizationStatus } from '../models/Organization.entity';
import { Subscription, SubscriptionStatus } from '../models/Subscription.entity';
import { User, UserRole, UserTier } from '../models/User.entity';
import { v4 as uuidv4 } from 'uuid';

interface CreateOrganizationDTO {
  name: string;
  description?: string;
  industry: string;
  company_size: string;
  contact_email: string;
  phone_number?: string;
  address?: any;
  plan: OrganizationPlan;
  manager_user: {
    username: string;
    email: string;
    password: string;
    full_name: string;
  };
}

interface OrganizationLimits {
  [OrganizationPlan.STARTER]: { users: 25; managers: 1; price: 2999 };
  [OrganizationPlan.PROFESSIONAL]: { users: 100; managers: 3; price: 9999 };
  [OrganizationPlan.ENTERPRISE]: { users: 500; managers: 10; price: 24999 };
  [OrganizationPlan.UNLIMITED]: { users: -1; managers: -1; price: 49999 };
}

export class OrganizationService {
  private organizationRepository: Repository<Organization>;
  private subscriptionRepository: Repository<Subscription>;
  private userRepository: Repository<User>;

  private readonly planLimits: OrganizationLimits = {
    [OrganizationPlan.STARTER]: { users: 25, managers: 1, price: 2999 },
    [OrganizationPlan.PROFESSIONAL]: { users: 100, managers: 3, price: 9999 },
    [OrganizationPlan.ENTERPRISE]: { users: 500, managers: 10, price: 24999 },
    [OrganizationPlan.UNLIMITED]: { users: -1, managers: -1, price: 49999 }
  };

  constructor() {
    this.organizationRepository = AppDataSource.getRepository(Organization);
    this.subscriptionRepository = AppDataSource.getRepository(Subscription);
    this.userRepository = AppDataSource.getRepository(User);
  }

  async createOrganization(data: CreateOrganizationDTO): Promise<{
    organization: Organization;
    manager: User;
    subscription: Subscription;
  }> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate unique organization code
      const orgCode = await this.generateOrgCode(data.name);
      const planLimits = this.planLimits[data.plan];

      // Create organization
      const organization = this.organizationRepository.create({
        id: uuidv4(),
        org_code: orgCode,
        name: data.name,
        description: data.description,
        industry: data.industry,
        company_size: data.company_size,
        contact_email: data.contact_email,
        phone_number: data.phone_number,
        address: data.address,
        plan: data.plan,
        status: OrganizationStatus.TRIAL,
        user_limit: planLimits.users,
        manager_limit: planLimits.managers,
        current_users: 0,
        current_managers: 1,
        trial_start_date: new Date(),
        trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        features_enabled: this.getDefaultFeatures(data.plan),
        settings: this.getDefaultSettings()
      });

      const savedOrg = await queryRunner.manager.save(organization);

      // Create organization manager
      const hashedPassword = await import('bcryptjs').then((bcrypt) =>
        bcrypt.hash(data.manager_user.password, 10)
      );

      const manager = this.userRepository.create({
        id: uuidv4(),
        username: data.manager_user.username,
        email: data.manager_user.email,
        password: hashedPassword,
        full_name: data.manager_user.full_name,
        role: UserRole.ORGANIZATION_MANAGER,
        tier: UserTier.MANAGER,
        organization_id: savedOrg.id,
        is_organization_owner: true,
        is_verified: true,
        is_active: true
      });

      const savedManager = await queryRunner.manager.save(manager);

      // Create subscription
      const subscription = this.subscriptionRepository.create({
        id: uuidv4(),
        subscription_id: this.generateSubscriptionId(),
        organization_id: savedOrg.id,
        plan: data.plan,
        status: SubscriptionStatus.TRIALING,
        user_limit: planLimits.users,
        manager_limit: planLimits.managers,
        price_per_user: this.calculatePricePerUser(data.plan),
        base_price: planLimits.price,
        total_amount: planLimits.price,
        start_date: new Date(),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        features: this.getSubscriptionFeatures(data.plan),
        usage_metrics: {
          active_users: 1,
          certificates_generated: 0,
          payroll_cycles_processed: 0,
          api_calls_month: 0,
          storage_used_mb: 0
        },
        created_by_id: savedManager.id
      });

      const savedSubscription = await queryRunner.manager.save(subscription);

      await queryRunner.commitTransaction();

      return {
        organization: savedOrg,
        manager: savedManager,
        subscription: savedSubscription
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async generateOrgCode(orgName: string): Promise<string> {
    const baseCode = orgName
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 6)
      .toUpperCase();

    let counter = 1;
    let orgCode = baseCode;

    while (await this.organizationRepository.findOne({ where: { org_code: orgCode } })) {
      orgCode = `${baseCode}${counter}`;
      counter++;
    }

    return orgCode;
  }

  private generateSubscriptionId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `SUB-${timestamp}-${randomStr}`.toUpperCase();
  }

  private calculatePricePerUser(plan: OrganizationPlan): number {
    switch (plan) {
      case OrganizationPlan.STARTER:
        return 120; // ₹120 per user
      case OrganizationPlan.PROFESSIONAL:
        return 100; // ₹100 per user
      case OrganizationPlan.ENTERPRISE:
        return 80; // ₹80 per user
      case OrganizationPlan.UNLIMITED:
        return 0; // Fixed price
      default:
        return 120;
    }
  }

  private getDefaultFeatures(plan: OrganizationPlan) {
    const features: {
      hr_management: boolean;
      payroll_processing: boolean;
      certificate_automation: boolean;
      advanced_analytics: boolean;
      api_access: boolean;
      custom_branding: boolean;
      sso_integration: boolean;
      bulk_operations: boolean;
    } = {
      hr_management: true,
      payroll_processing: false,
      certificate_automation: true,
      advanced_analytics: false,
      api_access: false,
      custom_branding: false,
      sso_integration: false,
      bulk_operations: false
    };

    switch (plan) {
      case OrganizationPlan.PROFESSIONAL:
        return { ...features, payroll_processing: true, advanced_analytics: true };
      case OrganizationPlan.ENTERPRISE:
        return {
          ...features,
          payroll_processing: true,
          advanced_analytics: true,
          api_access: true,
          custom_branding: true,
          bulk_operations: true
        };
      case OrganizationPlan.UNLIMITED:
        return {
          hr_management: true,
          payroll_processing: true,
          certificate_automation: true,
          advanced_analytics: true,
          api_access: true,
          custom_branding: true,
          sso_integration: true,
          bulk_operations: true
        };
      default:
        return features;
    }
  }

  private getSubscriptionFeatures(plan: OrganizationPlan) {
    return {
      ...this.getDefaultFeatures(plan),
      priority_support: plan !== OrganizationPlan.STARTER,
      data_export: plan !== OrganizationPlan.STARTER
    };
  }

  private getDefaultSettings() {
    return {
      allow_self_registration: false,
      require_email_verification: true,
      password_policy: {
        min_length: 8,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_symbols: false
      },
      session_timeout: 7 * 24 * 60 * 60 * 1000, // 7 days
      max_login_attempts: 5
    };
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    return await this.organizationRepository.findOne({
      where: { id },
      relations: ['users', 'subscriptions']
    });
  }

  async getOrganizationByCode(orgCode: string): Promise<Organization | null> {
    return await this.organizationRepository.findOne({
      where: { org_code: orgCode },
      relations: ['users', 'subscriptions']
    });
  }

  async checkUserLimit(organizationId: string): Promise<{
    canAddUser: boolean;
    currentUsers: number;
    userLimit: number;
    remainingSlots: number;
  }> {
    const organization = await this.getOrganizationById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const currentUsers = await this.userRepository.count({
      where: { organization_id: organizationId, is_active: true }
    });

    const canAddUser = organization.user_limit === -1 || currentUsers < organization.user_limit;
    const remainingSlots =
      organization.user_limit === -1 ? -1 : Math.max(0, organization.user_limit - currentUsers);

    return {
      canAddUser,
      currentUsers,
      userLimit: organization.user_limit,
      remainingSlots
    };
  }

  async addUserToOrganization(
    organizationId: string,
    userData: {
      username: string;
      email: string;
      password: string;
      full_name: string;
      role?: UserRole;
    },
    invitedBy: string
  ): Promise<User> {
    // Check user limits
    const limitCheck = await this.checkUserLimit(organizationId);
    if (!limitCheck.canAddUser) {
      throw new Error('Organization has reached its user limit. Please upgrade your plan.');
    }

    const organization = await this.getOrganizationById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const hashedPassword = await import('bcryptjs').then((bcrypt) =>
      bcrypt.hash(userData.password, 10)
    );

    const user = this.userRepository.create({
      id: uuidv4(),
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      full_name: userData.full_name,
      role: userData.role || UserRole.USER,
      tier: userData.role === UserRole.ORGANIZATION_MANAGER ? UserTier.MANAGER : UserTier.USER,
      organization_id: organizationId,
      invited_by_id: invitedBy,
      invitation_accepted_at: new Date(),
      is_verified: true,
      is_active: true
    });

    const savedUser = await this.userRepository.save(user);

    // Update organization user count
    await this.updateOrganizationUserCount(organizationId);

    return savedUser;
  }

  async updateOrganizationUserCount(organizationId: string): Promise<void> {
    const currentUsers = await this.userRepository.count({
      where: { organization_id: organizationId, is_active: true }
    });

    const currentManagers = await this.userRepository.count({
      where: {
        organization_id: organizationId,
        is_active: true,
        tier: UserTier.MANAGER
      }
    });

    await this.organizationRepository.update(organizationId, {
      current_users: currentUsers,
      current_managers: currentManagers
    });
  }

  async getOrganizationUsers(organizationId: string): Promise<User[]> {
    return await this.userRepository.find({
      where: { organization_id: organizationId },
      order: { created_at: 'DESC' }
    });
  }

  async getOrganizationStats(organizationId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    managers: number;
    userLimit: number;
    utilizationPercentage: number;
    subscriptionStatus: string;
    daysUntilExpiry: number;
  }> {
    const organization = await this.getOrganizationById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const totalUsers = await this.userRepository.count({
      where: { organization_id: organizationId }
    });

    const activeUsers = await this.userRepository.count({
      where: { organization_id: organizationId, is_active: true }
    });

    const managers = await this.userRepository.count({
      where: {
        organization_id: organizationId,
        tier: UserTier.MANAGER,
        is_active: true
      }
    });

    const activeSubscription = await this.subscriptionRepository.findOne({
      where: { organization_id: organizationId, status: SubscriptionStatus.ACTIVE },
      order: { created_at: 'DESC' }
    });

    const utilizationPercentage =
      organization.user_limit === -1
        ? 0
        : Math.round((activeUsers / organization.user_limit) * 100);

    const daysUntilExpiry = activeSubscription
      ? Math.ceil(
          (new Date(activeSubscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    return {
      totalUsers,
      activeUsers,
      managers,
      userLimit: organization.user_limit,
      utilizationPercentage,
      subscriptionStatus: organization.status,
      daysUntilExpiry
    };
  }

  async upgradePlan(
    organizationId: string,
    newPlan: OrganizationPlan,
    billingCycle: 'monthly' | 'quarterly' | 'annually' = 'monthly'
  ): Promise<Subscription> {
    const organization = await this.getOrganizationById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const planLimits = this.planLimits[newPlan];

    // Check if organization can downgrade (if current users exceed new limit)
    if (planLimits.users !== -1 && organization.current_users > planLimits.users) {
      throw new Error(
        `Cannot downgrade: You have ${organization.current_users} users but the ${newPlan} plan only allows ${planLimits.users} users.`
      );
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update organization
      organization.plan = newPlan;
      organization.user_limit = planLimits.users;
      organization.manager_limit = planLimits.managers;
      organization.features_enabled = this.getDefaultFeatures(newPlan);
      organization.status = OrganizationStatus.ACTIVE;

      await queryRunner.manager.save(organization);

      // Create new subscription
      const subscription = this.subscriptionRepository.create({
        id: uuidv4(),
        subscription_id: this.generateSubscriptionId(),
        organization_id: organizationId,
        plan: newPlan,
        status: SubscriptionStatus.ACTIVE,
        user_limit: planLimits.users,
        manager_limit: planLimits.managers,
        price_per_user: this.calculatePricePerUser(newPlan),
        base_price: planLimits.price,
        total_amount: this.calculateTotalPrice(newPlan, organization.current_users, billingCycle),
        start_date: new Date(),
        end_date: this.calculateEndDate(billingCycle),
        features: this.getSubscriptionFeatures(newPlan),
        created_by_id: organization.users[0].id // Organization owner
      });

      const savedSubscription = await queryRunner.manager.save(subscription);

      await queryRunner.commitTransaction();
      return savedSubscription;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private calculateTotalPrice(
    plan: OrganizationPlan,
    userCount: number,
    billingCycle: string
  ): number {
    const basePrice = this.planLimits[plan].price;
    const pricePerUser = this.calculatePricePerUser(plan);

    const totalMonthly = basePrice + pricePerUser * userCount;

    switch (billingCycle) {
      case 'quarterly':
        return totalMonthly * 3 * 0.95; // 5% discount
      case 'annually':
        return totalMonthly * 12 * 0.85; // 15% discount
      default:
        return totalMonthly;
    }
  }

  private calculateEndDate(billingCycle: string): Date {
    const now = new Date();
    switch (billingCycle) {
      case 'quarterly':
        return new Date(now.getTime() + 3 * 30 * 24 * 60 * 60 * 1000);
      case 'annually':
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      default:
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }
  }

  async enforceUserLimits(organizationId: string): Promise<void> {
    const organization = await this.getOrganizationById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    if (organization.status !== OrganizationStatus.ACTIVE) {
      // Suspend all users in inactive organizations
      await this.userRepository.update({ organization_id: organizationId }, { is_active: false });
    }
  }

  async getOrganizationPermissions(userId: string): Promise<{
    canManageUsers: boolean;
    canManagePayroll: boolean;
    canManageCertificates: boolean;
    canViewAnalytics: boolean;
    canManageOrganization: boolean;
    canAccessAPI: boolean;
    features: any;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization']
    });

    if (!user || !user.organization) {
      throw new Error('User or organization not found');
    }

    const isManager = user.tier === UserTier.MANAGER;
    const isPlatformAdmin = user.tier === UserTier.PLATFORM;
    const features = user.organization.features_enabled;

    return {
      canManageUsers: isManager || isPlatformAdmin,
      canManagePayroll: (isManager && features.payroll_processing) || isPlatformAdmin,
      canManageCertificates: (isManager && features.certificate_automation) || isPlatformAdmin,
      canViewAnalytics: (isManager && features.advanced_analytics) || isPlatformAdmin,
      canManageOrganization: user.is_organization_owner || isPlatformAdmin,
      canAccessAPI: features.api_access || isPlatformAdmin,
      features
    };
  }

  async getPlatformStats(): Promise<{
    totalOrganizations: number;
    activeOrganizations: number;
    totalRevenue: number;
    totalUsers: number;
    planDistribution: { [key in OrganizationPlan]: number };
  }> {
    const organizations = await this.organizationRepository.find();
    const subscriptions = await this.subscriptionRepository.find({
      where: { status: SubscriptionStatus.ACTIVE }
    });

    const totalRevenue = subscriptions.reduce(
      (sum, sub) => sum + parseFloat(sub.total_amount.toString()),
      0
    );
    const totalUsers = await this.userRepository.count();

    const planDistribution = {
      [OrganizationPlan.STARTER]: organizations.filter(
        (org) => org.plan === OrganizationPlan.STARTER
      ).length,
      [OrganizationPlan.PROFESSIONAL]: organizations.filter(
        (org) => org.plan === OrganizationPlan.PROFESSIONAL
      ).length,
      [OrganizationPlan.ENTERPRISE]: organizations.filter(
        (org) => org.plan === OrganizationPlan.ENTERPRISE
      ).length,
      [OrganizationPlan.UNLIMITED]: organizations.filter(
        (org) => org.plan === OrganizationPlan.UNLIMITED
      ).length
    };

    return {
      totalOrganizations: organizations.length,
      activeOrganizations: organizations.filter((org) => org.status === OrganizationStatus.ACTIVE)
        .length,
      totalRevenue,
      totalUsers,
      planDistribution
    };
  }
}
