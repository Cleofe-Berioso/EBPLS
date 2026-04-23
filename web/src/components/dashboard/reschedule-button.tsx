"use client";

import { useState, useEffect } from "react";
import { CalendarCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { toast } from "sonner";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentCount: number;
  isActive: boolean;
}

interface Schedule {
  id: string;
  date: string;
  isBlocked: boolean;
  timeSlots: TimeSlot[];
}

interface RescheduleButtonProps {
  applicationId: string;
  applicationNumber: string;
}

export function RescheduleButton({
  applicationId,
  applicationNumber,
}: RescheduleButtonProps) {
  const [open, setOpen] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && schedules.length === 0) {
      setFetchLoading(true);
      fetch("/api/schedules")
        .then((r) => r.json())
        .then((d) => {
          setSchedules(d.schedules || []);
        })
        .catch(() => setError("Failed to load schedules"))
        .finally(() => setFetchLoading(false));
    }
  }, [open, schedules.length]);

  const selectedSchedule = schedules.find((s) => s.date === selectedDate);
  const availableSlots = selectedSchedule?.timeSlots.filter(
    (s) => s.isActive && s.currentCount < s.maxCapacity
  );

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/schedules/reschedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, newTimeSlotId: selectedSlot }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reschedule");
        return;
      }
      toast.success("Appointment rescheduled! A confirmation email has been sent.");
      setOpen(false);
      // Reload to show updated schedule
      window.location.reload();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-2"
        onClick={() => setOpen(true)}
      >
        <CalendarCheck className="h-4 w-4 mr-2" />
        Reschedule
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Reschedule Claiming Appointment
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Select a new date and time for picking up the permit for{" "}
                <strong>{applicationNumber}</strong>.
              </p>

              {error && (
                <Alert variant="error" onClose={() => setError("")}>
                  {error}
                </Alert>
              )}

              {fetchLoading ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Loading available schedules…
                </p>
              ) : (
                <>
                  {/* Date selection */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Select Date
                    </label>
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {schedules
                        .filter((s) => !s.isBlocked)
                        .filter(
                          (s) =>
                            s.timeSlots.some(
                              (ts) =>
                                ts.isActive && ts.currentCount < ts.maxCapacity
                            )
                        )
                        .map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSelectedDate(s.date);
                              setSelectedSlot(null);
                            }}
                            className={`rounded-lg border p-2 text-xs font-medium transition-colors ${
                              selectedDate === s.date
                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            {new Date(s.date).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                            })}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Time slot selection */}
                  {selectedDate && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Select Time Slot
                      </label>
                      {availableSlots && availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedSlot(slot.id)}
                              className={`rounded-lg border p-2 text-xs font-medium transition-colors ${
                                selectedSlot === slot.id
                                  ? "border-blue-600 bg-blue-50 text-blue-700"
                                  : "border-gray-200 hover:border-gray-300 text-gray-700"
                              }`}
                            >
                              {slot.startTime} – {slot.endTime}
                              <span className="block text-gray-500">
                                {slot.maxCapacity - slot.currentCount} slot(s) left
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No available time slots for this date.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t p-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedSlot || loading}
                onClick={handleReschedule}
              >
                {loading ? "Rescheduling…" : "Confirm Reschedule"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
