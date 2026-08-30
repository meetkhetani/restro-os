"use client";

import * as React from "react";
import {
  Calendar,
  Users,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Phone,
  Mail,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  Reservation,
  ReservationStatus,
  TableItemExtended,
} from "@/domain/tables/types";
import {
  createReservation,
  updateReservationStatus,
} from "@/domain/tables/actions";

interface ReservationsViewProps {
  reservations: Reservation[];
  availableTables: TableItemExtended[];
  onRefresh: () => void;
}

export function ReservationsView({
  reservations,
  availableTables,
  onRefresh,
}: ReservationsViewProps) {
  const { addToast } = useToast();

  const [isNewBookingOpen, setIsNewBookingOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // New Booking Form
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [partySize, setPartySize] = React.useState(2);
  const [reservationTime, setReservationTime] = React.useState(
    new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16)
  );
  const [selectedTableId, setSelectedTableId] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      addToast({
        type: "error",
        title: "Validation Error",
        description: "Customer name is required.",
      });
      return;
    }

    setIsSubmitting(true);
    const res = await createReservation({
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim() || undefined,
      customer_email: customerEmail.trim() || undefined,
      party_size: Number(partySize),
      reservation_time: new Date(reservationTime).toISOString(),
      table_id: selectedTableId || undefined,
      notes: notes.trim() || undefined,
    });

    if (res.success) {
      addToast({
        type: "success",
        title: "Reservation Created",
        description: `Booking for ${customerName} confirmed.`,
      });
      setIsNewBookingOpen(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setNotes("");
      onRefresh();
    } else {
      addToast({
        type: "error",
        title: "Booking Failed",
        description: res.error || "Failed to create reservation.",
      });
    }
    setIsSubmitting(false);
  };

  const handleStatusChange = async (
    reservationId: string,
    status: ReservationStatus
  ) => {
    const res = await updateReservationStatus(reservationId, status);
    if (res.success) {
      addToast({
        type: "success",
        title: "Reservation Updated",
        description: "Reservation updated successfully.",
      });
      onRefresh();
    } else {
      addToast({
        type: "error",
        title: "Error",
        description: res.error || "Failed to update reservation status.",
      });
    }
  };

  const getStatusBadge = (s: ReservationStatus) => {
    const styles: Record<ReservationStatus, string> = {
      confirmed: "bg-blue-100 text-blue-800 border-blue-300",
      seated: "bg-emerald-100 text-emerald-800 border-emerald-300",
      completed: "bg-purple-100 text-purple-800 border-purple-300",
      cancelled: "bg-red-100 text-red-800 border-red-300",
      no_show: "bg-amber-100 text-amber-800 border-amber-300",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border ${styles[s]}`}>
        {s.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-restro-200 pb-3">
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-brand-500" />
          <h3 className="text-base font-extrabold text-restro-900 tracking-tight">
            Guest Reservations ({reservations.length})
          </h3>
        </div>

        <Button size="sm" onClick={() => setIsNewBookingOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New Reservation
        </Button>
      </div>

      {/* Reservations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reservations.map((res) => (
          <Card
            key={res.id}
            className="p-4 bg-surface border-restro-200 shadow-card space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-extrabold text-restro-900">{res.customer_name}</h4>
                  <span className="text-xs font-bold text-brand-600 flex items-center gap-1 mt-0.5">
                    <Users className="h-3.5 w-3.5 inline" /> {res.party_size} Guests
                  </span>
                </div>
                {getStatusBadge(res.status)}
              </div>

              <div className="space-y-1 text-xs text-restro-600">
                <div className="flex items-center gap-1.5 font-semibold text-restro-800">
                  <Clock className="h-3.5 w-3.5 text-purple-500" />
                  {new Date(res.reservation_time).toLocaleString()}
                </div>
                {res.customer_phone && (
                  <div className="flex items-center gap-1.5 text-restro-500">
                    <Phone className="h-3 w-3" /> {res.customer_phone}
                  </div>
                )}
                {res.table && (
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                    <Utensils className="h-3 w-3" /> Assigned: Table {res.table.table_number} ({res.table.floor_area})
                  </div>
                )}
                {res.notes && (
                  <p className="text-[11px] text-amber-700 italic bg-amber-50 p-1.5 rounded border border-amber-200">
                    Note: {res.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-restro-200 flex items-center justify-between gap-2">
              {res.status === "confirmed" && (
                <>
                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleStatusChange(res.id, "seated")}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Seat Guests
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200"
                    onClick={() => handleStatusChange(res.id, "cancelled")}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}

              {res.status === "seated" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-purple-700 border-purple-200"
                  onClick={() => handleStatusChange(res.id, "completed")}
                >
                  Mark Completed
                </Button>
              )}
            </div>
          </Card>
        ))}

        {reservations.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-restro-400 bg-surface rounded-xl border border-restro-200">
            <Calendar className="h-10 w-10 text-restro-300 mb-2" />
            <p className="text-xs font-semibold">No reservations found for this branch.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setIsNewBookingOpen(true)}>
              Book Reservation
            </Button>
          </div>
        )}
      </div>

      {/* New Booking Modal */}
      {isNewBookingOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateBooking}
            className="bg-surface rounded-xl shadow-dialog max-w-md w-full p-5 space-y-3.5 border border-restro-200 animate-in fade-in zoom-in-95"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-extrabold text-restro-900">New Guest Reservation</h3>
                <p className="text-xs text-restro-500">Record customer table booking</p>
              </div>
              <button type="button" onClick={() => setIsNewBookingOpen(false)} className="text-restro-400 hover:text-restro-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <Input
              label="Customer Full Name"
              placeholder="e.g. Eleanor Vance"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Phone Number"
                placeholder="+1 555-0192"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <Input
                label="Email Address"
                placeholder="eleanor@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Party Size (Guests)"
                type="number"
                min="1"
                max="20"
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                required
              />
              <Input
                label="Date & Time"
                type="datetime-local"
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-restro-700">Assign Table (Optional)</label>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full bg-background border border-restro-200 rounded-lg p-2 text-xs font-semibold"
              >
                <option value="">-- Assign Table Later --</option>
                {availableTables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Table {t.table_number} ({t.floor_area}) [{t.capacity} seats]
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Special Notes"
              placeholder="e.g. Birthday celebration, High chair needed"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex justify-end space-x-2 pt-2 border-t border-restro-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewBookingOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSubmitting} disabled={isSubmitting}>
                Save Booking
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
