"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface SlotReservation {
  id: string;
  confirmationNumber: string;
  scheduleDate: string;
  timeSlotStart: string;
  timeSlotEnd: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  rescheduledFrom?: string;
}

interface RenewalClaimScheduleResponse {
  upcomingAppointment: SlotReservation | null;
  pastAppointments: SlotReservation[];
  availableSlots: number;
  message: string;
}

/**
 * RenewalClaimScheduleContent — Manages permit claim scheduling
 * Shows upcoming appointments, allows rescheduling, and displays available slots
 */
export function RenewalClaimScheduleContent() {
  const { data, isLoading, error } = useQuery<RenewalClaimScheduleResponse>({
    queryKey: ["renewal-claim-schedule"],
    queryFn: async () => {
      const res = await fetch("/api/renewals/claim-schedule");

      if (!res.ok) {
        throw new Error("Failed to fetch claim schedule");
      }

      return res.json();
    },
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">
              Unable to load your claim schedule. Please try again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string): string => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Upcoming Appointment */}
      {data?.upcomingAppointment ? (
        <>
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-green-900">
                Upcoming Claim Appointment
              </CardTitle>
              <Badge className={getStatusColor(data.upcomingAppointment.status)}>
                {data.upcomingAppointment.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-600">
                    Date
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    {formatDate(data.upcomingAppointment.scheduleDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-600">
                    Time
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Clock className="h-5 w-5 text-green-600" />
                    {formatTime(data.upcomingAppointment.timeSlotStart)} -{" "}
                    {formatTime(data.upcomingAppointment.timeSlotEnd)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-white p-3">
                <p className="text-xs font-semibold uppercase text-gray-600">
                  Confirmation Number
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-gray-900">
                  {data.upcomingAppointment.confirmationNumber}
                </p>
              </div>

              <div className="flex gap-2 pt-2 sm:flex-col">
                <Link href="/dashboard/renew/claim-schedule/reschedule" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Reschedule Appointment
                  </Button>
                </Link>
                <Button className="flex-1 sm:w-full">
                  Print Confirmation
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-lg">Before Your Appointment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    Have your confirmation number ready
                  </p>
                  <p className="text-sm text-gray-600">
                    {data.upcomingAppointment.confirmationNumber}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    Bring a valid ID for verification
                  </p>
                  <p className="text-sm text-gray-600">
                    Driver&rsquo;s License, Passport, or National ID
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Arrive 5-10 minutes early</p>
                  <p className="text-sm text-gray-600">
                    BPLO Office, City Hall Compound
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-12">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertTriangle className="mb-4 h-12 w-12 text-orange-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                No Appointment Scheduled
              </h3>
              <p className="mb-6 text-sm text-gray-600">
                You haven&rsquo;t scheduled a permit claim appointment yet.
              </p>
              <Button>Schedule Appointment</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Appointments */}
      {data?.pastAppointments && data.pastAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Past Appointments ({data.pastAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.pastAppointments.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center justify-between rounded-lg border p-4 sm:flex-col sm:items-start sm:gap-3"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(appt.scheduleDate)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatTime(appt.timeSlotStart)} - {formatTime(appt.timeSlotEnd)}
                  </p>
                </div>
                <Badge className={getStatusColor(appt.status)}>
                  {appt.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">BPLO Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <MapPin className="h-5 w-5 flex-shrink-0 text-red-600" />
            <div>
              <p className="font-medium text-gray-900">Address</p>
              <p className="text-sm text-gray-600">City Hall Compound, Quezon City</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Clock className="h-5 w-5 flex-shrink-0 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Office Hours</p>
              <p className="text-sm text-gray-600">Monday - Friday, 8:00 AM - 5:00 PM</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
