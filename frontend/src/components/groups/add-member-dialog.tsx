"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addMemberSchema, AddMemberFormData } from "@/features/groups/schemas";
import { useAddMember } from "@/features/groups/hooks";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Mail } from "lucide-react";
import { NormalizedError } from "@/lib/api/errors";

interface AddMemberDialogProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddMemberDialog({ groupId, isOpen, onClose }: AddMemberDialogProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const addMemberMutation = useAddMember(groupId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  });

  const onSubmit = async (data: AddMemberFormData) => {
    setErrorMsg(null);
    try {
      await addMemberMutation.mutateAsync(data);
      reset();
      onClose();
    } catch (err: unknown) {
      const error = err as NormalizedError;
      setErrorMsg(error?.message || "Failed to add member. Ensure user exists and is not already added.");
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add Group Member"
      description="Add a registered user directly to this expense group by their email"
    >
      {errorMsg && (
        <Alert variant="error" title="Failed to Add Member" className="mb-4">
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Registered User Email"
          type="email"
          placeholder="bob@example.com"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Select
          label="Member Role"
          options={[
            { value: "MEMBER", label: "Member — Can add and participate in expenses" },
            { value: "ADMIN", label: "Admin — Full management permissions" },
          ]}
          error={errors.role?.message}
          {...register("role")}
        />

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={addMemberMutation.isPending}>
            Add Member
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
