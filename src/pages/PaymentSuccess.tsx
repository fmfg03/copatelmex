import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    
    if (!sessionId) {
      toast.error("ID de sesión no encontrado");
      navigate("/register");
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { sessionId }
        });

        if (error) throw error;

        if (data.paid) {
          setPaymentVerified(true);
          toast.success("¡Pago verificado exitosamente!");
        } else {
          toast.error("El pago no se ha completado");
          setTimeout(() => navigate("/register"), 3000);
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        toast.error("Error al verificar el pago");
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            {verifying ? (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-america-blue" />
                <CardTitle className="text-3xl">Verificando Pago...</CardTitle>
                <CardDescription>Por favor espera mientras confirmamos tu pago</CardDescription>
              </>
            ) : paymentVerified ? (
              <>
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <CardTitle className="text-3xl">¡Pago Exitoso!</CardTitle>
                <CardDescription>Tu inscripción ha sido procesada correctamente</CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-3xl">Verificación Fallida</CardTitle>
                <CardDescription>No pudimos verificar tu pago. Serás redirigido...</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {paymentVerified && (
              <>
                <div className="bg-muted p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold text-lg">Próximos Pasos:</h3>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Completa la información de tu equipo en el formulario de registro</li>
                    <li>Sube los documentos requeridos de cada jugador</li>
                    <li>Recibirás una confirmación por email una vez procesada tu inscripción</li>
                  </ul>
                </div>
                <div className="flex gap-4">
                  <Button 
                    onClick={() => navigate("/register")} 
                    className="flex-1"
                  >
                    Continuar con la Inscripción
                  </Button>
                  <Button 
                    onClick={() => navigate("/")} 
                    variant="outline"
                    className="flex-1"
                  >
                    Ir al Inicio
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
