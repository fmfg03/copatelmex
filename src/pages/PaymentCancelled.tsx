import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PaymentCancelled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <CardTitle className="text-3xl">Pago Cancelado</CardTitle>
            <CardDescription>
              Has cancelado el proceso de pago. No se ha realizado ningún cargo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-6 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">¿Necesitas ayuda?</h3>
              <p className="text-muted-foreground">
                Si experimentaste algún problema durante el proceso de pago o tienes preguntas,
                no dudes en contactarnos. Estamos aquí para ayudarte a completar tu inscripción.
              </p>
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={() => navigate("/register")} 
                className="flex-1"
              >
                Intentar Nuevamente
              </Button>
              <Button 
                onClick={() => navigate("/")} 
                variant="outline"
                className="flex-1"
              >
                Ir al Inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
