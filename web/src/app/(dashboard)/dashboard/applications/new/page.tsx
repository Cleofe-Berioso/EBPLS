"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";

export default function NewApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    type: "NEW",
    businessName: "",
    businessTypeCategory: "", // Sole Prop / Partnership / Corporation / Cooperative
    lineOfBusiness: "",
    businessPhone: "",
    businessEmail: "",
    assetValue: "",
    businessArea: "",
    monthlyRental: "",
    businessAddress: "",
    businessBarangay: "",
    businessCity: "",
    businessProvince: "",
    businessZipCode: "",
    tinNumber: "",
    dtiSecRegistration: "",
    capitalInvestment: "",
    numberOfEmployees: "",
    ownerName: "",
    ownerBirthdate: "",
    ownerResidenceAddress: "",
    ownerPhone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { businessTypeCategory, ...apiData } = formData;
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...apiData,
          businessType: businessTypeCategory,
          capitalInvestment: formData.capitalInvestment ? parseFloat(formData.capitalInvestment) : null,
          assetValue: formData.assetValue ? parseFloat(formData.assetValue) : null,
          businessArea: formData.businessArea ? parseFloat(formData.businessArea) : null,
          monthlyRental: formData.monthlyRental ? parseFloat(formData.monthlyRental) : null,
          numberOfEmployees: formData.numberOfEmployees ? parseInt(formData.numberOfEmployees) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create application");
        return;
      }

      router.push("/dashboard/applications");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Business Permit Application</h1>
        <p className="text-gray-600">Fill out the form below to apply for a business permit</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Application Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Type
              </label>
              <Select
                value={formData.type}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, type: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New Application</SelectItem>
                  <SelectItem value="RENEWAL">Renewal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Business Name"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              required
            />
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Type of Business <span className="ml-1 text-destructive">*</span>
              </label>
              <Select
                value={formData.businessTypeCategory}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, businessTypeCategory: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOLE_PROPRIETORSHIP">Sole Proprietorship</SelectItem>
                  <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                  <SelectItem value="CORPORATION">Corporation</SelectItem>
                  <SelectItem value="COOPERATIVE">Cooperative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              label="Line of Business / Business Activity"
              name="lineOfBusiness"
              value={formData.lineOfBusiness}
              onChange={handleChange}
              placeholder="e.g., Retail Trade, Food Service, Manufacturing"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Business Phone Number"
                name="businessPhone"
                type="tel"
                value={formData.businessPhone}
                onChange={handleChange}
              />
              <Input
                label="Business Email Address"
                name="businessEmail"
                type="email"
                value={formData.businessEmail}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Asset Value (₱)"
                name="assetValue"
                type="number"
                value={formData.assetValue}
                onChange={handleChange}
                step="0.01"
              />
              <Input
                label="Business Area (sqm)"
                name="businessArea"
                type="number"
                value={formData.businessArea}
                onChange={handleChange}
                step="0.01"
              />
              <Input
                label="Monthly Rental (₱)"
                name="monthlyRental"
                type="number"
                value={formData.monthlyRental}
                onChange={handleChange}
                step="0.01"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Business Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Street Address"
              name="businessAddress"
              value={formData.businessAddress}
              onChange={handleChange}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Barangay"
                name="businessBarangay"
                value={formData.businessBarangay}
                onChange={handleChange}
              />
              <Input
                label="City/Municipality"
                name="businessCity"
                value={formData.businessCity}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Province"
                name="businessProvince"
                value={formData.businessProvince}
                onChange={handleChange}
              />
              <Input
                label="Postal Code"
                name="businessZipCode"
                value={formData.businessZipCode}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information (Owner)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Owner's Full Name"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              required
            />
            <Input
              label="Date of Birth"
              name="ownerBirthdate"
              type="date"
              value={formData.ownerBirthdate}
              onChange={handleChange}
              required
            />
            <Input
              label="Residence Address"
              name="ownerResidenceAddress"
              value={formData.ownerResidenceAddress}
              onChange={handleChange}
              placeholder="Street address, Barangay, City/Municipality"
              required
            />
            <Input
              label="Mobile Number"
              name="ownerPhone"
              type="tel"
              value={formData.ownerPhone}
              onChange={handleChange}
              required
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Registration Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="TIN Number"
                name="tinNumber"
                value={formData.tinNumber}
                onChange={handleChange}
              />
              <Input
                label="DTI/SEC/CDA Registration"
                name="dtiSecRegistration"
                value={formData.dtiSecRegistration}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Capital Investment (₱)"
                name="capitalInvestment"
                type="number"
                value={formData.capitalInvestment}
                onChange={handleChange}
              />
              <Input
                label="Number of Employees"
                name="numberOfEmployees"
                type="number"
                value={formData.numberOfEmployees}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Required Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-900">
            <p className="font-medium">Please prepare the following documents for upload after submission:</p>
            <ul className="space-y-2 ml-4 list-disc">
              <li>Proof / Certificate of Registration (DTI / SEC / CDA) — 1 photocopy</li>
              <li>Proof of ownership or right to use location (Transfer Certificate, Lease, or Consent) — 1 certified copy</li>
              <li>Location plan or sketch of location — 1 original copy</li>
              <li>Fire Safety Inspection Certificate (at least 9 months valid) — 1 original copy</li>
              <li>Affidavit of Undertaking (if you have a valid FSIC) — 1 original copy</li>
              <li>
                <strong>BPLO-managed compliance requirements</strong> relevant to your business, such as sanitary, environmental,
                engineering, fire safety, property-related, utility, or other business-specific supporting documents
              </li>
            </ul>
            <div className="border-t border-blue-200 pt-3 mt-3">
              <p className="text-xs">
                You will upload these documents on the next page after submitting this form. Ensure all documents meet the specified requirements.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  );
}
