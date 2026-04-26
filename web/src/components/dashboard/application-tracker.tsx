"use client";

import {
  Check,
  Clock,
  AlertCircle,
  DollarSign,
  FileText,
  Package,
  CheckCircle,
} from "lucide-react";

type Icon = React.ElementType<{ className?: string }>;

interface ApplicationTrackerProps {
  currentStatus: string;
  applicationId: string;
  businessName: string;
}

interface Step {
  id: string;
  label: string;
  Icon: Icon;
}

const steps: Step[] = [
  { id: "SUBMITTED", label: "Submitted", Icon: FileText },
  { id: "UNDER_REVIEW", label: "Reviewing", Icon: Clock },
  { id: "PAYMENT_PENDING", label: "Fees Assessment", Icon: DollarSign },
  { id: "PAID", label: "Payment Verified", Icon: DollarSign },
  { id: "PERMIT_PREPARED", label: "For Printing", Icon: FileText },
  { id: "READY_FOR_RELEASE", label: "Ready to Claim", Icon: Package },
  { id: "RELEASED", label: "Released", Icon: CheckCircle },
];

const statusToStepIndex: Record<string, number> = {
  DRAFT: 0,
  SUBMITTED: 0,
  UNDER_REVIEW: 1,
  RETURNED_FOR_CORRECTION: 1,
  RESUBMITTED: 1,
  PAYMENT_PENDING: 2,
  PAID: 3,
  PERMIT_PREPARED: 4,
  READY_FOR_RELEASE: 5,
  RELEASED: 6,
  COMPLETED: 6,
};

const statusDescriptions: Record<string, string> = {
  DRAFT: "Your application is saved as a draft. Submit it to begin processing.",
  SUBMITTED: "Your application has been submitted and is waiting for BPLO review.",
  UNDER_REVIEW: "BPLO is currently reviewing your application and documents.",
  RETURNED_FOR_CORRECTION: "Your application has been returned for correction. Please check the remarks and resubmit.",
  RESUBMITTED: "Your corrected application has been resubmitted for review.",
  PAYMENT_PENDING: "Your fees are being assessed. Check your Statement of Account for details.",
  PAID: "Your payment has been verified. Your permit is being prepared.",
  PERMIT_PREPARED: "Your business permit is being prepared for printing.",
  READY_FOR_RELEASE: "Your business permit is ready for claim! Please visit BPLO with a valid ID.",
  RELEASED: "Your business permit has been successfully released. Thank you!",
  COMPLETED: "Your permit application is complete.",
  REJECTED: "Your application has been rejected. Please contact BPLO for more information.",
  CANCELLED: "Your application has been cancelled.",
};

export function ApplicationTracker({
  currentStatus,
  applicationId,
  businessName,
}: ApplicationTrackerProps) {
  const currentStepIndex = statusToStepIndex[currentStatus] ?? 0;
  const isReturned = currentStatus === "RETURNED_FOR_CORRECTION";
  const isRejected = currentStatus === "REJECTED" || currentStatus === "CANCELLED";

  const getStepStatus = (index: number) => {
    if (isReturned && index === currentStepIndex) return "error";
    if (index < currentStepIndex) return "completed";
    if (index === currentStepIndex) return "current";
    return "pending";
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 md:text-2xl">{businessName}</h2>
        <p className="text-gray-600 mt-1 text-sm">Application ID: {applicationId}</p>

        {isReturned && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">Action Required</h4>
              <p className="text-sm text-red-800 mt-1">
                Your application has been returned for correction. Please check the
                remarks and resubmit.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">Application {currentStatus === "REJECTED" ? "Rejected" : "Cancelled"}</h4>
              <p className="text-sm text-red-800 mt-1">
                Please contact BPLO for more information.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Tracker */}
      <div className="relative overflow-x-auto">
        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200">
          <div
            className={`h-full transition-all duration-500 ${
              isReturned || isRejected ? "bg-red-500" : "bg-green-600"
            }`}
            style={{
              width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between min-w-[640px]">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const { Icon } = step;

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                {/* Circle */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10 ${
                    status === "completed"
                      ? "bg-green-600 border-green-600"
                      : status === "current"
                      ? isReturned
                        ? "bg-red-600 border-red-600"
                        : "bg-green-600 border-green-600"
                      : status === "error"
                      ? "bg-red-600 border-red-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {status === "completed" ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : status === "current" || status === "error" ? (
                    <Icon className="w-6 h-6 text-white" />
                  ) : (
                    <Icon className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                {/* Label */}
                <div className="mt-3 text-center px-1">
                  <p
                    className={`text-xs font-medium md:text-sm ${
                      status === "completed" || status === "current" || status === "error"
                        ? "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  {status === "current" && !isReturned && (
                    <p className="text-xs text-green-600 mt-0.5">In Progress</p>
                  )}
                  {status === "error" && (
                    <p className="text-xs text-red-600 mt-0.5">Needs Correction</p>
                  )}
                  {status === "completed" && (
                    <p className="text-xs text-green-600 mt-0.5 flex items-center justify-center gap-0.5">
                      <Check className="w-3 h-3" /> Done
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Description */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4 md:p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Current Status</h3>
        <p className="text-gray-700 text-sm md:text-base">
          {statusDescriptions[currentStatus] ?? "Status information not available."}
        </p>
      </div>
    </div>
  );
}
