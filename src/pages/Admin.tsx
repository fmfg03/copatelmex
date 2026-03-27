import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Shield, Users, Calendar, Image, DollarSign, FileText, UserCog, History, BarChart3, FileCheck, Mail, MessageSquare, ClipboardList, Gamepad2, Newspaper } from "lucide-react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminPlayers } from "@/components/admin/AdminPlayers";
import { AdminTeams } from "@/components/admin/AdminTeams";
import { AdminSchedule } from "@/components/admin/AdminSchedule";
import { AdminGallery } from "@/components/admin/AdminGallery";
import { AdminPayments } from "@/components/admin/AdminPayments";
import { AdminReports } from "@/components/admin/AdminReports";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminAudit } from "@/components/admin/AdminAudit";
import { AdminCedulas } from "@/components/admin/AdminCedulas";
import { AdminStatistics } from "@/components/admin/AdminStatistics";
import { AdminEmail } from "@/components/admin/AdminEmail";
import { AdminWhatsApp } from "@/components/admin/AdminWhatsApp";
import { AdminDocuments } from "@/components/admin/AdminDocuments";
import { AdminSurveys } from "@/components/admin/AdminSurveys";
import { AdminMatchCapture } from "@/components/admin/AdminMatchCapture";
import { AdminNews } from "@/components/admin/AdminNews";
import { toast } from "@/hooks/use-toast";

const Admin = () => {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'moderator' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Acceso denegado",
          description: "Debes iniciar sesión para acceder al panel de administración",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Check if user has admin or moderator role
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .in("role", ["admin", "moderator"])
        .maybeSingle();

      if (error || !roleData) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para acceder al panel de administración",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setHasAccess(true);
      setUserRole(roleData.role);
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">Panel de Administración</h1>
          </div>
          <p className="text-muted-foreground">
            Gestiona todos los aspectos del torneo desde un solo lugar
          </p>
        </div>

        <Card className="p-6">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="flex flex-wrap gap-2 h-auto justify-start">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="players" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Jugadores</span>
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Equipos</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Documentos</span>
              </TabsTrigger>
              <TabsTrigger value="cedulas" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Cédulas</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Calendario</span>
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Estadísticas</span>
              </TabsTrigger>
              <TabsTrigger value="capture" className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                <span className="hidden sm:inline">Captura</span>
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                <span className="hidden sm:inline">Galería</span>
              </TabsTrigger>
              {/* Pagos oculto - este torneo es gratuito */}
              {/* <TabsTrigger value="payments" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Pagos</span>
              </TabsTrigger> */}
              <TabsTrigger value="news" className="flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                <span className="hidden sm:inline">Noticias</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Correo</span>
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </TabsTrigger>
              <TabsTrigger value="surveys" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Encuestas</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Reportes</span>
              </TabsTrigger>
              {userRole === 'admin' && (
                <>
                  <TabsTrigger value="users" className="flex items-center gap-2">
                    <UserCog className="w-4 h-4" />
                    <span className="hidden sm:inline">Usuarios</span>
                  </TabsTrigger>
                  <TabsTrigger value="audit" className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">Auditoría</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="dashboard" className="mt-6"><AdminDashboard /></TabsContent>
            <TabsContent value="players" className="mt-6"><AdminPlayers /></TabsContent>
            <TabsContent value="teams" className="mt-6"><AdminTeams /></TabsContent>
            <TabsContent value="documents" className="mt-6"><AdminDocuments /></TabsContent>
            <TabsContent value="cedulas" className="mt-6"><AdminCedulas /></TabsContent>
            <TabsContent value="schedule" className="mt-6"><AdminSchedule /></TabsContent>
            <TabsContent value="statistics" className="mt-6"><AdminStatistics /></TabsContent>
            <TabsContent value="capture" className="mt-6"><AdminMatchCapture /></TabsContent>
            <TabsContent value="gallery" className="mt-6"><AdminGallery /></TabsContent>
            <TabsContent value="payments" className="mt-6"><AdminPayments /></TabsContent>
            <TabsContent value="email" className="mt-6"><AdminEmail /></TabsContent>
            <TabsContent value="whatsapp" className="mt-6"><AdminWhatsApp /></TabsContent>
            <TabsContent value="surveys" className="mt-6"><AdminSurveys /></TabsContent>
            <TabsContent value="reports" className="mt-6"><AdminReports /></TabsContent>
            {userRole === 'admin' && (
              <>
                <TabsContent value="users" className="mt-6"><AdminUsers /></TabsContent>
                <TabsContent value="audit" className="mt-6"><AdminAudit /></TabsContent>
              </>
            )}
          </Tabs>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
