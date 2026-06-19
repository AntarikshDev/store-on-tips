import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Eye, Globe, Trash2, RefreshCcw, Home, FileText, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCustomPages } from "@/hooks/useCustomPages";
import CreatePageWizard from "./CreatePageWizard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const BUILTIN_HOME_OPTIONS = [
  { id: "default", label: "Default Home", description: "Your theme's built-in homepage with product sections" },
];

export default function PagesTab({ store, onStoreUpdated }: { store: any; onStoreUpdated?: (patch: any) => void }) {
  const storeId = store?.id;
  const { list, update, remove, generate } = useCustomPages(storeId);
  const pages = list.data || [];
  const [wizardOpen, setWizardOpen] = useState(false);
  const [homeKind, setHomeKind] = useState<string>(store?.home_page_kind || "default");
  const [homePageId, setHomePageId] = useState<string | null>(store?.home_page_id || null);
  const [savingHome, setSavingHome] = useState(false);
  const [regenId, setRegenId] = useState<string | null>(null);

  useEffect(() => {
    setHomeKind(store?.home_page_kind || "default");
    setHomePageId(store?.home_page_id || null);
  }, [store?.home_page_kind, store?.home_page_id]);

  const saveHome = async () => {
    if (!storeId) return;
    setSavingHome(true);
    const patch = {
      home_page_kind: homeKind,
      home_page_id: homeKind === "custom" ? homePageId : null,
    };
    const { error } = await (supabase as any).from("stores").update(patch).eq("id", storeId);
    if (error) toast.error(error.message);
    else {
      toast.success("Home page updated");
      onStoreUpdated?.(patch);
    }
    setSavingHome(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this page? This can't be undone.")) return;
    if (homePageId === id) {
      await (supabase as any).from("stores").update({ home_page_kind: "default", home_page_id: null }).eq("id", storeId);
      setHomeKind("default"); setHomePageId(null);
      onStoreUpdated?.({ home_page_kind: "default", home_page_id: null });
    }
    await remove.mutateAsync(id);
    toast.success("Page deleted");
  };

  const handleRegenerate = async (id: string) => {
    setRegenId(id);
    try {
      await generate.mutateAsync({ page_id: id, regenerate: true });
      toast.success("Page regenerated");
    } catch (e: any) {
      toast.error(e?.message || "Regeneration failed");
    } finally {
      setRegenId(null);
    }
  };

  const publishedPages = pages.filter((p) => p.status === "published");

  return (
    <div className="space-y-6">
      {/* Home page picker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Home className="h-4 w-4" /> Home page</CardTitle>
          <p className="text-xs text-muted-foreground">Choose what visitors see at /store/{store?.slug}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={homeKind === "custom" && homePageId ? `custom:${homePageId}` : "default"}
            onValueChange={(v) => {
              if (v === "default") { setHomeKind("default"); setHomePageId(null); }
              else { setHomeKind("custom"); setHomePageId(v.replace("custom:", "")); }
            }}
            className="space-y-2"
          >
            {BUILTIN_HOME_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30">
                <RadioGroupItem value={opt.id} className="mt-1" />
                <div>
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.description}</div>
                </div>
              </label>
            ))}
            {publishedPages.map((p) => (
              <label key={p.id} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30">
                <RadioGroupItem value={`custom:${p.id}`} className="mt-1" />
                <div className="flex-1">
                  <div className="font-medium text-sm flex items-center gap-2">{p.title} <Badge variant="secondary" className="text-[10px]">Custom</Badge></div>
                  <div className="text-xs text-muted-foreground">{p.description || `/p/${p.slug}`}</div>
                </div>
              </label>
            ))}
            {publishedPages.length === 0 && (
              <p className="text-xs text-muted-foreground italic px-2">Publish a custom page below to use it as your home page.</p>
            )}
          </RadioGroup>
          <Button size="sm" onClick={saveHome} disabled={savingHome || (homeKind === "custom" && !homePageId)}>
            {savingHome ? "Saving…" : "Save home page"}
          </Button>
        </CardContent>
      </Card>

      {/* Custom pages list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Custom pages</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Build investor, team, press, or any page you need with AI.</p>
          </div>
          <Button size="sm" onClick={() => setWizardOpen(true)} className="gap-1.5">
            <Sparkles className="h-4 w-4" /> Create with AI
          </Button>
        </CardHeader>
        <CardContent>
          {list.isLoading ? (
            <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline-block text-muted-foreground" /></div>
          ) : pages.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed rounded-lg">
              <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No custom pages yet.</p>
              <Button size="sm" variant="link" onClick={() => setWizardOpen(true)}>Create your first one</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {pages.map((p) => (
                <div key={p.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{p.title}</span>
                      <Badge variant={p.status === "published" ? "default" : "secondary"} className="text-[10px]">{p.status}</Badge>
                      <span className="text-xs text-muted-foreground">/p/{p.slug}</span>
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <Switch
                          checked={p.show_in_nav}
                          onCheckedChange={(v) => update.mutate({ id: p.id, patch: { show_in_nav: v } })}
                        />
                        <span>Show in nav</span>
                      </label>
                      <span className="text-muted-foreground">{p.credits_spent} credits used</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/store/${store?.slug}/p/${p.slug}`} target="_blank"><Eye className="h-3.5 w-3.5 mr-1" /> Preview</Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRegenerate(p.id)} disabled={regenId === p.id}>
                      {regenId === p.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5 mr-1" />} Regenerate
                    </Button>
                    {p.status === "draft" ? (
                      <Button size="sm" onClick={() => update.mutate({ id: p.id, patch: { status: "published" } })}>
                        <Globe className="h-3.5 w-3.5 mr-1" /> Publish
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: p.id, patch: { status: "draft" } })}>
                        Unpublish
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {storeId && <CreatePageWizard storeId={storeId} open={wizardOpen} onOpenChange={setWizardOpen} />}
    </div>
  );
}
