import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface AdminLoginProps {
  onLogin: () => void;
}

const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setChecking(true);
    try {
      let storedPassword = "1122";
      const { data, error: fetchError } = await (supabase as any)
        .from("admin_settings")
        .select("admin_password")
        .eq("id", 1)
        .maybeSingle();
      if (!fetchError && data?.admin_password) {
        storedPassword = data.admin_password;
      }
      if (username === "superadmin" && password === storedPassword) {
        sessionStorage.setItem("admin_logged_in", "true");
        onLogin();
      } else {
        setError("Invalid username or password");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background:
          "repeating-linear-gradient(to right, hsl(var(--solea-pink)), hsl(var(--solea-pink)) 40px, hsl(var(--solea-beige)) 40px, hsl(var(--solea-beige)) 80px)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-2xl shadow-xl p-8 w-full max-w-[340px] flex flex-col items-center gap-5 border border-border"
      >
        <p className="font-serif font-black text-4xl text-foreground">soléa</p>
        <p className="font-serif text-xs text-muted-foreground tracking-widest uppercase -mt-3">
          Admin Portal
        </p>

        <div className="w-full flex flex-col gap-3 mt-2">
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            className="font-serif"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            className="font-serif"
          />
        </div>

        {error && (
          <p className="text-destructive font-serif text-sm">{error}</p>
        )}

        <Button type="submit" disabled={checking} className="w-full font-serif font-bold">
          {checking ? "Checking…" : "Sign In"}
        </Button>
      </form>
    </div>
  );
};

export default AdminLogin;
