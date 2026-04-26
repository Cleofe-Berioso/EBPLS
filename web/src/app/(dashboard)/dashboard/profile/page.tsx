"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading";
import { User, Shield, Key } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    phone: "",
    role: "",
    twoFactorEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (res.ok) {
        setProfile({
          firstName: data.user.firstName ?? "",
          lastName: data.user.lastName ?? "",
          middleName: data.user.middleName ?? "",
          email: data.user.email ?? "",
          phone: data.user.phone ?? "",
          role: data.user.role ?? "",
          twoFactorEnabled: data.user.twoFactorEnabled ?? false,
        });
      }
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          middleName: profile.middleName,
          phone: profile.phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile");
        return;
      }

      setSuccess("Profile updated successfully!");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };  return (
    <div className="mx-auto max-w-2xl px-0 sm:px-0">
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
      <>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">My Profile</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage your account information and security settings
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6" onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-6" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <div className="space-y-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-[var(--accent)]" />
              <CardTitle>Personal Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="First Name"
                  value={profile.firstName}
                  onChange={(e) =>
                    setProfile({ ...profile, firstName: e.target.value })
                  }
                  required
                />
                <Input
                  label="Last Name"
                  value={profile.lastName}
                  onChange={(e) =>
                    setProfile({ ...profile, lastName: e.target.value })
                  }
                  required
                />
              </div>
              <Input
                label="Middle Name"
                value={profile.middleName}
                onChange={(e) =>
                  setProfile({ ...profile, middleName: e.target.value })
                }
              />
              <Input
                label="Email"
                value={profile.email}
                disabled
                hint="Email cannot be changed"
              />
              <Input
                label="Phone"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                placeholder="09171234567"
              />              <div className="flex justify-end">
                <Button onClick={handleSave} loading={saving} className="w-full sm:w-auto">
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[var(--success)]" />
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your security settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-[var(--text-muted)] flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Password</p>
                    <p className="text-sm text-[var(--background)]0">
                      Change your account password
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  Change
                </Button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-[var(--text-muted)] flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      Two-Factor Authentication
                    </p>
                    <p className="text-sm text-[var(--background)]0">
                      {profile.twoFactorEnabled
                        ? "2FA is enabled on your account"
                        : "Add an extra layer of security"}
                    </p>
                  </div>
                </div>
                <Button
                  variant={profile.twoFactorEnabled ? "destructive" : "default"}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {profile.twoFactorEnabled ? "Disable" : "Enable"}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Role</p>
                  <p className="text-sm capitalize text-[var(--background)]0">
                    {profile.role?.toLowerCase().replace("_", " ")}
                  </p>
                </div>
              </div>
            </div>          </CardContent>
        </Card>
      </div>
      </>
      )}
    </div>
  );
}
