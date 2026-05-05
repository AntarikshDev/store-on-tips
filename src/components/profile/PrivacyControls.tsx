import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Download, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const PrivacyControls = () => {
  const [exporting, setExporting] = useState(false);
  const [reason, setReason] = useState('');
  const [requesting, setRequesting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/account-export`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pictocart-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (e: any) {
      toast.error(e.message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteRequest = async () => {
    setRequesting(true);
    try {
      const { error } = await supabase.functions.invoke('account-delete-request', { body: { reason } });
      if (error) throw error;
      toast.success('Deletion request submitted. You will hear from us within 7 days.');
      setReason('');
    } catch (e: any) {
      toast.error(e.message ?? 'Could not submit request');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" />
          Data &amp; Privacy
        </CardTitle>
        <CardDescription>Download your data or request account deletion (DPDP-compliant).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Export your data</p>
            <p className="text-xs text-muted-foreground">Download a JSON copy of your profile, stores, products, and orders.</p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-destructive/30 p-4">
          <div>
            <p className="text-sm font-medium text-destructive">Request account deletion</p>
            <p className="text-xs text-muted-foreground">Processed within 7 days. Stores and data will be permanently removed.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">Request Deletion</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Request account deletion?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your stores, products, orders, and customer data will be permanently deleted within 7 days. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional: tell us why you're leaving"
                rows={3}
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRequest} disabled={requesting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {requesting ? 'Submitting…' : 'Confirm request'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
