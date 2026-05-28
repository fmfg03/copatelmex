import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

const loginSchema = z.object({
  email: z.string().trim().email("Email invalido").max(255),
  password: z.string().min(1, "La contrasena es requerida").max(100),
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email("Email invalido").max(255),
});

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void verifyAdminAccess(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && event === "SIGNED_IN") {
        void verifyAdminAccess(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const verifyAdminAccess = async (userId: string) => {
    if (!userId) {
      return false;
    }

    const { data: roleData, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "moderator"])
      .maybeSingle();

    if (error || !roleData) {
      await supabase.auth.signOut();
      toast({
        variant: "destructive",
        title: "Acceso denegado",
        description: "Este acceso es exclusivo para administradores y operaciones.",
      });
      return false;
    }

    navigate("/admin");
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = loginSchema.parse({
        email: loginEmail,
        password: loginPassword,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        throw error;
      }

      const hasAccess = await verifyAdminAccess(data.user?.id || "");
      if (hasAccess) {
        toast({
          title: "Inicio de sesion exitoso",
          description: "Acceso concedido al backend",
        });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Error de validacion",
          description: error.errors[0].message,
        });
      } else if (error.message.includes("Invalid login credentials")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Email o contrasena incorrectos",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Error al iniciar sesion",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = resetPasswordSchema.parse({
        email: resetEmail,
      });

      const { error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Email enviado",
        description: "Revisa tu correo para restablecer tu contrasena",
      });

      setShowResetPassword(false);
      setResetEmail("");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Error de validacion",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Error al enviar email de recuperacion",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-america-navy via-background to-secondary py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-secondary">
            Copa Telmex Telcel
          </CardTitle>
          <CardDescription>
            Acceso administrativo al backend
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showResetPassword ? (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="admin@empresa.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contrasena</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    maxLength={100}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Validando acceso..." : "Entrar al backend"}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-sm text-america-blue hover:underline"
                >
                  Olvide mi contrasena
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-secondary mb-2">
                  Recuperar contrasena
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ingresa tu email administrativo y te enviaremos un enlace.
                </p>
              </div>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="admin@empresa.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    maxLength={255}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowResetPassword(false);
                      setResetEmail("");
                    }}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar email"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
      <FloatingWhatsApp />
    </div>
  );
}
