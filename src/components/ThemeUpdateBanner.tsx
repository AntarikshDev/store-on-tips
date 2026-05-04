import { useState } from 'react';
import { useThemeUpdate } from '@/hooks/useThemeUpdate';
import { useStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const ThemeUpdateBanner = () => {
  const { data: info } = useThemeUpdate();
  const { store, setStore } = useStore();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!info?.hasUpdate || !store) return null;

  const apply = async () => {
    setBusy(true);
    const { error } = await supabase
      .from('stores')
      .update({ installed_theme_version: info.currentVersion } as any)
      .eq('id', store.id);
    if (error) {
      toast.error('Could not apply update');
    } else {
      setStore({ ...store, installed_theme_version: info.currentVersion } as any);
      qc.invalidateQueries({ queryKey: ['theme-update'] });
      toast.success(`Updated ${info.themeName} to v${info.currentVersion}`);
      setOpen(false);
    }
    setBusy(false);
  };

  const dismiss = async () => {
    const { error } = await supabase
      .from('stores')
      .update({ theme_update_dismissed_version: info.currentVersion } as any)
      .eq('id', store.id);
    if (!error) {
      setStore({ ...store, theme_update_dismissed_version: info.currentVersion } as any);
      qc.invalidateQueries({ queryKey: ['theme-update'] });
    }
  };

  return (
    <>
      <div className="rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3 sm:p-4 flex items-start gap-3">
        <div className="rounded-full bg-primary/15 p-2 shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">Theme update available</p>
            <Badge variant="secondary" className="text-[10px]">
              {info.installedVersion ? `v${info.installedVersion} → ` : ''}v{info.currentVersion}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            A new version of <strong>{info.themeName}</strong> is ready. Review what's new and apply when you're ready.
          </p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={() => setOpen(true)}>Review & Apply</Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>Later</Button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground p-1"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {info.themeName} — v{info.currentVersion}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {info.newerVersions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No release notes available.</p>
            ) : (
              info.newerVersions.map((v) => (
                <div key={v.id} className="border-l-2 border-primary/40 pl-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">v{v.version}</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(v.released_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {v.summary && <p className="text-sm font-medium mt-1">{v.summary}</p>}
                  {v.changelog && (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1">{v.changelog}</p>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={apply} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Apply update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
