import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { UserCog, Shield, Users, AlertTriangle, UserPlus, KeyRound, Pencil } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { z } from "zod";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  role?: 'admin' | 'moderator' | 'user' | null;
}

const createUserSchema = z.object({
  email: z.string().email("Email inválido").max(255, "Email muy largo"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100, "Contraseña muy larga"),
  full_name: z.string().trim().min(1, "El nombre es requerido").max(200, "Nombre muy largo"),
  phone: z.string().trim().min(10, "Teléfono debe tener al menos 10 dígitos").max(20, "Teléfono muy largo"),
  role: z.enum(['none', 'user', 'moderator', 'admin']),
});

const editUserSchema = z.object({
  full_name: z.string().trim().min(1, "El nombre es requerido").max(200, "Nombre muy largo"),
  phone: z.string().trim().min(10, "Teléfono debe tener al menos 10 dígitos").max(20, "Teléfono muy largo"),
});

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    currentRole: string;
    newRole: 'admin' | 'moderator' | 'user' | 'none';
  }>({
    open: false,
    userId: "",
    userName: "",
    currentRole: "",
    newRole: "none",
  });
  
  const [createDialog, setCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "none" as 'none' | 'user' | 'moderator' | 'admin',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [authUsersDialog, setAuthUsersDialog] = useState(false);
  const [authUsers, setAuthUsers] = useState<any[]>([]);
  const [loadingAuthUsers, setLoadingAuthUsers] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState<string | null>(null);
  const [syncingProfiles, setSyncingProfiles] = useState(false);
  
  const [editDialog, setEditDialog] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    phone: "",
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUsers();
    syncProfileEmails();
  }, []);

  const syncProfileEmails = async () => {
    setSyncingProfiles(true);
    try {
      // Call edge function to sync emails and create missing profiles
      const { data, error } = await supabase.functions.invoke('sync-profile-emails');
      
      if (error) {
        console.error('Error syncing profiles:', error);
        toast({
          title: "Error al sincronizar",
          description: "No se pudieron sincronizar los perfiles",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Sync results:', data);
      
      if (data?.success) {
        toast({
          title: "Sincronización completada",
          description: data.message || `${data.created || 0} perfiles creados, ${data.updated || 0} actualizados`,
        });
        
        // Refresh users list
        fetchUsers();
      }
    } catch (error) {
      console.error('Error calling sync function:', error);
      toast({
        title: "Error",
        description: "Error al ejecutar la sincronización",
        variant: "destructive",
      });
    } finally {
      setSyncingProfiles(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Get all profiles (admins can now see all profiles)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine data
      const usersData: UserProfile[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        
        return {
          id: profile.id,
          email: profile.email || `user-${profile.id.substring(0, 8)}@...`,
          full_name: profile.full_name,
          phone: profile.phone,
          created_at: profile.created_at,
          role: (userRole?.role as 'admin' | 'moderator' | 'user') || null,
        };
      });

      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = (userId: string, newRole: 'admin' | 'moderator' | 'user' | 'none') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setConfirmDialog({
      open: true,
      userId,
      userName: user.full_name,
      currentRole: user.role || 'none',
      newRole,
    });
  };

  const handleRoleChange = async () => {
    const { userId, newRole, currentRole } = confirmDialog;
    try {
      // Get current user (who is making the change)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("No hay usuario autenticado");

      if (newRole === 'none') {
        // Delete role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Check if role exists
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingRole) {
          // Update existing role
          const { error } = await supabase
            .from("user_roles")
            .update({ role: newRole })
            .eq("user_id", userId);

          if (error) throw error;
        } else {
          // Insert new role
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: newRole });

          if (error) throw error;
        }
      }

      // Log the role change in audit log
      const { error: auditError } = await supabase
        .from("role_audit_log")
        .insert({
          user_id: userId,
          previous_role: currentRole === 'none' ? null : (currentRole as any),
          new_role: newRole === 'none' ? null : (newRole as any),
          changed_by: currentUser.id,
        } as any);

      if (auditError) {
        console.error("Error logging audit:", auditError);
        // Don't throw - audit log failure shouldn't block the operation
      }

      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido actualizado exitosamente",
      });

      setConfirmDialog({ open: false, userId: "", userName: "", currentRole: "", newRole: "none" });
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive",
      });
      setConfirmDialog({ open: false, userId: "", userName: "", currentRole: "", newRole: "none" });
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador - Acceso completo';
      case 'moderator':
        return 'Operaciones - Acceso al panel administrativo';
      case 'user':
        return 'Usuario - Acceso básico';
      case 'none':
        return 'Sin rol - Solo su cuenta';
      default:
        return 'Sin rol';
    }
  };

  const isRiskyChange = () => {
    const { currentRole, newRole } = confirmDialog;
    return currentRole === 'admin' || (currentRole !== 'admin' && newRole === 'admin');
  };

  const getRoleBadge = (role?: 'admin' | 'moderator' | 'user' | null) => {
    if (!role) {
      return <Badge variant="outline">Usuario</Badge>;
    }

    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'moderator':
        return <Badge className="bg-blue-500"><UserCog className="w-3 h-3 mr-1" />Operaciones</Badge>;
      case 'user':
        return <Badge variant="outline"><Users className="w-3 h-3 mr-1" />Usuario</Badge>;
      default:
        return <Badge variant="outline">Usuario</Badge>;
    }
  };

  const handleResetPassword = async (userId: string, userEmail: string, userName: string) => {
    try {
      setResettingPassword(userId);
      
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          userId,
          email: userEmail,
        },
      });

      if (error) {
        console.error('Error calling reset function:', error);
        throw new Error('Error al enviar email de recuperación');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Error al enviar email de recuperación');
      }

      toast({
        title: "Email enviado",
        description: `Se envió un email de recuperación a ${userName} (${userEmail})`,
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el email de recuperación",
        variant: "destructive",
      });
    } finally {
      setResettingPassword(null);
    }
  };

  const handleCreateUser = async () => {
    try {
      // Validate form data
      const validation = createUserSchema.safeParse(formData);
      if (!validation.success) {
        const errors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(errors);
        return;
      }

      setCreating(true);
      setFormErrors({});

      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      // Call edge function to create user
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role === 'none' ? null : formData.role,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        // Try to extract the actual error message
        const errorMsg = error.message || "Error al crear el usuario";
        throw new Error(errorMsg);
      }
      
      if (!data?.success) {
        // If the function returned an error message, use it
        throw new Error(data?.error || "No se pudo crear el usuario");
      }

      toast({
        title: "Usuario creado",
        description: `Usuario ${formData.email} creado exitosamente`,
      });

      // Reset form and close dialog
      setFormData({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        role: "none",
      });
      setCreateDialog(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      
      // Extract the actual error message
      let errorMessage = "No se pudo crear el usuario";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Show user-friendly error for common cases
      if (errorMessage.includes("already been registered") || errorMessage.includes("User already registered")) {
        errorMessage = "Ya existe un usuario con este correo electrónico. Usa otro email o asigna el rol al usuario existente.";
      } else if (errorMessage.includes("invalid email")) {
        errorMessage = "El correo electrónico no es válido";
      } else if (errorMessage.includes("weak password")) {
        errorMessage = "La contraseña es muy débil. Debe tener al menos 8 caracteres";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (user: UserProfile) => {
    setEditingUser(user);
    setEditFormData({
      full_name: user.full_name,
      phone: user.phone,
    });
    setEditFormErrors({});
    setEditDialog(true);
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      setEditing(true);
      setEditFormErrors({});

      // Validate form data
      const validation = editUserSchema.safeParse(editFormData);
      if (!validation.success) {
        const errors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setEditFormErrors(errors);
        return;
      }

      // Update profile using admin privileges
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: editFormData.full_name.trim(),
          phone: editFormData.phone.trim(),
        })
        .eq('id', editingUser.id);

      if (updateError) {
        throw updateError;
      }

      // Log the action in admin audit log
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase.rpc('log_admin_action', {
          p_action: 'UPDATE',
          p_table_name: 'profiles',
          p_record_id: editingUser.id,
          p_old_values: {
            full_name: editingUser.full_name,
            phone: editingUser.phone,
          },
          p_new_values: {
            full_name: editFormData.full_name.trim(),
            phone: editFormData.phone.trim(),
          },
        });
      }

      toast({
        title: "Usuario actualizado",
        description: "Los datos del usuario se actualizaron exitosamente",
      });

      setEditFormData({ full_name: "", phone: "" });
      setEditDialog(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive",
      });
    } finally {
      setEditing(false);
    }
  };

  const handleListAuthUsers = async () => {
    try {
      setLoadingAuthUsers(true);
      setAuthUsersDialog(true);

      const { data, error } = await supabase.functions.invoke('list-auth-users');

      if (error) {
        console.error('Error listing auth users:', error);
        throw new Error('Error al listar usuarios registrados');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Error al listar usuarios registrados');
      }

      setAuthUsers(data.users || []);
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron listar los usuarios registrados",
        variant: "destructive",
      });
      setAuthUsersDialog(false);
    } finally {
      setLoadingAuthUsers(false);
    }
  };

  const handleCreateMissingProfile = async (authUser: any) => {
    try {
      setCreatingProfile(authUser.id);

      const { data, error } = await supabase.functions.invoke('create-missing-profile', {
        body: {
          userId: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuario',
          phone: authUser.user_metadata?.phone || '',
        },
      });

      if (error) {
        console.error('Error calling function:', error);
        throw new Error('Error al crear el perfil');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Error al crear el perfil');
      }

      toast({
        title: "Perfil creado",
        description: `Perfil creado para ${authUser.email}`,
      });

      setAuthUsersDialog(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el perfil",
        variant: "destructive",
      });
    } finally {
      setCreatingProfile(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Administra los permisos y roles de los usuarios del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={syncProfileEmails} 
            variant="outline" 
            className="gap-2"
            disabled={syncingProfiles}
          >
            <UserCog className="w-4 h-4" />
            {syncingProfiles ? "Sincronizando..." : "Sincronizar Perfiles"}
          </Button>
          <Button onClick={handleListAuthUsers} variant="outline" className="gap-2">
            <Users className="w-4 h-4" />
            Buscar Registrados
          </Button>
          <Button onClick={() => setCreateDialog(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Crear Usuario
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Rol Actual</TableHead>
              <TableHead>Cambiar Rol</TableHead>
              <TableHead>Fecha Registro</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay usuarios registrados
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role || 'none'}
                      onValueChange={(value) => openConfirmDialog(user.id, value as any)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Usuario (sin rol)</SelectItem>
                        <SelectItem value="user">Usuario</SelectItem>
                        <SelectItem value="moderator">Operaciones</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        className="gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(user.id, user.email, user.full_name)}
                        disabled={resettingPassword === user.id}
                        className="gap-2"
                      >
                        <KeyRound className="w-4 h-4" />
                        {resettingPassword === user.id ? "Enviando..." : "Resetear"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="bg-muted p-4 rounded-lg space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Descripción de Roles
        </h3>
        <div className="grid gap-2 text-sm">
          <div className="flex items-start gap-2">
            <Badge className="bg-red-500 mt-0.5">Admin</Badge>
            <span>Acceso completo a todas las funciones incluyendo gestión de usuarios y roles</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge className="bg-blue-500 mt-0.5">Operaciones</Badge>
            <span>Acceso al panel administrativo para gestionar jugadores, equipos, pagos y calendario</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">Usuario</Badge>
            <span>Solo puede acceder a su propia cuenta, equipo y jugadores registrados</span>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {isRiskyChange() && <AlertTriangle className="w-5 h-5 text-destructive" />}
              Confirmar Cambio de Rol
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                ¿Estás seguro de cambiar el rol de <strong>{confirmDialog.userName}</strong>?
              </p>
              
              <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rol actual:</span>
                  <span className="font-medium">{getRoleDescription(confirmDialog.currentRole)}</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-muted-foreground">↓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nuevo rol:</span>
                  <span className="font-medium">{getRoleDescription(confirmDialog.newRole)}</span>
                </div>
              </div>

              {confirmDialog.currentRole === 'admin' && confirmDialog.newRole !== 'admin' && (
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                  <p className="text-destructive font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    ¡Advertencia!
                  </p>
                  <p className="text-destructive text-sm mt-1">
                    Estás revocando permisos de administrador. El usuario perderá acceso a la gestión de usuarios y otras funciones administrativas.
                  </p>
                </div>
              )}

              {confirmDialog.newRole === 'admin' && confirmDialog.currentRole !== 'admin' && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                  <p className="text-amber-700 dark:text-amber-500 font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Atención
                  </p>
                  <p className="text-amber-700 dark:text-amber-500 text-sm mt-1">
                    Estás otorgando permisos de administrador completo. El usuario tendrá acceso a todas las funciones del sistema incluyendo gestión de usuarios.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange} className={isRiskyChange() ? "bg-destructive hover:bg-destructive/90" : ""}>
              Confirmar Cambio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Crear Nuevo Usuario
            </DialogTitle>
            <DialogDescription>
              Completa los datos del nuevo usuario y asigna un rol inicial
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={formErrors.email ? "border-destructive" : ""}
              />
              {formErrors.email && (
                <p className="text-sm text-destructive">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={formErrors.password ? "border-destructive" : ""}
              />
              {formErrors.password && (
                <p className="text-sm text-destructive">{formErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo *</Label>
              <Input
                id="full_name"
                placeholder="Juan Pérez"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={formErrors.full_name ? "border-destructive" : ""}
              />
              {formErrors.full_name && (
                <p className="text-sm text-destructive">{formErrors.full_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                placeholder="5512345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={formErrors.phone ? "border-destructive" : ""}
              />
              {formErrors.phone && (
                <p className="text-sm text-destructive">{formErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol Inicial</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as any })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Usuario (sin rol)</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="moderator">Operaciones</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getRoleDescription(formData.role)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialog(false);
                setFormData({
                  email: "",
                  password: "",
                  full_name: "",
                  phone: "",
                  role: "none",
                });
                setFormErrors({});
              }}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? "Creando..." : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Editar Usuario
            </DialogTitle>
            <DialogDescription>
              Modifica el nombre y teléfono del usuario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email (no editable)</Label>
              <Input
                id="edit-email"
                type="email"
                value={editingUser?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-full-name">Nombre completo *</Label>
              <Input
                id="edit-full-name"
                type="text"
                placeholder="Nombre completo del usuario"
                value={editFormData.full_name}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, full_name: e.target.value });
                  setEditFormErrors({ ...editFormErrors, full_name: "" });
                }}
                className={editFormErrors.full_name ? "border-destructive" : ""}
                maxLength={200}
              />
              {editFormErrors.full_name && (
                <p className="text-sm text-destructive">{editFormErrors.full_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono *</Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="Número de teléfono"
                value={editFormData.phone}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, phone: e.target.value });
                  setEditFormErrors({ ...editFormErrors, phone: "" });
                }}
                className={editFormErrors.phone ? "border-destructive" : ""}
                maxLength={20}
              />
              {editFormErrors.phone && (
                <p className="text-sm text-destructive">{editFormErrors.phone}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialog(false);
                setEditingUser(null);
                setEditFormData({ full_name: "", phone: "" });
                setEditFormErrors({});
              }}
              disabled={editing}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditUser} disabled={editing}>
              {editing ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={authUsersDialog} onOpenChange={setAuthUsersDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuarios Registrados
            </DialogTitle>
            <DialogDescription>
              Usuarios que han iniciado sesión pero no tienen perfil visible
            </DialogDescription>
          </DialogHeader>
          
          {loadingAuthUsers ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {authUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No se encontraron usuarios sin perfil
                </p>
              ) : (
                authUsers.map((authUser) => {
                  const hasProfile = users.some(u => u.id === authUser.id);
                  
                  return (
                    <div
                      key={authUser.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{authUser.email}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {authUser.id.substring(0, 8)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Registrado: {new Date(authUser.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {!hasProfile ? (
                        <Button
                          size="sm"
                          onClick={() => handleCreateMissingProfile(authUser)}
                          disabled={creatingProfile === authUser.id}
                        >
                          {creatingProfile === authUser.id ? "Creando..." : "Crear Perfil"}
                        </Button>
                      ) : (
                        <Badge variant="outline">Ya tiene perfil</Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAuthUsersDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
