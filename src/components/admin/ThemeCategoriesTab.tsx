import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useThemeCategories, type ThemeCategoryBrief } from '@/hooks/useThemeCategories';

const empty: Partial<ThemeCategoryBrief> = {
  vertical: '',
  subcategory: 'general',
  display_name: '',
  icon: '',
  sort_order: 0,
  is_active: true,
  merchant_facing: true,
};

const CategoryForm = ({
  initial,
  onClose,
}: {
  initial: Partial<ThemeCategoryBrief>;
  onClose: () => void;
}) => {
  const [form, setForm] = useState<Partial<ThemeCategoryBrief>>(initial);
  const qc = useQueryClient();
  const isEdit = !!initial.id;

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        vertical: form.vertical?.trim().toLowerCase(),
        subcategory: form.subcategory?.trim().toLowerCase() || 'general',
        display_name: form.display_name?.trim(),
        icon: form.icon?.trim() || null,
        sort_order: Number(form.sort_order ?? 0) || 0,
        is_active: form.is_active ?? true,
        merchant_facing: form.merchant_facing ?? true,
      };
      if (!payload.vertical || !payload.display_name) {
        throw new Error('Vertical and display name are required');
      }
      if (isEdit) {
        const { error } = await supabase
          .from('theme_category_briefs')
          .update(payload)
          .eq('id', initial.id!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('theme_category_briefs').insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Category updated' : 'Category created');
      qc.invalidateQueries({ queryKey: ['theme-categories'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Vertical (slug)</Label>
          <Input
            value={form.vertical || ''}
            onChange={(e) => setForm({ ...form, vertical: e.target.value })}
            placeholder="fashion"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Subcategory</Label>
          <Input
            value={form.subcategory || ''}
            onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
            placeholder="general"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Display name</Label>
        <Input
          value={form.display_name || ''}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          placeholder="Fashion & Apparel"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Icon (lucide name, optional)</Label>
          <Input
            value={form.icon || ''}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="Shirt"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Sort order</Label>
          <Input
            type="number"
            value={form.sort_order ?? 0}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div className="flex items-center gap-6 pt-2 flex-wrap">
        <label className="flex items-center gap-2 text-xs">
          <Switch
            checked={form.is_active ?? true}
            onCheckedChange={(v) => setForm({ ...form, is_active: v })}
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-xs">
          <Switch
            checked={form.merchant_facing ?? true}
            onCheckedChange={(v) => setForm({ ...form, merchant_facing: v })}
          />
          Show in merchant onboarding
        </label>
      </div>
      <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
        {save.isPending ? 'Saving…' : isEdit ? 'Update Category' : 'Create Category'}
      </Button>
    </div>
  );
};

const CategoriesTab = () => {
  const { data: categories = [], isLoading } = useThemeCategories({ adminAll: true });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ThemeCategoryBrief | null>(null);
  const qc = useQueryClient();

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('theme_category_briefs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Category deleted');
      qc.invalidateQueries({ queryKey: ['theme-categories'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} — used by theme master form, generator, and merchant onboarding.
        </p>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Theme Category</DialogTitle>
            </DialogHeader>
            <CategoryForm initial={empty} onClose={() => setCreating(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading…</CardContent>
        </Card>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No categories yet. Add one to populate the theme dropdowns and merchant onboarding picker.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Card key={c.id} className={c.is_active ? '' : 'opacity-60'}>
              <CardContent className="p-3 flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Tag className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-sm truncate">{c.display_name}</p>
                    {!c.is_active && <Badge variant="destructive" className="text-[9px]">Inactive</Badge>}
                    {!c.merchant_facing && <Badge variant="secondary" className="text-[9px]">Internal</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {c.vertical}/{c.subcategory} · sort {c.sort_order}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Dialog open={editing?.id === c.id} onOpenChange={(o) => !o && setEditing(null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Edit {c.display_name}</DialogTitle>
                      </DialogHeader>
                      {editing && <CategoryForm initial={editing} onClose={() => setEditing(null)} />}
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      if (confirm(`Delete "${c.display_name}"?`)) remove.mutate(c.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesTab;
