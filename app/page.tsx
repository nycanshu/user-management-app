"use client";


import { UserPlusIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import axiosInstance, { setAccessToken } from "../utils/axiosInstance";

export default function Home() {
  const router = useRouter();

  const handleGetToken = async () => {
    try {
      const params = new URLSearchParams();
      params.append("client_id", "admin-cli");
      params.append("username", "admin");
      params.append("password", "admin");
      params.append("grant_type", "password");
      const response = await axiosInstance.post(
        "/token",
        params,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      console.log(response.data);

      setAccessToken(response.data.access_token);
      router.push("/add-user");
      // alert("Token: " + response.data.access_token);
    } catch (error: any) {
      alert("Error: " + (error.response?.data?.error_description || error.message));
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-8 dark">
      <div className="w-full max-w-xl bg-card rounded-2xl shadow-lg p-8 border border-border flex flex-col items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
          <UserPlusIcon className="w-8 h-8 text-primary" />
          User Management
        </h1>
        <Button
          className="flex items-center gap-2 text-lg px-6 py-3"
          onClick={handleGetToken}
        >
          <UserPlusIcon className="w-6 h-6" />
          Get Token
        </Button>
      </div>
    </main>
  );
}
