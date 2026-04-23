"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Smartphone,
  Edit,
  LogOut,
} from "lucide-react";

/**
 * RenewalProfileContent — Displays and manages user profile in renewal portal
 * Shows account details, contact info, and security settings
 */
export function RenewalProfileContent() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "Juan",
    lastName: "Dela Cruz",
    email: "juan@example.com",
    phone: "+63 917 123 4567",
    address: "123 Business St., Quezon City",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      // TODO: Implement API call to update profile
      console.log("Saving profile:", formData);
      setIsEditing(false);
      // Show success toast
    } catch (error) {
      console.error("Error saving profile:", error);
      // Show error toast
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Personal Information</CardTitle>
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          >
            <Edit className="mr-2 h-4 w-4" />
            {isEditing ? "Save Changes" : "Edit Profile"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
            <div>
              <label className="text-xs font-semibold uppercase text-gray-600">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-600">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-gray-600">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-gray-600">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-gray-600">
              Business Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Password</p>
                <p className="text-sm text-gray-600">
                  Last changed 60 days ago
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">
                  Two-Factor Authentication
                </p>
                <p className="text-sm text-green-700">
                  ✓ Enabled with Google Authenticator
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Manage 2FA
            </Button>
          </div>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">
                  Active Sessions: 2
                </p>
                <p className="mt-1 text-sm text-orange-800">
                  You&rsquo;re logged in on this browser and one other device.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Mail className="mr-2 h-4 w-4" />
            Download Your Data (GDPR)
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <AlertCircle className="mr-2 h-4 w-4" />
            Deactivate Account
          </Button>
          <Button variant="destructive" className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" />
            Log Out of All Devices
          </Button>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-600">
            For account support or general inquiries, please contact our help desk:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <a
                href="mailto:support@lgu.gov.ph"
                className="text-blue-600 hover:underline"
              >
                support@lgu.gov.ph
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-green-600" />
              <span className="text-gray-700">(02) 8123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-600" />
              <span className="text-gray-700">
                BPLO Office, City Hall Compound
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
