import { Request, Response } from 'express';
import { OrganizationService } from '../services/organization.service';
import { OrganizationPlan } from '../models/Organization.entity';
import { UserRole, UserTier } from '../models/User.entity';

export class OrganizationController {
  private organizationService: OrganizationService;

  constructor() {
    this.organizationService = new OrganizationService();
  }

  // Platform Admin only - Create new organization (when someone buys manager license)
  createOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        description,
        industry,
        company_size,
        contact_email,
        phone_number,
        address,
        plan,
        manager_user
      } = req.body;

      const currentUser = (req as any).user;

      // Only platform admins can create organizations
      if (currentUser.tier !== UserTier.PLATFORM) {
        res.status(403).json({
          success: false,
          message: 'Only platform administrators can create organizations'
        });
        return;
      }

      if (!name || !industry || !contact_email || !plan || !manager_user) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: name, industry, contact_email, plan, manager_user'
        });
        return;
      }

      const result = await this.organizationService.createOrganization({
        name,
        description,
        industry,
        company_size: company_size || 'small',
        contact_email,
        phone_number,
        address,
        plan: plan as OrganizationPlan,
        manager_user
      });

      res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: {
          organization: result.organization,
          manager: {
            id: result.manager.id,
            username: result.manager.username,
            email: result.manager.email,
            full_name: result.manager.full_name,
            role: result.manager.role,
            tier: result.manager.tier
          },
          subscription: result.subscription,
          login_url: `${process.env.FRONTEND_URL}/org/${result.organization.org_code}/login`
        }
      });
    } catch (error) {
      console.error('Create organization error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create organization'
      });
    }
  };

  // Get organization details (managers can see their org, platform admins can see any)
  getOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const currentUser = (req as any).user;

      const organization = await this.organizationService.getOrganizationById(organizationId);

      if (!organization) {
        res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
        return;
      }

      // Check access permissions
      if (
        currentUser.tier !== UserTier.PLATFORM &&
        currentUser.organization_id !== organizationId
      ) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: organization
      });
    } catch (error) {
      console.error('Get organization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve organization'
      });
    }
  };

  // Get my organization (for managers and users)
  getMyOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;

      if (!currentUser.organization_id) {
        res.status(404).json({
          success: false,
          message: 'No organization associated with your account'
        });
        return;
      }

      const organization = await this.organizationService.getOrganizationById(
        currentUser.organization_id
      );
      const stats = await this.organizationService.getOrganizationStats(
        currentUser.organization_id
      );

      res.status(200).json({
        success: true,
        data: {
          organization,
          stats
        }
      });
    } catch (error) {
      console.error('Get my organization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve organization'
      });
    }
  };

  // Add user to organization (managers only, with limit checking)
  addUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const { username, email, password, full_name, role } = req.body;
      const currentUser = (req as any).user;

      // Check permissions
      if (
        currentUser.tier !== UserTier.PLATFORM &&
        (currentUser.tier !== UserTier.MANAGER || currentUser.organization_id !== organizationId)
      ) {
        res.status(403).json({
          success: false,
          message: 'Only organization managers can add users'
        });
        return;
      }

      if (!username || !email || !password || !full_name) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: username, email, password, full_name'
        });
        return;
      }

      const user = await this.organizationService.addUserToOrganization(
        organizationId,
        { username, email, password, full_name, role: role || UserRole.USER },
        currentUser.userId
      );

      res.status(201).json({
        success: true,
        message: 'User added successfully',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          tier: user.tier
        }
      });
    } catch (error) {
      console.error('Add user error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add user'
      });
    }
  };

  // Get organization users (managers can see their org users)
  getOrganizationUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const currentUser = (req as any).user;

      // Check access permissions
      if (
        currentUser.tier !== UserTier.PLATFORM &&
        currentUser.organization_id !== organizationId
      ) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const users = await this.organizationService.getOrganizationUsers(organizationId);
      const stats = await this.organizationService.getOrganizationStats(organizationId);

      res.status(200).json({
        success: true,
        data: {
          users: users.map((user) => ({
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            tier: user.tier,
            is_active: user.is_active,
            created_at: user.created_at,
            last_login: user.last_login
          })),
          stats
        }
      });
    } catch (error) {
      console.error('Get organization users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve organization users'
      });
    }
  };

  // Upgrade organization plan (organization managers only)
  upgradePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const { plan, billing_cycle } = req.body;
      const currentUser = (req as any).user;

      // Check permissions
      if (
        currentUser.tier !== UserTier.PLATFORM &&
        (currentUser.tier !== UserTier.MANAGER ||
          currentUser.organization_id !== organizationId ||
          !currentUser.is_organization_owner)
      ) {
        res.status(403).json({
          success: false,
          message: 'Only organization owners can upgrade plans'
        });
        return;
      }

      if (!plan) {
        res.status(400).json({
          success: false,
          message: 'Plan is required'
        });
        return;
      }

      const subscription = await this.organizationService.upgradePlan(
        organizationId,
        plan as OrganizationPlan,
        billing_cycle || 'monthly'
      );

      res.status(200).json({
        success: true,
        message: 'Plan upgraded successfully',
        data: subscription
      });
    } catch (error) {
      console.error('Upgrade plan error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upgrade plan'
      });
    }
  };

  // Get platform statistics (platform admins only)
  getPlatformStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;

      if (currentUser.tier !== UserTier.PLATFORM) {
        res.status(403).json({
          success: false,
          message: 'Platform administrator access required'
        });
        return;
      }

      const stats = await this.organizationService.getPlatformStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get platform stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve platform statistics'
      });
    }
  };

  // Get user permissions (for frontend to adapt UI)
  getUserPermissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;

      if (!currentUser.organization_id) {
        res.status(200).json({
          success: true,
          data: {
            tier: currentUser.tier,
            role: currentUser.role,
            permissions: currentUser.tier === UserTier.PLATFORM ? 'all' : 'none'
          }
        });
        return;
      }

      const permissions = await this.organizationService.getOrganizationPermissions(
        currentUser.userId
      );

      res.status(200).json({
        success: true,
        data: {
          tier: currentUser.tier,
          role: currentUser.role,
          permissions
        }
      });
    } catch (error) {
      console.error('Get user permissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user permissions'
      });
    }
  };

  // Check user limits (for managers to see remaining slots)
  checkUserLimits = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = (req as any).user;

      if (!currentUser.organization_id) {
        res.status(404).json({
          success: false,
          message: 'No organization associated with your account'
        });
        return;
      }

      const limitCheck = await this.organizationService.checkUserLimit(currentUser.organization_id);

      res.status(200).json({
        success: true,
        data: limitCheck
      });
    } catch (error) {
      console.error('Check user limits error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check user limits'
      });
    }
  };
}
