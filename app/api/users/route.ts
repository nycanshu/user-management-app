import { getDomainFromEmail, getOrganizationName } from "../../../utils/emailHelper";
import { NextResponse } from "next/server";

const REALM = "test123";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      console.error("Email is missing in request body.");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const domain = getDomainFromEmail(email);
    const orgName = getOrganizationName(email);

    if (!domain || !orgName) {
      console.error("Invalid email or public domain:", email);
      return NextResponse.json({ error: "Invalid email or public domain" }, { status: 400 });
    }

    const tokenRes = await fetch("http://localhost:3000/api/token", { method: "POST" });
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Failed to fetch token:", errText);
      return NextResponse.json({ error: "Token fetch failed" }, { status: 500 });
    }
    const { token } = await tokenRes.json();

    const orgData = { name: orgName, domains: [domain] };

    const orgRes = await fetch(`http://localhost:8080/admin/realms/${REALM}/organizations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orgData),
    });

    if (orgRes.status === 409) {
      console.log("Organization already exists. Checking user...");

      const userExists = await checkIfUserExists(token, email);
      if (userExists) {
        console.log("User already exists in existing org.");
        return NextResponse.json({ message: "User already exists in organization" });
      }

      const userRes = await createUser(token, email);
      if (!userRes.ok) {
        const err = await userRes.text();
        console.error("User creation failed for existing org:", err);
        return NextResponse.json({ error: "User creation failed" }, { status: 500 });
      }

      console.log("User added to existing organization.");
      return NextResponse.json({ message: "User added to existing organization" });
    }

    if (!orgRes.ok) {
      const errorText = await orgRes.text();
      console.error("Organization creation failed:", errorText);
      return NextResponse.json({ error: "Organization creation failed" }, { status: orgRes.status });
    }

    console.log("Organization created successfully");

    const clientRes = await createClient(token, orgName);
    if (!clientRes.ok) {
      const err = await clientRes.text();
      console.error("Client creation failed:", err);
      return NextResponse.json({ error: "Client creation failed" }, { status: clientRes.status });
    }

    console.log("Client created successfully");

    const userRes = await createUser(token, email);
    if (!userRes.ok) {
      const err = await userRes.text();
      console.error("User creation failed:", err);
      return NextResponse.json({ error: "User creation failed" }, { status: userRes.status });
    }

    console.log("User created successfully");

    return NextResponse.json({ message: "Organization, client, and user created successfully" });

  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

const createClient = async (token: string, orgName: string) => {
  const clientData = {
    clientId: `client-${orgName}`,
    enabled: true,
    protocol: "openid-connect",
    publicClient: false,
    standardFlowEnabled: true,
    serviceAccountsEnabled: true,
    directAccessGrantsEnabled: true,
    frontchannelLogout: true,
    attributes: {
      "oauth2.device.authorization.grant.enabled": "true",
    },
  };

  return await fetch(`http://localhost:8080/admin/realms/${REALM}/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(clientData),
  });
};

const checkIfUserExists = async (token: string, email: string) => {
  const res = await fetch(`http://localhost:8080/admin/realms/${REALM}/users?email=${email}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.warn("Failed to check if user exists. Proceeding as if user does not exist.");
    return false;
  }

  const users = await res.json();
  return users && users.length > 0;
};

const createUser = async (token: string, email: string) => {
  const userData = {
    username: email.split("@")[0],
    email,
    enabled: true,
  };

  return await fetch(`http://localhost:8080/admin/realms/${REALM}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });
};
