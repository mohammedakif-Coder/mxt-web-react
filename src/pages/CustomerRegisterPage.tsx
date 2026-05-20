import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageTitle } from "@/hooks/use-page-title";

export default function CustomerRegisterPage() {
  usePageTitle("Customer Register");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    company_name: "",
    contact_name: "",
    contact_email: "",
    contact_mobile: "",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await authApi.registerMxtCustomer(form);
      toast.success("Customer account created");
      navigate("/login");
    } catch (error) {
      toast.error("Registration failed", {
        description: error instanceof Error ? error.message : "Please check the form and try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg rounded-2xl border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle>Customer register</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="username" label="Username" value={form.username} onChange={(value) => setForm({ ...form, username: value })} />
              <Field id="password" label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
            </div>
            <Field id="company_name" label="Company name" value={form.company_name} onChange={(value) => setForm({ ...form, company_name: value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="contact_name" label="Contact name" value={form.contact_name} onChange={(value) => setForm({ ...form, contact_name: value })} />
              <Field id="contact_mobile" label="Contact mobile" value={form.contact_mobile} onChange={(value) => setForm({ ...form, contact_mobile: value })} />
            </div>
            <Field id="contact_email" label="Contact email" type="email" value={form.contact_email} onChange={(value) => setForm({ ...form, contact_email: value })} />
            <Button type="submit" className="rounded-xl" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Create customer account
            </Button>
          </form>
          <Link to="/login" className="mt-4 block text-center text-[13px] text-primary hover:underline">Back to login</Link>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} required />
    </div>
  );
}

