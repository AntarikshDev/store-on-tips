import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface HeaderConfig {
  logo_position: 'left' | 'center';
  show_store_name: boolean;
  nav_links: { label: string; href: string }[];
}

const DEFAULT_HEADER: HeaderConfig = {
  logo_position: 'left',
  show_store_name: true,
  nav_links: [
    { label: 'Home', href: '' },
    { label: 'Shop', href: '#products' },
    { label: 'Blog', href: '/blog' },
  ],
};

interface Props {
  config: HeaderConfig;
  onChange: (c: HeaderConfig) => void;
}

const HeaderEditor = ({ config, onChange }: Props) => {
  const c = { ...DEFAULT_HEADER, ...config };

  const updateNavLink = (index: number, field: 'label' | 'href', value: string) => {
    const links = [...c.nav_links];
    links[index] = { ...links[index], [field]: value };
    onChange({ ...c, nav_links: links });
  };

  const addNavLink = () => {
    onChange({ ...c, nav_links: [...c.nav_links, { label: 'Link', href: '/' }] });
  };

  const removeNavLink = (index: number) => {
    onChange({ ...c, nav_links: c.nav_links.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Logo & Branding</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Logo Position</Label>
              <Select value={c.logo_position} onValueChange={(v: 'left' | 'center') => onChange({ ...c, logo_position: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <Switch checked={c.show_store_name} onCheckedChange={(v) => onChange({ ...c, show_store_name: v })} />
              <Label className="text-xs">Show store name beside logo</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Navigation Links</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {c.nav_links.map((link, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input value={link.label} onChange={(e) => updateNavLink(i, 'label', e.target.value)} className="h-8 text-sm" placeholder="Label" />
              <Input value={link.href} onChange={(e) => updateNavLink(i, 'href', e.target.value)} className="h-8 text-sm" placeholder="/path" />
              <button onClick={() => removeNavLink(i)} className="text-destructive text-xs shrink-0">✕</button>
            </div>
          ))}
          <button onClick={addNavLink} className="text-xs text-primary hover:underline">+ Add link</button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HeaderEditor;
export { DEFAULT_HEADER };
