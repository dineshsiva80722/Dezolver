import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/enums';
import { UserTier } from '../models/User.entity';
import { OrganizationService } from '../services/organization.service';
import { AuthRequest } from './auth.middleware';

interface RBACRequest extends AuthRequest {
  permissions?: {
    canManageUsers: boolean;
    canManagePayroll: boolean;
    canManageCertificates: boolean;
    canViewAnalytics: boolean;
    canManageOrganization: boolean;
    canAccessAPI: boolean;
    features: any;
  };
}

// Platform Admin - Full access to everything
export const requirePlatformAdmin = (req: RBACRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.tier !== UserTier.PLATFORM) {
    return res.status(403).json({
      success: false,
      message: 'Platform administrator access required'
    });
  }

  next();
};

// Manager Access - Organization management
export const requireManager = (req: RBACRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const validManagerRoles = [
    UserRole.PLATFORM_ADMIN,
    UserRole.ORGANIZATION_MANAGER,
    UserRole.HR_MANAGER
  ];

  if (!validManagerRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Manager access required'
    });
  }

  next();
};

// Feature-based access control
export const requireFeature = (feature: string) => {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Platform admins have access to all features
    if (req.user.tier === UserTier.PLATFORM) {
      return next();
    }

    try {
      const organizationService = new OrganizationService();
      const permissions = await organizationService.getOrganizationPermissions(req.user.userId);
      
      req.permissions = permissions;

      // Check specific feature access
      switch (feature) {
        case 'hr_management':
          if (!permissions.canManageUsers) {
            return res.status(403).json({
              success: false,
              message: 'HR management access not available in your plan'
            });
          }
          break;
        
        case 'payroll_processing':
          if (!permissions.canManagePayroll) {
            return res.status(403).json({
              success: false,
              message: 'Payroll processing not available in your plan'
            });
          }
          break;
        
        case 'certificate_automation':
          if (!permissions.canManageCertificates) {
            return res.status(403).json({
              success: false,
              message: 'Certificate automation not available in your plan'
            });
          }
          break;
        
        case 'advanced_analytics':
          if (!permissions.canViewAnalytics) {
            return res.status(403).json({
              success: false,
              message: 'Advanced analytics not available in your plan'
            });
          }
          break;
        
        case 'api_access':
          if (!permissions.canAccessAPI) {
            return res.status(403).json({
              success: false,
              message: 'API access not available in your plan'
            });
          }
          break;
        
        default:
          if (!permissions.features[feature]) {
            return res.status(403).json({
              success: false,
              message: `Feature '${feature}' not available in your plan`
            });
          }
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
};

// Organization isolation - Users can only access their organization data
export const requireOrganizationAccess = async (req: RBACRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Platform admins can access any organization
  if (req.user.tier === UserTier.PLATFORM) {
    return next();
  }

  // Extract organization ID from request (could be in params, body, or query)
  const requestedOrgId = req.params.organizationId || 
                         req.params.orgId || 
                         req.body.organization_id ||
                         req.query.organization_id;

  // If no specific organization requested, they can only access their own
  if (!requestedOrgId) {
    return next();
  }

  // Check if user belongs to the requested organization
  if (req.user.organization_id !== requestedOrgId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You can only access your organization data'
    });
  }

  next();
};

// User limit enforcement
export const enforceUserLimits = async (req: RBACRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Skip for platform admins
  if (req.user.tier === UserTier.PLATFORM) {
    return next();
  }

  try {
    const organizationService = new OrganizationService();
    if (!req.user.organization_id) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found for user'
      });
    }
    const limitCheck = await organizationService.checkUserLimit(req.user.organization_id);
    
    // If this is a user creation request, check limits
    if (req.method === 'POST' && req.path.includes('/users')) {
      if (!limitCheck.canAddUser) {
        return res.status(403).json({
          success: false,
          message: 'User limit exceeded. Please upgrade your plan to add more users.',
          data: {
            currentUsers: limitCheck.currentUsers,
            userLimit: limitCheck.userLimit,
            remainingSlots: limitCheck.remainingSlots
          }
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking user limits'
    });
  }
};

// Role hierarchy check
export const requireRoleHierarchy = (minimumRole: UserRole) => {
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.USER]: 1,
    [UserRole.HR_MANAGER]: 2,
    [UserRole.ORGANIZATION_MANAGER]: 3,
    [UserRole.PLATFORM_ADMIN]: 4,
    [UserRole.ADMIN]: 3, // Legacy admin
    [UserRole.MODERATOR]: 2,
    [UserRole.PROBLEM_SETTER]: 2,
    [UserRole.MANAGER]: 3,
    [UserRole.SUPER_ADMIN]: 4,
  };

  return (req: RBACRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userLevel = roleHierarchy[req.user.role];
    const requiredLevel = roleHierarchy[minimumRole];

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role permissions'
      });
    }

    next();
  };
};

// Subscription validation
export const requireActiveSubscription = async (req: RBACRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Skip for platform admins
  if (req.user.tier === UserTier.PLATFORM) {
    return next();
  }

  try {
    const organizationService = new OrganizationService();
    if (!req.user.organization_id) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found for user'
      });
    }
    const organization = await organizationService.getOrganizationById(req.user.organization_id);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    if (organization.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Organization account is suspended. Please contact support.'
      });
    }

    if (organization.status === 'expired') {
      return res.status(403).json({
        success: false,
        message: 'Subscription has expired. Please renew to continue using the platform.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error validating subscription'
    });
  }
};
