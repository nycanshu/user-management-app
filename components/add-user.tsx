"use client"

import { useState } from "react";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { Button } from "./ui/button";
import axiosInstance from "../utils/axiosInstance";

export default function AddUser() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSuccess(true);
    setEmail("");

    // call the api to add the user
    const response = await axiosInstance.post("/users", {
      email: email,
    }, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(response.data);
    if (response.status === 200) {
      setSuccess(true);
    } else {
      setError("Failed to add user");
    }
  }

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg p-8 border border-border">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <EnvelopeIcon className="w-7 h-7 text-primary" />
          Add User
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          {error && <p className="text-destructive text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">User added successfully!</p>}
          <Button type="submit" className="w-full">
            Create User
          </Button>
        </form>
      </div>
    </main>
  );
}