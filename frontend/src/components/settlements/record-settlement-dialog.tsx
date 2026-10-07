"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recordSettlementSchema, RecordSettlementFormData } from "@/features/settlements/schemas";
import { useRecordSettlement } from "@/features/settlements/hooks";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { GroupMember } from "@/types/api";
import { NormalizedError } from "@/lib/api/errors";

interface RecordSettlementDialogProps {
  groupId: string;
  currency: string;
  members: GroupMember[];
  currentUserId?: string;
  defaultReceiverId?: string;
  defaultAmount?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function RecordSettlementDialog({
  groupId,
  currency,
  members,
  currentUserId,
  defaultReceiverId,
  defaultAmount,
  isOpen,
  onClose,
}: RecordSettlementDialogProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recordMutation = useRecordSettlement(groupId);

  const eligibleReceivers = members.filter((m) => m.user_id !== currentUserId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecordSettlementFormData>({
    resolver: zodResolver(recordSettlementSchema),
    defaultValues: {
      receiver_id: defaultReceiverId || eligibleReceivers[0]?.user_id || "",
      amount: defaultAmount || undefined,
      payment_method: "Cash / Bank Transfer",
      reference_note: "",
    },
  });

  const onSubmit = async (data: RecordSettlementFormData) => {
    setErrorMsg(null);
    try {
      await recordMutation.mutateAsync({
        receiver_id: data.receiver_id,
        amount: Number(data.amount),
        payment_method: data.payment_method || null,
        reference_note: data.reference_note || null,
      });
      reset();
      onClose();
    } catch (err: unknown) {
      const error = err as NormalizedError;
      setErrorMsg(error?.message || "Failed to record settlement payment.");
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Record Direct Payment / Settlement"
      description={`Record a payment you made to another group member in ${currency}`}
    >
      {errorMsg && (
        <Alert variant="error" title="Settlement Failed" className="mb-4">
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Paid To (Receiver)"
          options={eligibleReceivers.map((m) => ({
            value: m.user_id,
            label: `${m.first_name || m.email} (${m.email})`,
          }))}
          emptyMessage="No other members to pay in this group"
          error={errors.receiver_id?.message}
          {...register("receiver_id")}
        />

        <Input
          label={`Amount Paid (${currency})`}
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register("amount")}
        />

        <Input
          label="Payment Method (Optional)"
          placeholder="e.g. UPI, Venmo, Cash, PayPal, Zelle"
          error={errors.payment_method?.message}
          {...register("payment_method")}
        />

        <Input
          label="Reference Note (Optional)"
          placeholder="e.g. Paid for dinner balance"
          error={errors.reference_note?.message}
          {...register("reference_note")}
        />

        {eligibleReceivers.length === 0 && (
          <Alert variant="warning" title="No Eligible Members">
            There are no other members in this group to record payments with. Invite or add members first.
          </Alert>
        )}

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={recordMutation.isPending}
            disabled={recordMutation.isPending || eligibleReceivers.length === 0}
          >
            Record Settlement
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
