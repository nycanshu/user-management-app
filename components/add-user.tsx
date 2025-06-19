"use client";

import { useState } from "react";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { Button } from "./ui/button";

export default function AddUser() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("reader");
  const [orgId, setOrgId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    if (!orgId) {
      setError("Organization ID is required.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `/api/users?orgId=${encodeURIComponent(orgId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, firstName, lastName, role }),
        }
      );
      if (response.status === 204) {
        setSuccess(true);
        setEmail("");
        setFirstName("");
        setLastName("");
        setRole("reader");
        setOrgId("");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to add user");
      }
    } catch (err) {
      setError("Failed to add user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg p-8 border border-border">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <EnvelopeIcon className="w-7 h-7 text-primary" />
          Invite User to Organization
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="orgId" className="block text-sm font-medium mb-1">
              Organization ID
            </label>
            <input
              id="orgId"
              type="text"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition"
              placeholder="Organization ID"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition"
              placeholder="user@example.com"
              required
            />
          </div>
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium mb-1"
            >
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition"
              placeholder="First Name"
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium mb-1"
            >
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition"
              placeholder="Last Name"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition"
            >
              <option value="owner">Owner</option>
              <option value="developer">Developer</option>
              <option value="reader">Reader</option>
            </select>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          {success && (
            <p className="text-green-500 text-sm">User invited successfully!</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Inviting..." : "Invite User"}
          </Button>
        </form>
      </div>
    </main>
  );
}
