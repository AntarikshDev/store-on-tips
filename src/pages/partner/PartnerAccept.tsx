import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

const PartnerAccept = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<{ email: string; partner_name?: string; partner_type?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setError("Missing invite token"); setLoading(false); return; }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("partner-accept", {
          body: { token, action: "validate" },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Invalid invite");
        setInvite({ email: data.email, partner_name: data.partner_name, partner_type: data.partner_type });
        setFullName(data.partner_name || "");
      } catch (e: any) {
        setError(e.message || "Invalid invite");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("partner-accept", {
        body: { token, action: "accept", password, full_name: fullName },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Could not accept invite");

      // Auto sign in
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: invite!.email,
        password,
      });
      if (signErr) throw signErr;
      setDone(true);
      toast.success("Welcome to Pic To Cart Partner Program!");
      setTimeout(() => navigate("/partner"), 1200);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Invalid invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate("/")}>Go home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="text-xs font-bold text-orange-600 tracking-widest mb-2">PIC TO CART</div>
          <CardTitle className="text-2xl">
            {done ? "You're in!" : "Accept your invite"}
          </CardTitle>
          <CardDescription>
            {done ? "Redirecting to your partner dashboard…" : `Invited as ${invite?.partner_type} • ${invite?.email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="flex justify-center py-6">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
                <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters.</p>
              </div>
              <div>
                <Label>Confirm password</Label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
              </div>
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Accept & set password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerAccept;
