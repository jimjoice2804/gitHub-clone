'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { organizationApi } from '@/lib/api/organization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(39, 'Name must be less than 39 characters')
    .regex(/^[a-z0-9-]+$/, 'Name can only contain lowercase letters, numbers, and hyphens'),
  displayName: z.string().min(1, 'Display name is required').max(100),
  description: z.string().max(500).optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  location: z.string().max(100).optional(),
  email: z.string().email('Must be a valid email').optional().or(z.literal('')),
});

type CreateOrgForm = z.infer<typeof schema>;

interface Props {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateOrganizationDialog({ children, onSuccess }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOrgForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: CreateOrgForm) => {
    try {
      setIsSubmitting(true);
      const org = await organizationApi.createOrganization({
        ...values,
        website: values.website || undefined,
        email: values.email || undefined,
      });
      toast.success('Organization created');
      setOpen(false);
      reset();
      if (onSuccess) onSuccess();
      else router.push(`/organizations/${org.name}`);
    } catch (error) {
      const e = error as { message?: string };
      toast.error(e?.message || 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children ?? <Button>New organization</Button>}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a new organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Organization name *</label>
              <Input placeholder="my-organization" {...register('name')} />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
              <p className="text-xs text-gray-500 mt-1">Lowercase, alphanumeric, hyphens only</p>
            </div>
            <div>
              <label className="text-sm font-medium">Display name *</label>
              <Input placeholder="My Organization" {...register('displayName')} />
              {errors.displayName && (
                <p className="text-sm text-red-600 mt-1">{errors.displayName.message}</p>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="What does your organization do?"
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Website</label>
              <Input placeholder="https://example.com" {...register('website')} />
              {errors.website && (
                <p className="text-sm text-red-600 mt-1">{errors.website.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input placeholder="San Francisco, CA" {...register('location')} />
              {errors.location && (
                <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input placeholder="contact@example.com" type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create organization
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
