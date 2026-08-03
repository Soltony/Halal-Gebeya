'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { IFB } from '@/lib/ifb-terminology';

export function DisbursementControlClient({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const { toast } = useToast();
  const [enabled, setEnabled] = React.useState(initialEnabled);
  const [saving, setSaving] = React.useState(false);

  const onToggle = async (next: boolean) => {
    setEnabled(next);
    setSaving(true);

    try {
      const res = await fetch('/api/settings/disbursement-control', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEnabled(!next);
        toast({
          title: 'Update failed',
          description: data?.error ? String(data.error) : `Failed to update ${IFB.financingReleaseControl.toLowerCase()}.`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: next ? 'Financing releases enabled' : 'Financing releases disabled',
        description: next
          ? 'All financing release endpoints are now active.'
          : 'All financing release endpoints are now blocked.',
      });
    } catch (e: any) {
      setEnabled(!next);
      toast({
        title: 'Network error',
        description: String(e?.message ?? e),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{IFB.financingReleaseControl}</CardTitle>
          <CardDescription>
            Toggle to stop all financing releases (external + internal) immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-1">
              <Label htmlFor="disbursements-enabled">Financing releases enabled</Label>
              <div className="text-sm text-muted-foreground">
                {enabled ? 'Enabled' : 'Disabled'}{saving ? ' (saving...)' : ''}
              </div>
            </div>
            <Switch
              id="disbursements-enabled"
              checked={enabled}
              onCheckedChange={onToggle}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
