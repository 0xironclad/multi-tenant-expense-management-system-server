export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Multi-Tenant Expense Management API',
    version: '1.0.0',
    description:
      'All requests go through the API gateway on port 3000. ' +
      'Protected endpoints require a Bearer token in the Authorization header. ' +
      'The gateway verifies the JWT and injects x-user-id / x-user-email headers for downstream services.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local (via gateway)' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          authUserId: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Organisation: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Membership: {
        type: 'object',
        properties: {
          membershipId: { type: 'string', format: 'uuid' },
          role: { type: 'string', enum: ['OWNER', 'MANAGER', 'EMPLOYEE'] },
          joinedAt: { type: 'string', format: 'date-time' },
          org: { $ref: '#/components/schemas/Organisation' },
        },
      },
      Expense: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          orgId: { type: 'string', format: 'uuid' },
          submittedBy: { type: 'string', format: 'uuid', description: 'authUserId of the submitter' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          amount: { type: 'string', description: 'Decimal string' },
          currency: { type: 'string' },
          status: { type: 'string', enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'] },
          receiptS3Key: { type: 'string', nullable: true },
          submittedAt: { type: 'string', format: 'date-time', nullable: true },
          reviewedBy: { type: 'string', format: 'uuid', nullable: true },
          reviewedAt: { type: 'string', format: 'date-time', nullable: true },
          rejectionReason: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Invitation: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['OWNER', 'MANAGER', 'EMPLOYEE'] },
          orgId: { type: 'string', format: 'uuid' },
          expiresAt: { type: 'string', format: 'date-time' },
          acceptedAt: { type: 'string', format: 'date-time', nullable: true },
          rejectedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Register, login, token refresh and logout' },
    { name: 'Users', description: 'User profile management' },
    { name: 'Organisations', description: 'Create and manage organisations' },
    { name: 'Invitations', description: 'Invite members and accept/reject invitations' },
    { name: 'Expenses', description: 'Expense CRUD and state machine (DRAFT → PENDING → APPROVED/REJECTED)' },
    { name: 'Files', description: 'Presigned URLs for direct receipt upload/download to S3 (MinIO locally)' },
  ],
  paths: {
    // ── Auth ────────────────────────────────────────────────────────────────────

    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Creates an auth account. Does not create a profile — call POST /api/users/profile after registration.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string', format: 'uuid' },
                    email: { type: 'string' },
                  },
                },
              },
            },
          },
          409: { description: 'Email already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string', description: 'Short-lived JWT (15m)' },
                    refreshToken: { type: 'string', description: 'Long-lived refresh token (7d)' },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        description: 'Exchange a valid refresh token for a new access token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'New access token issued',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { accessToken: { type: 'string' } },
                },
              },
            },
          },
          401: { description: 'Invalid or expired refresh token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout',
        description: 'Revokes the refresh token. The access token remains valid until expiry (15m).',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Logged out successfully' },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── Users ───────────────────────────────────────────────────────────────────

    '/api/users/profile': {
      post: {
        tags: ['Users'],
        summary: 'Create user profile',
        description: 'Idempotent — returns existing profile if already created. Must be called after registration before accessing any org features.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName'],
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Profile created', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } } } },
          200: { description: 'Profile already exists (idempotent)', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get my profile',
        description: 'Returns the authenticated user\'s profile along with all organisation memberships.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Profile with memberships',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/UserProfile' },
                    {
                      type: 'object',
                      properties: {
                        memberships: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Membership' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Profile not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── Organisations ───────────────────────────────────────────────────────────

    '/api/organisations': {
      post: {
        tags: ['Organisations'],
        summary: 'Create an organisation',
        description: 'Creates an organisation and automatically assigns the caller as OWNER.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'slug'],
                properties: {
                  name: { type: 'string', example: 'Acme Corp' },
                  slug: { type: 'string', example: 'acme-corp', description: 'Unique URL-friendly identifier' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Organisation created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Organisation' } } } },
          409: { description: 'Slug already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/organisations/{orgId}': {
      get: {
        tags: ['Organisations'],
        summary: 'Get organisation by ID',
        description: 'Members only.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Organisation details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Organisation' } } } },
          403: { description: 'Not a member', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Organisation not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/organisations/{orgId}/members': {
      get: {
        tags: ['Organisations'],
        summary: 'List organisation members',
        description: 'Returns all members with their roles and profile info. Members only.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'List of members',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      membershipId: { type: 'string', format: 'uuid' },
                      role: { type: 'string', enum: ['OWNER', 'MANAGER', 'EMPLOYEE'] },
                      joinedAt: { type: 'string', format: 'date-time' },
                      profile: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          firstName: { type: 'string' },
                          lastName: { type: 'string' },
                          email: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          403: { description: 'Not a member', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/expenses': {
      get: {
        tags: ['Expenses'],
        summary: 'List expenses',
        description: 'Lists expenses for an org. EMPLOYEEs see only their own. MANAGERs/OWNERs see all. Supports cursor pagination.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'orgId', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'] } },
          { name: 'submittedBy', in: 'query', description: 'Filter by submitter authUserId (MANAGER/OWNER only)', schema: { type: 'string' } },
          { name: 'cursor', in: 'query', description: 'createdAt ISO timestamp of the last item from the previous page', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: {
            description: 'Paginated expense list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/Expense' } },
                    nextCursor: { type: 'string', nullable: true, description: 'Pass as cursor in the next request to get the next page' },
                  },
                },
              },
            },
          },
          403: { description: 'Not a member', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Expenses'],
        summary: 'Create an expense',
        description: 'Creates a new expense in DRAFT status. The caller must be a member of the specified org.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orgId', 'title', 'amount'],
                properties: {
                  orgId: { type: 'string', format: 'uuid' },
                  title: { type: 'string', example: 'Team lunch' },
                  description: { type: 'string' },
                  amount: { type: 'string', example: '49.99', description: 'Decimal string' },
                  currency: { type: 'string', default: 'USD', example: 'USD' },
                  receiptS3Key: { type: 'string', description: 'S3 object key from the file service presigned upload' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Expense created in DRAFT status', content: { 'application/json': { schema: { $ref: '#/components/schemas/Expense' } } } },
          403: { description: 'Not a member of the organisation', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/expenses/{id}/submit': {
      post: {
        tags: ['Expenses'],
        summary: 'Submit expense for review',
        description: 'Transitions DRAFT → PENDING. Only the submitter can call this.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Expense is now PENDING', content: { 'application/json': { schema: { $ref: '#/components/schemas/Expense' } } } },
          400: { description: 'Invalid state transition', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Not the submitter', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Expense not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/expenses/{id}/approve': {
      post: {
        tags: ['Expenses'],
        summary: 'Approve expense',
        description: 'Transitions PENDING → APPROVED. Requires MANAGER or OWNER role. Self-approval is blocked.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Expense is now APPROVED', content: { 'application/json': { schema: { $ref: '#/components/schemas/Expense' } } } },
          400: { description: 'Invalid state transition', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Insufficient role or self-approval attempt', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Expense not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/expenses/{id}/reject': {
      post: {
        tags: ['Expenses'],
        summary: 'Reject expense',
        description: 'Transitions PENDING → REJECTED. Requires MANAGER or OWNER role. A reason is mandatory.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason'],
                properties: { reason: { type: 'string', example: 'Missing receipt' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Expense is now REJECTED', content: { 'application/json': { schema: { $ref: '#/components/schemas/Expense' } } } },
          400: { description: 'Invalid state transition or missing reason', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Insufficient role', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Expense not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/expenses/{id}/resubmit': {
      post: {
        tags: ['Expenses'],
        summary: 'Resubmit rejected expense',
        description: 'Transitions REJECTED → DRAFT so the submitter can edit and re-submit. Only the original submitter can call this.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Expense is back in DRAFT', content: { 'application/json': { schema: { $ref: '#/components/schemas/Expense' } } } },
          400: { description: 'Expense is not REJECTED', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Not the submitter', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Expense not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── Invitations ─────────────────────────────────────────────────────────────

    '/api/organisations/{orgId}/invitations': {
      post: {
        tags: ['Invitations'],
        summary: 'Invite a member',
        description:
          'Sends an invitation to an email address. Publishes a USER_INVITED event to RabbitMQ — the notification service sends the email.\n\n' +
          '**Authorization rules:**\n' +
          '- EMPLOYEE cannot invite anyone\n' +
          '- MANAGER can invite MANAGER or EMPLOYEE\n' +
          '- OWNER can invite anyone including another OWNER',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'orgId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'role'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string', enum: ['OWNER', 'MANAGER', 'EMPLOYEE'] },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Invitation created and event published',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    token: { type: 'string', format: 'uuid' },
                    email: { type: 'string' },
                    role: { type: 'string' },
                    expiresAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          403: { description: 'Insufficient role to invite', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Pending invitation already exists or user is already a member', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/invitations/{token}': {
      get: {
        tags: ['Invitations'],
        summary: 'Get invitation details',
        description: 'Public endpoint — no auth required. Used by the frontend to display invitation details before the user accepts. Returns 404 if the token is invalid.',
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Invitation details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Invitation' } } } },
          404: { description: 'Invitation not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/invitations/{token}/accept': {
      post: {
        tags: ['Invitations'],
        summary: 'Accept an invitation',
        description:
          'The authenticated user accepts the invitation. Verifies the user\'s email matches the invited email, creates the membership, and stamps acceptedAt.\n\n' +
          '**Hint:** The invitee must have a profile (POST /api/users/profile) before they can accept.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'Invitation accepted, membership created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    orgId: { type: 'string', format: 'uuid' },
                    role: { type: 'string' },
                  },
                },
              },
            },
          },
          400: { description: 'Invitation expired or already accepted/rejected', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Email mismatch — logged-in user is not the invitee', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Invitation or profile not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/invitations/{token}/reject': {
      post: {
        tags: ['Invitations'],
        summary: 'Reject an invitation',
        description: 'The authenticated user rejects the invitation. Stamps rejectedAt. The inviter can re-invite after rejection.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Invitation rejected', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          400: { description: 'Invitation expired or already accepted/rejected', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Email mismatch', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Invitation or profile not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/expenses/{id}': {
      get: {
        tags: ['Expenses'],
        summary: 'Get expense by ID',
        description: 'Returns a single expense. Caller must be a member of the org. EMPLOYEEs can only view their own expenses.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Expense', content: { 'application/json': { schema: { $ref: '#/components/schemas/Expense' } } } },
          403: { description: 'Not a member or EMPLOYEE viewing another\'s expense', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Expense not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Expenses'],
        summary: 'Update an expense',
        description: 'Update expense fields. Only allowed when status is DRAFT or REJECTED. Only the original submitter can edit.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  amount: { type: 'string', description: 'Decimal string' },
                  currency: { type: 'string' },
                  receiptS3Key: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Expense updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Expense' } } } },
          400: { description: 'Expense is not in DRAFT or REJECTED status', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Not the submitter', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Expense not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/files/upload-url': {
      post: {
        tags: ['Files'],
        summary: 'Request a presigned upload URL',
        description:
          'Returns a short-lived (5 min) presigned S3 PUT URL plus the generated s3Key. The client uploads the file **directly** to S3/MinIO with that URL — the bytes never pass through the server.\n\n' +
          '**Flow:** call this → PUT the file to `uploadUrl` → pass the returned `s3Key` to the expense service as `receiptS3Key`.\n\n' +
          '**Hint:** When uploading, set the request `Content-Type` to the same `mimeType` you sent here, or S3 will reject the signature. Allowed types: image/jpeg, image/png, application/pdf.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['filename', 'mimeType', 'orgId'],
                properties: {
                  filename: { type: 'string', example: 'receipt.pdf' },
                  mimeType: { type: 'string', enum: ['image/jpeg', 'image/png', 'application/pdf'], example: 'application/pdf' },
                  orgId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Presigned upload URL',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    uploadUrl: { type: 'string', description: 'Presigned S3 PUT URL (expires in 5 min)' },
                    s3Key: { type: 'string', example: 'receipts/{orgId}/{uuid}-receipt.pdf' },
                  },
                },
              },
            },
          },
          400: { description: 'Missing fields or unsupported mime type', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Not a member of the organisation', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/files/download-url': {
      post: {
        tags: ['Files'],
        summary: 'Request a presigned download URL',
        description:
          'Returns a short-lived (5 min) presigned S3 GET URL for viewing a receipt. The caller must belong to the org that owns the file.\n\n' +
          '**Why POST, not GET:** the `s3Key` contains slashes which would break path-based routing, so it travels in the request body.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['s3Key'],
                properties: {
                  s3Key: { type: 'string', example: 'receipts/{orgId}/{uuid}-receipt.pdf' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Presigned download URL',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    downloadUrl: { type: 'string', description: 'Presigned S3 GET URL (expires in 5 min)' },
                  },
                },
              },
            },
          },
          403: { description: 'Caller is not a member of the file\'s organisation', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'File not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};
