import { getConnection1 } from '../../../../lib/db1';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'https://key-dev.centralindia.cloudapp.azure.com';
const KEYCLOAK_ADMIN = process.env.KEYCLOAK_ADMIN || 'admin';
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
const REALM_NAME = 'cloud-platform';

async function getAdminToken() {
  try {
    const formData = new URLSearchParams();
    formData.append('client_id', 'admin-cli');
    formData.append('username', KEYCLOAK_ADMIN);
    formData.append('password', KEYCLOAK_ADMIN_PASSWORD);
    formData.append('grant_type', 'password');
    const tokenUrl = `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`;
    const response = await axios.post(tokenUrl, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    if (!response.data || !response.data.access_token) {
      throw new Error('No access token in response');
    }
    return response.data.access_token;
  } catch (error) {
    throw new Error('Failed to authenticate with Keycloak admin permissions');
  }
}

async function checkOrganizationFeature(token) {
  try {
    const url = `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/organizations`;
    await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      return false;
    }
    throw error;
  }
}

async function createKeycloakOrganization(token, orgName, email) {
  const url = `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/organizations`;
  const emailDomain = email.split('@')[1];
  const payload = {
    name: orgName,
    alias: orgName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    description: '',
    redirectUrl: '',
    domains: [
      { name: emailDomain, verified: false }
    ],
    attributes: {}
  };
  await axios.post(url, payload, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const getOrgUrl = `${url}?search=${encodeURIComponent(orgName)}`;
  const getOrgResponse = await axios.get(getOrgUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  const createdOrg = getOrgResponse.data?.[0];
  if (!createdOrg) {
    throw new Error('Created organization not found in search results');
  }
  return createdOrg;
}

async function createKeycloakClient(token, organizationName) {
  const clientId = `client-${organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const clientName = `${organizationName} Client`;
  const payload = {
    clientId: clientId,
    name: clientName,
    description: '',
    rootUrl: process.env.NEXT_PUBLIC_BASE_URL,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL + '/',
    protocol: 'openid-connect',
    publicClient: false,
    redirectUris: [
      'https://key-dev.centralindia.cloudapp.azure.com/*',
      process.env.NEXT_PUBLIC_BASE_URL + '/*',
      process.env.NEXT_PUBLIC_BASE_URL + '/api/auth/callback',
      'http://localhost:3002/*',
      'http://localhost:3002/api/auth/callback',
      'https://iaas-userportal-app-dev.ambitioussand-8a5710a2.centralindia.azurecontainerapps.io/*',
      'https://iaas-userportal-app-dev.ambitioussand-8a5710a2.centralindia.azurecontainerapps.io/api/auth/callback'
    ],
    webOrigins: [
      process.env.NEXT_PUBLIC_BASE_URL,
      'http://localhost:3002/*',
      'https://iaas-userportal-app-dev.ambitioussand-8a5710a2.centralindia.azurecontainerapps.io/*',
    ],
    standardFlowEnabled: true,
    implicitFlowEnabled: false,
    directAccessGrantsEnabled: true,
    serviceAccountsEnabled: true,
    frontchannelLogout: true,
    attributes: {
      'oidc.ciba.grant.enabled': 'false',
      'oauth2.device.authorization.grant.enabled': 'true',
      'display.on.consent.screen': 'false',
      'backchannel.logout.session.required': 'true',
      'post.logout.redirect.uris': process.env.NEXT_PUBLIC_BASE_URL + '/*## ' + process.env.NEXT_PUBLIC_BASE_URL + '/signin## http://localhost:3002/*## http://localhost:3002/signin## https://iaas-userportal-app-dev.ambitioussand-8a5710a2.centralindia.azurecontainerapps.io/*## https://iaas-userportal-app-dev.ambitioussand-8a5710a2.centralindia.azurecontainerapps.io/signin##'
    },
    defaultClientScopes: [
      'web-origins',
      'acr',
      'profile',
      'roles',
      'basic',
      'email'
    ],
    optionalClientScopes: [
      'address',
      'phone',
      'offline_access',
      'microprofile-jwt'
    ]
  };
  // Check if client already exists
  const existingClientsUrl = `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients`;
  const existingClientsResponse = await axios.get(existingClientsUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    params: {
      clientId: clientId
    }
  });
  let clientUUID;
  if (existingClientsResponse.data && existingClientsResponse.data.length > 0) {
    clientUUID = existingClientsResponse.data[0].id;
  } else {
    const url = `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients`;
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const locationHeader = response.headers.location;
    clientUUID = locationHeader.split('/').pop();
  }
  // Fetch the client secret
  const secretResponse = await axios.get(
    `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${clientUUID}/client-secret`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }
  );
  const clientSecret = secretResponse.data.value;
  return {
    clientId,
    clientUUID,
    clientSecret,
    name: clientName
  };
}

async function getAppRoleId(client, roleName) {
  const query = `SELECT id FROM app_role WHERE name = $1 AND is_active = true`;
  const result = await client.query(query, [roleName]);
  if (result.rows.length === 0) {
    throw new Error(`App role '${roleName}' not found`);
  }
  return result.rows[0].id;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  let dbClient;
  try {
    const { email, organizationName, isBusinessDomain, domain } = req.body;
    if (!email || !organizationName) {
      return res.status(400).json({ error: 'Email and organization name are required' });
    }
    const token = await getAdminToken();
    const isFeatureEnabled = await checkOrganizationFeature(token);
    if (!isFeatureEnabled) {
      return res.status(400).json({ error: 'Organizations feature is not enabled in Keycloak' });
    }
    const uniqueOrgName = `${organizationName}-${Date.now()}`;
    const keycloakOrg = await createKeycloakOrganization(token, uniqueOrgName, email);
    if (!keycloakOrg || !keycloakOrg.id) {
      throw new Error('Failed to get Keycloak organization ID from response');
    }
    const client = await createKeycloakClient(token, organizationName);
    dbClient = await getConnection1();
    const ownerAppRoleId = await getAppRoleId(dbClient, 'owner');
    await dbClient.query('BEGIN');
    try {
      const insertOrgQuery = `
        INSERT INTO organizations (
          id,
          name,
          domain,
          domain_type,
          keycloak_client_name,
          realm_name,
          created_at,
          updated_at,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
        RETURNING *
      `;
      const orgResult = await dbClient.query(insertOrgQuery, [
        keycloakOrg.id,
        organizationName,
        domain || null,
        isBusinessDomain ? 'business' : 'public',
        client.clientId,
        REALM_NAME
      ]);
      const organizationId = orgResult.rows[0].id;
      await dbClient.query('COMMIT');
      const stateData = {
        keycloakOrgId: keycloakOrg.id,
        dbOrgId: organizationId,
        email,
        action: 'register',
        organizationName,
        domain,
        isBusinessDomain,
        clientId: client.clientId,
        clientUUID: client.clientUUID,
        ownerAppRoleId,
        role: 'owner',
        keycloakRoleId: 'owner'
      };
      const registrationState = Buffer.from(JSON.stringify(stateData)).toString('base64');
      const cookieOptions = {
        httpOnly: true,
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax'
      };
      if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
      }
      res.setHeader('Set-Cookie', `selectedOrgId=${organizationId}; ${Object.entries(cookieOptions).map(([key, value]) => `${key}=${value}`).join('; ')}`);
      const registrationUrl = `${KEYCLOAK_URL}/realms/${REALM_NAME}/protocol/openid-connect/registrations` +
        `?client_id=${client.clientId}` +
        `&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_BASE_URL + '/api/auth/callback')}` +
        `&response_type=code` +
        `&scope=openid%20email%20profile` +
        `&login_hint=${encodeURIComponent(email)}` +
        `&kc_idp_hint=email` +
        `&state=${encodeURIComponent(registrationState)}`;
      return res.status(200).json({
        success: true,
        organizationId,
        clientId: client.clientId,
        registrationUrl
      });
    } catch (error) {
      await dbClient.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  } finally {
    if (dbClient) {
      dbClient.release();
    }
  }
} 