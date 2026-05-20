import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/use-page-title";

export default function LoginPage() {
  usePageTitle("Login");
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.password || (!form.username && !form.email)) {
      toast.error("Enter a username or email and password");
      return;
    }

    setLoading(true);
    try {
      await login(form);
      toast.success("Logged in");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error("Login failed", {
        description: error instanceof Error ? error.message : "Please check your credentials",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl border-border/40 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-bold leading-none text-primary-foreground tracking-tight bg-primary px-2 py-1">MXT</span>
            <span className="font-serif-brand text-[13px] leading-none text-foreground/80 tracking-tight lowercase">smsglobal</span>
          </div>
          <CardTitle className="pt-4 text-xl">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} autoComplete="username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Login
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-[13px] text-muted-foreground">
            <Link to="/register" className="text-primary hover:underline">Customer register</Link>
            <Link to="/admin-register" className="text-primary hover:underline">Admin register</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

