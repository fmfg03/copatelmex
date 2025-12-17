import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, ArrowRight, ArrowLeft, Shield, Clock, Users, CheckCircle, Download, Eye, FileText } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Progress } from "@/components/ui/progress";
import { z } from "zod";
import bancoSantanderLogo from "@/assets/banco-santander-logo.png";
import { generatePlayerTemplate, parsePlayerExcel } from "@/lib/playerTemplateGenerator";
import { generateTeamTemplate, parseTeamExcel } from "@/lib/teamTemplateGenerator";
import { ExcelValidationDialog } from "@/components/ExcelValidationDialog";

// Schemas
const teamSchema = z.object({
  teamName: z.string().trim().min(1, "Nombre del equipo requerido").max(100),
  academyName: z.string().trim().max(100).optional(),
  state: z.string().trim().min(1, "Estado requerido").max(100),
  phoneNumber: z.string().trim().min(10, "Teléfono inválido").max(20),
  categoryId: z.string().uuid("Selecciona una categoría")
});

const managerSchema = z.object({
  firstName: z.string().trim().min(1, "Nombre requerido").max(100),
  lastName: z.string().trim().min(1, "Apellido requerido").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().trim().min(10, "Teléfono debe tener al menos 10 dígitos").max(20),
  position: z.string().trim().max(100).optional()
});

const playerSchema = z.object({
  firstName: z.string().trim().min(1, "Nombre requerido").max(100),
  paternalSurname: z.string().trim().min(1, "Apellido paterno requerido").max(100),
  maternalSurname: z.string().trim().min(1, "Apellido materno requerido").max(100),
  birthDate: z.string().min(1, "Fecha de nacimiento requerida"),
  curp: z.string().trim().length(18, "CURP debe tener 18 caracteres").regex(/^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/, "Formato de CURP inválido").transform(val => val.toUpperCase()),
  parentName: z.string().trim().min(1, "Nombre del tutor requerido").max(100),
  parentEmail: z.string().trim().email("Email del tutor inválido").min(1, "Email del tutor requerido").max(255),
  parentPhone: z.string().trim().min(10, "Teléfono del tutor debe tener al menos 10 dígitos").max(20),
  position: z.string().trim().max(50).optional(),
  jerseyNumber: z.string().trim().min(1, "Número de jersey requerido").max(2, "Número de jersey debe ser entre 1 y 99")
});

interface Manager {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
}

interface Player {
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  birthDate: string;
  curp: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  position: string;
  jerseyNumber: string;
  photoFile?: File | null;
  birthCertFile?: File | null;
}

interface TeamData {
  teamName: string;
  academyName: string;
  state: string;
  phoneNumber: string;
  categoryId: string;
  shieldFile: File | null;
  identificationFile: File | null;
  socialPlatform: string;
  socialHandle: string;
  managers: Manager[];
  players: Player[];
  numberOfPlayers: number;
}

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // State
  const [loading, setLoading] = useState(false);
  const [savingTeams, setSavingTeams] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Multiple teams
  const [numberOfTeams, setNumberOfTeams] = useState<number>(1);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  
  // Payment
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentReferences, setPaymentReferences] = useState<string[]>([]);

  // Acceptances
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptDisclaimer, setAcceptDisclaimer] = useState(false);
  const [acceptMinorCare, setAcceptMinorCare] = useState(false);

  // Excel validation
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<any[]>([]);
  const [pendingPlayers, setPendingPlayers] = useState<any[]>([]);
  
  // Delete team confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<number | null>(null);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (!session?.user) {
        toast({
          title: "Autenticación requerida",
          description: "Debes iniciar sesión o crear una cuenta para inscribir equipos",
          variant: "destructive"
        });
        navigate("/auth?redirect=/register");
        return;
      }
      
      // Try to restore saved registration progress
      const savedProgress = localStorage.getItem(`registration_draft_${session.user.id}`);
      if (savedProgress && currentStep === 0 && teams.length === 0) {
        try {
          const parsed = JSON.parse(savedProgress);
          const savedDate = new Date(parsed.savedAt);
          const daysSinceSaved = Math.floor((Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Only restore if saved within last 7 days
          if (daysSinceSaved <= 7) {
            toast({
              title: "Registro incompleto encontrado",
              description: `Tienes un registro guardado del ${savedDate.toLocaleDateString()}. Continuando desde donde lo dejaste.`,
              duration: 5000
            });
            setNumberOfTeams(parsed.numberOfTeams);
            setTeams(parsed.teams);
            setCurrentStep(parsed.currentStep);
            setCurrentTeamIndex(parsed.currentTeamIndex);
          } else {
            // Clear old draft
            localStorage.removeItem(`registration_draft_${session.user.id}`);
          }
        } catch (error) {
          console.error("Error restoring registration progress:", error);
          localStorage.removeItem(`registration_draft_${session.user.id}`);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        navigate("/auth?redirect=/register");
      }
    });

    loadCategories();
    return () => subscription.unsubscribe();
  }, []);

  // Check for payment success and update teams status
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");
    const registrationIds = searchParams.get("registration_ids");
    
    if (paymentStatus === "success" && sessionId) {
      // If we have registration IDs from the payment callback, update their status
      if (registrationIds) {
        const ids = registrationIds.split(',');
        updateRegistrationsAfterPayment(ids, sessionId);
      } else if (teams.length > 0 && !savingTeams) {
        // Fallback: save teams if not saved yet
        saveAllTeams();
      } else {
        setPaymentCompleted(true);
        toast({
          title: "¡Pago exitoso!",
          description: "Tu pago ha sido procesado correctamente."
        });
      }
      
      // Clear draft after successful payment
      if (user) {
        localStorage.removeItem(`registration_draft_${user.id}`);
      }
    }
  }, [searchParams, teams, savingTeams, user]);

  const updateRegistrationsAfterPayment = async (registrationIds: string[], sessionId: string) => {
    try {
      setLoading(true);
      
      // Update all registrations to confirmed status
      for (const regId of registrationIds) {
        const { error } = await supabase
          .from('registrations')
          .update({
            payment_status: 'confirmed',
            payment_date: new Date().toISOString()
          })
          .eq('id', regId);
          
        if (error) throw error;
      }
      
      setPaymentCompleted(true);
      setCurrentStep(4); // Go to players registration
      
      toast({
        title: "¡Pago confirmado!",
        description: "Ahora puedes continuar con el registro de jugadores",
        duration: 5000
      });
      
      // Reload teams with updated status
      const { data: updatedTeams } = await supabase
        .from('teams')
        .select(`
          *,
          registrations (
            id,
            category_id,
            payment_status
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(numberOfTeams);
      
      if (updatedTeams) {
        // Reconstruct teams state from database
        const reconstructedTeams = updatedTeams.map(team => ({
          teamName: team.team_name,
          academyName: team.academy_name || '',
          state: team.state,
          phoneNumber: team.phone_number,
          categoryId: team.registrations[0]?.category_id || '',
          shieldFile: null,
          identificationFile: null,
          socialPlatform: 'facebook' as const,
          socialHandle: '',
          managers: [],
          players: [],
          numberOfPlayers: 11
        }));
        
        setTeams(reconstructedTeams);
      }
      
    } catch (error: any) {
      console.error('Error updating registrations:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un problema al confirmar el pago. Contacta a soporte."
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-save registration progress
  useEffect(() => {
    if (!user || currentStep === 0 || teams.length === 0 || paymentCompleted) return;
    
    const saveProgress = () => {
      try {
        const progress = {
          numberOfTeams,
          teams: teams.map(team => ({
            ...team,
            shieldFile: null // Don't save file objects
          })),
          currentStep,
          currentTeamIndex,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(`registration_draft_${user.id}`, JSON.stringify(progress));
      } catch (error) {
        console.error("Error saving registration progress:", error);
      }
    };

    const timeoutId = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timeoutId);
  }, [user, numberOfTeams, teams, currentStep, currentTeamIndex, paymentCompleted]);

  const saveAllTeams = async () => {
    if (savingTeams || !user) return;
    
    setSavingTeams(true);
    setLoading(true);
    
    try {
      toast({
        title: "Guardando equipos...",
        description: "Por favor espera mientras guardamos la información"
      });

      for (const team of teams) {
        // 1. Upload shield if exists
        let shieldUrl = null;
        if (team.shieldFile) {
          const fileExt = team.shieldFile.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `shields/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('registration-documents')
            .upload(filePath, team.shieldFile);

          if (uploadError) throw uploadError;

          // Store the file path instead of public URL (bucket is now private)
          shieldUrl = filePath;
        }

        // 2. Create team
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .insert({
            user_id: user.id,
            team_name: team.teamName,
            academy_name: team.academyName || null,
            state: team.state,
            phone_number: team.phoneNumber,
            shield_url: shieldUrl,
            facebook_url: team.socialPlatform === 'facebook' ? team.socialHandle : null,
            instagram_url: team.socialPlatform === 'instagram' ? team.socialHandle : null,
            status: 'approved'
          })
          .select()
          .single();

        if (teamError) throw teamError;

        // 3. Create registration
        const { data: registrationData, error: registrationError } = await supabase
          .from('registrations')
          .insert({
            team_id: teamData.id,
            category_id: team.categoryId,
            payment_status: 'completed',
            payment_amount: 18750,
            payment_date: new Date().toISOString(),
          })
          .select()
          .single();

        if (registrationError) throw registrationError;

        // 4. Create team managers
        for (const manager of team.managers) {
          const { error: managerError } = await supabase
            .from('team_managers')
            .insert({
              team_id: teamData.id,
              first_name: manager.firstName,
              last_name: manager.lastName,
              email: manager.email,
              phone: manager.phone,
              position: manager.position || null,
              is_primary: team.managers.indexOf(manager) === 0
            });

          if (managerError) throw managerError;
        }

        // 5. Create players with document uploads
        for (const player of team.players) {
          let photoUrl = null;
          let birthCertUrl = null;

          // Upload photo if provided
          if (player.photoFile) {
            const photoExt = player.photoFile.name.split('.').pop();
            const photoName = `${crypto.randomUUID()}.${photoExt}`;
            const photoPath = `players/${photoName}`;

            const { error: photoError } = await supabase.storage
              .from('registration-documents')
              .upload(photoPath, player.photoFile);

            if (!photoError) {
              // Store the file path instead of public URL (bucket is now private)
              photoUrl = photoPath;
            }
          }

          // Upload birth certificate if provided
          if (player.birthCertFile) {
            const certExt = player.birthCertFile.name.split('.').pop();
            const certName = `${crypto.randomUUID()}.${certExt}`;
            const certPath = `birth-certificates/${certName}`;

            const { error: certError } = await supabase.storage
              .from('registration-documents')
              .upload(certPath, player.birthCertFile);

            if (!certError) {
              // Store the file path instead of public URL (bucket is now private)
              birthCertUrl = certPath;
            }
          }

          const { error: playerError } = await supabase
            .from('players')
            .insert({
              registration_id: registrationData.id,
              first_name: player.firstName,
              last_name: `${player.paternalSurname} ${player.maternalSurname}`.trim(),
              paternal_surname: player.paternalSurname || null,
              maternal_surname: player.maternalSurname || null,
              birth_date: player.birthDate,
              curp: player.curp,
              position: player.position || null,
              jersey_number: parseInt(player.jerseyNumber),
              parent_name: player.parentName,
              parent_email: player.parentEmail,
              parent_phone: player.parentPhone,
              photo_url: photoUrl,
              birth_certificate_url: birthCertUrl,
              documents_complete: !!(photoUrl && birthCertUrl),
              documents_verified: false
            });

          if (playerError) throw playerError;
        }
      }

      toast({
        title: "¡Registro exitoso!",
        description: `${numberOfTeams} equipo${numberOfTeams > 1 ? 's' : ''} registrado${numberOfTeams > 1 ? 's' : ''} correctamente`,
      });
      
      // Clear teams and redirect
      setTeams([]);
      setNumberOfTeams(1);
      setCurrentStep(5);
      
      // Remove query params
      window.history.replaceState({}, '', '/register');

    } catch (error: any) {
      console.error("Error saving teams:", error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error.message || "No se pudieron guardar los equipos. Por favor contacta a soporte."
      });
    } finally {
      setLoading(false);
      setSavingTeams(false);
    }
  };

  const loadCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las categorías"
      });
      return;
    }
    setCategories(data || []);
  };

  const initializeTeams = (count: number) => {
    const newTeams: TeamData[] = [];
    for (let i = 0; i < count; i++) {
      newTeams.push({
        teamName: "",
        academyName: "",
        state: "",
        phoneNumber: "",
        categoryId: "",
        shieldFile: null,
        identificationFile: null,
        socialPlatform: "facebook",
        socialHandle: "",
        managers: [
          { firstName: "", lastName: "", email: "", phone: "", position: "Director Técnico" },
          { firstName: "", lastName: "", email: "", phone: "", position: "Auxiliar Técnico" }
        ],
        players: [{ firstName: "", paternalSurname: "", maternalSurname: "", birthDate: "", curp: "", parentName: "", parentEmail: "", parentPhone: "", position: "", jerseyNumber: "" }],
        numberOfPlayers: 11
      });
    }
    setTeams(newTeams);
  };

  const updateCurrentTeam = (field: keyof TeamData, value: any) => {
    const updatedTeams = [...teams];
    updatedTeams[currentTeamIndex] = {
      ...updatedTeams[currentTeamIndex],
      [field]: value
    };
    setTeams(updatedTeams);
  };

  const getCurrentTeam = () => teams[currentTeamIndex] || teams[0];

  const addManager = () => {
    const currentTeam = getCurrentTeam();
    updateCurrentTeam("managers", [
      ...currentTeam.managers,
      { firstName: "", lastName: "", email: "", phone: "", position: "" }
    ]);
  };

  const removeManager = (index: number) => {
    const currentTeam = getCurrentTeam();
    if (currentTeam.managers.length <= 2) {
      toast({
        variant: "destructive",
        title: "No se puede eliminar",
        description: "Debes mantener al menos 2 responsables por equipo"
      });
      return;
    }
    updateCurrentTeam("managers", currentTeam.managers.filter((_, i) => i !== index));
  };

  const updateManager = (index: number, field: keyof Manager, value: string) => {
    const currentTeam = getCurrentTeam();
    const updated = [...currentTeam.managers];
    updated[index][field] = value;
    updateCurrentTeam("managers", updated);
  };

  const addPlayer = () => {
    const currentTeam = getCurrentTeam();
    updateCurrentTeam("players", [
      ...currentTeam.players,
      { firstName: "", paternalSurname: "", maternalSurname: "", birthDate: "", curp: "", parentName: "", parentEmail: "", parentPhone: "", position: "", jerseyNumber: "" }
    ]);
  };

  const removePlayer = (index: number) => {
    const currentTeam = getCurrentTeam();
    updateCurrentTeam("players", currentTeam.players.filter((_, i) => i !== index));
  };

  const updatePlayer = (index: number, field: keyof Player, value: string) => {
    const currentTeam = getCurrentTeam();
    const updated = [...currentTeam.players];
    (updated[index] as any)[field] = value;
    updateCurrentTeam("players", updated);
  };

  const handleShieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 300 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Archivo muy grande",
          description: "El escudo debe ser menor a 300 MB"
        });
        return;
      }
      updateCurrentTeam("shieldFile", file);
    }
  };

  const removeShield = () => {
    updateCurrentTeam("shieldFile", null);
  };

  const handleIdentificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Archivo muy grande",
          description: "La cédula debe ser menor a 10 MB"
        });
        return;
      }
      updateCurrentTeam("identificationFile", file);
    }
  };

  const removeIdentification = () => {
    updateCurrentTeam("identificationFile", null);
  };

  const viewIdentification = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
  };

  const validateCurrentTeamStep = (stepType: 'team' | 'managers' | 'players') => {
    const currentTeam = getCurrentTeam();
    
    try {
      if (stepType === 'team') {
        teamSchema.parse({
          teamName: currentTeam.teamName,
          academyName: currentTeam.academyName,
          state: currentTeam.state,
          phoneNumber: currentTeam.phoneNumber,
          categoryId: currentTeam.categoryId
        });
      } else if (stepType === 'managers') {
        if (currentTeam.managers.length < 2) {
          throw new Error("Debes agregar al menos 2 responsables del equipo");
        }
        for (const manager of currentTeam.managers) {
          managerSchema.parse(manager);
        }
      } else if (stepType === 'players') {
        if (!currentTeam.numberOfPlayers || currentTeam.numberOfPlayers < 7 || currentTeam.numberOfPlayers > 17) {
          throw new Error("El número de jugadores debe estar entre 7 y 17");
        }
        const filledPlayers = currentTeam.players.filter(p => p.firstName.trim() !== "");
        for (const player of filledPlayers) {
          playerSchema.parse(player);
        }
      }
      return true;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: error.errors[0].message
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: error.message
        });
      }
      return false;
    }
  };

  const nextStep = () => {
    // Step 0: Number of teams
    if (currentStep === 0) {
      if (!numberOfTeams || numberOfTeams < 1 || numberOfTeams > 10) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Debes inscribir entre 1 y 10 equipos"
        });
        return;
      }
      initializeTeams(numberOfTeams);
      setCurrentStep(1);
      return;
    }

    // Steps 1-2: Team info and managers for each team
    if (currentStep >= 1 && currentStep <= 2) {
      const stepType = currentStep === 1 ? 'team' : 'managers';
      
      if (!validateCurrentTeamStep(stepType)) {
        return;
      }

      // Move to next substep or next team
      if (currentStep === 2) {
        // Finished current team managers, move to next team or payment
        if (currentTeamIndex < numberOfTeams - 1) {
          const currentTeam = getCurrentTeam();
          const nextTeamIndex = currentTeamIndex + 1;
          
          // Precargar todos los datos del equipo actual excepto la categoría
          const updatedTeams = [...teams];
          updatedTeams[nextTeamIndex] = {
            ...updatedTeams[nextTeamIndex],
            teamName: currentTeam.teamName,
            academyName: currentTeam.academyName,
            state: currentTeam.state,
            phoneNumber: currentTeam.phoneNumber,
            shieldFile: currentTeam.shieldFile,
            socialPlatform: currentTeam.socialPlatform,
            socialHandle: currentTeam.socialHandle,
            managers: currentTeam.managers.map(m => ({ ...m })), // Copiar managers
            // categoryId se mantiene vacío para que el usuario lo seleccione
          };
          setTeams(updatedTeams);
          setCurrentTeamIndex(nextTeamIndex);
          
          setCurrentStep(1); // Start with team info for next team
          toast({
            title: `Equipo ${currentTeamIndex + 1} guardado`,
            description: `Ahora registra el equipo ${currentTeamIndex + 2} de ${numberOfTeams}`
          });
        } else {
          // All teams registered, go to payment
          setCurrentTeamIndex(0); // Reset to first team for player registration
          setCurrentStep(3); // Go to payment
        }
      } else {
        setCurrentStep(currentStep + 1);
      }
    }

    // Step 3: Payment (only advance after payment is confirmed)
    else if (currentStep === 3) {
      if (!paymentCompleted) {
        toast({
          variant: "destructive",
          title: "Pago pendiente de confirmación",
          description: "Un administrador debe verificar tu transferencia bancaria antes de que puedas continuar con el registro de jugadores. Recibirás una notificación cuando tu pago sea confirmado."
        });
        return;
      }
      
      // Payment confirmed, move to player registration
      setCurrentStep(4);
      setCurrentTeamIndex(0);
    }
    
    // Step 4: Players for each team (after payment)
    else if (currentStep === 4) {
      if (!validateCurrentTeamStep('players')) {
        return;
      }

      // Move to next team or finish
      if (currentTeamIndex < numberOfTeams - 1) {
        setCurrentTeamIndex(currentTeamIndex + 1);
        toast({
          title: `Jugadores del equipo ${currentTeamIndex + 1} guardados`,
          description: `Ahora registra los jugadores del equipo ${currentTeamIndex + 2} de ${numberOfTeams}`
        });
      } else {
        setCurrentStep(5); // All done, go to confirmation
      }
    }
  };

  const prevStep = () => {
    // Prevent going back after payment
    if (currentStep >= 4 && paymentCompleted) {
      toast({
        variant: "destructive",
        title: "No puedes regresar",
        description: "Ya completaste el pago. Continúa con el registro de jugadores."
      });
      return;
    }
    
    if (currentStep === 1 && currentTeamIndex > 0) {
      // Go back to previous team's managers
      setCurrentTeamIndex(currentTeamIndex - 1);
      setCurrentStep(2);
    } else if (currentStep === 4 && currentTeamIndex > 0) {
      // Go back to previous team's players
      setCurrentTeamIndex(currentTeamIndex - 1);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePayment = async () => {
    if (!user) return;
    
    setProcessingPayment(true);
    setLoading(true);
    
    try {
      toast({
        title: "Guardando equipos...",
        description: "Guardando información de los equipos"
      });

      // Save all teams to the database with pending status
      const registrationIds: string[] = [];
      
      for (const team of teams) {
        // 1. Upload shield if exists
        let shieldUrl = null;
        if (team.shieldFile) {
          const fileExt = team.shieldFile.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `${user.id}/shields/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('registration-documents')
            .upload(filePath, team.shieldFile);

          if (uploadError) throw uploadError;

          // Store the file path instead of public URL (bucket is now private)
          shieldUrl = filePath;
        }

        // 2. Create team
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .insert({
            user_id: user.id,
            team_name: team.teamName,
            academy_name: team.academyName || null,
            state: team.state,
            phone_number: team.phoneNumber,
            shield_url: shieldUrl,
            status: 'pending'
          })
          .select()
          .single();

        if (teamError) throw teamError;

        // 3. Create registration with pending payment
        const { data: registrationData, error: registrationError } = await supabase
          .from('registrations')
          .insert({
            team_id: teamData.id,
            category_id: team.categoryId,
            payment_status: 'pending',
            payment_amount: 18750
          })
          .select()
          .single();

        if (registrationError) throw registrationError;
        
        registrationIds.push(registrationData.id);

        // 4. Create team managers
        for (const manager of team.managers) {
          const { error: managerError } = await supabase
            .from('team_managers')
            .insert({
              team_id: teamData.id,
              first_name: manager.firstName,
              last_name: manager.lastName,
              email: manager.email,
              phone: manager.phone,
              position: manager.position || null,
              is_primary: team.managers.indexOf(manager) === 0
            });

          if (managerError) throw managerError;
        }
      }

      // Show success message and payment instructions
      toast({
        title: "¡Equipos registrados!",
        description: "Realiza la transferencia bancaria. Un administrador verificará tu pago para que puedas continuar.",
        duration: 7000
      });

      // Stay on payment step - don't advance until payment is confirmed
      // Payment will be confirmed either by:
      // 1. Admin verification in the admin panel
      // 2. Payment callback from stripe/bank (if implemented)
      
      // Store registration IDs for reference
      setPaymentReferences(registrationIds);

      // Clear draft
      localStorage.removeItem(`registration_draft_${user.id}`);

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudieron guardar los equipos"
      });
    } finally {
      setProcessingPayment(false);
      setLoading(false);
    }
  };

  const confirmDeleteTeam = (teamIndex: number) => {
    if (teams.length === 1) {
      toast({
        variant: "destructive",
        title: "No puedes eliminar",
        description: "Debes tener al menos un equipo registrado"
      });
      return;
    }
    
    setTeamToDelete(teamIndex);
    setShowDeleteDialog(true);
  };

  const handleDeleteTeam = () => {
    if (teamToDelete === null) return;
    
    const updatedTeams = teams.filter((_, idx) => idx !== teamToDelete);
    setTeams(updatedTeams);
    setNumberOfTeams(updatedTeams.length);
    
    // Adjust current team index if needed
    if (currentTeamIndex >= updatedTeams.length) {
      setCurrentTeamIndex(Math.max(0, updatedTeams.length - 1));
    }

    toast({
      title: "Equipo eliminado",
      description: `El equipo ha sido eliminado. Total actualizado: $${(updatedTeams.length * 18750).toLocaleString()} MXN`
    });
    
    setShowDeleteDialog(false);
    setTeamToDelete(null);
  };

  const calculateTotalAmount = () => {
    const pricePerTeam = 18750;
    return teams.length * pricePerTeam;
  };

  const getStepTitle = () => {
    if (currentStep === 0) return "¿Cuántos equipos deseas inscribir?";
    if (currentStep === 1) return `Equipo ${currentTeamIndex + 1} de ${numberOfTeams} - Información del Equipo`;
    if (currentStep === 2) return `Equipo ${currentTeamIndex + 1} de ${numberOfTeams} - Responsables del Equipo`;
    if (currentStep === 3) return "Pago Consolidado";
    if (currentStep === 4) return `Equipo ${currentTeamIndex + 1} de ${numberOfTeams} - Jugadores`;
    if (currentStep === 5) return "¡Registro Completado!";
    return "";
  };

  const calculateProgress = () => {
    if (currentStep === 0) return 0;
    if (currentStep === 5) return 100;
    
    // Each team has 3 steps total (team info, managers, players)
    // Steps 1-2 are done for all teams first, then payment, then players for all teams
    const totalTeamSteps = numberOfTeams * 3;
    
    let completedTeamSteps = 0;
    if (currentStep === 1) {
      completedTeamSteps = currentTeamIndex * 2;
    } else if (currentStep === 2) {
      completedTeamSteps = currentTeamIndex * 2 + 1;
    } else if (currentStep === 3) {
      // All team info and managers done
      completedTeamSteps = numberOfTeams * 2;
    } else if (currentStep === 4) {
      // Payment done, now doing players
      completedTeamSteps = numberOfTeams * 2 + currentTeamIndex + 1;
    }
    
    const progress = (completedTeamSteps / totalTeamSteps) * 80 + 10; // 10-90% range
    return Math.min(90, Math.max(10, progress));
  };

  const currentTeam = getCurrentTeam();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">{getStepTitle()}</h1>
            <span className="text-sm text-muted-foreground">
              {Math.round(calculateProgress())}% completado
            </span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* Step 0: Number of teams */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <Users className="mx-auto h-16 w-16 text-primary" />
                  <h2 className="text-xl font-semibold">¿Cuántos equipos deseas inscribir?</h2>
                  <p className="text-muted-foreground">
                    Inscribe múltiples equipos en una sola sesión y realiza un pago consolidado
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-4">
                  <Label htmlFor="numberOfTeams">Número de equipos (1-10)</Label>
                  <Input
                    id="numberOfTeams"
                    type="number"
                    min="1"
                    max="10"
                    value={numberOfTeams}
                    onChange={(e) => setNumberOfTeams(parseInt(e.target.value) || 1)}
                    className="text-center text-2xl font-bold h-16"
                  />
                  
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <Label htmlFor="team-excel-upload" className="text-sm font-semibold">
                          Carga Masiva desde Excel
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          ¿Registras varios equipos? Descarga la plantilla, complétala y súbela para agilizar el proceso
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            onClick={async () => {
                              await generateTeamTemplate(categories);
                              toast({
                                title: "Plantilla descargada",
                                description: "Completa el archivo Excel y súbelo para cargar los equipos"
                              });
                            }} 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-2" /> Descargar Plantilla
                          </Button>
                          <input
                            id="team-excel-upload"
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              try {
                                setLoading(true);
                                const result = await parseTeamExcel(file, categories);
                                
                                if (!result.teams || result.teams.length === 0) {
                                  throw new Error("No se encontraron equipos en el archivo");
                                }
                                
                                // Si hay errores, mostrar diálogo
                                if (result.errors.length > 0 || result.warnings.length > 0) {
                                  setValidationErrors(result.errors);
                                  setValidationWarnings(result.warnings);
                                  setPendingPlayers(result.teams); // Usar el mismo state temporalmente
                                  setShowValidationDialog(true);
                                  return;
                                }
                                
                                // Cargar equipos directamente
                                setTeams(result.teams);
                                setNumberOfTeams(result.teams.length);
                                setCurrentStep(3); // Ir directo al pago
                                
                                toast({
                                  title: "¡Equipos cargados!",
                                  description: `Se cargaron ${result.teams.length} equipos correctamente. Revisa el resumen antes del pago.`
                                });
                              } catch (error: any) {
                                toast({
                                  variant: "destructive",
                                  title: "Error al cargar archivo",
                                  description: error.message || "Verifica que el formato del Excel sea correcto"
                                });
                              } finally {
                                setLoading(false);
                                e.target.value = '';
                              }
                            }}
                          />
                          <Button asChild variant="secondary" size="sm" className="flex-1">
                            <label htmlFor="team-excel-upload" className="cursor-pointer">
                              <Upload className="h-4 w-4 mr-2" />
                              Cargar Excel
                            </label>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span>Precio por equipo:</span>
                          <span className="font-semibold">$18,750 MXN</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Número de equipos:</span>
                          <span className="font-semibold">{numberOfTeams}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between text-lg font-bold">
                          <span>Total a pagar:</span>
                          <span className="text-foreground">${calculateTotalAmount().toLocaleString()} MXN</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end">
                  <Button onClick={nextStep} size="lg">
                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 1: Team Info */}
            {currentStep === 1 && currentTeam && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nombre del Equipo *</Label>
                    <Input
                      value={currentTeam.teamName}
                      onChange={(e) => updateCurrentTeam("teamName", e.target.value)}
                      maxLength={100}
                      placeholder="Ej: Águilas FC"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Academia/Escuela</Label>
                    <Input
                      value={currentTeam.academyName}
                      onChange={(e) => updateCurrentTeam("academyName", e.target.value)}
                      maxLength={100}
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Estado *</Label>
                    <Select value={currentTeam.state} onValueChange={(value) => updateCurrentTeam("state", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aguascalientes">Aguascalientes</SelectItem>
                        <SelectItem value="Baja California">Baja California</SelectItem>
                        <SelectItem value="Baja California Sur">Baja California Sur</SelectItem>
                        <SelectItem value="Campeche">Campeche</SelectItem>
                        <SelectItem value="Chiapas">Chiapas</SelectItem>
                        <SelectItem value="Chihuahua">Chihuahua</SelectItem>
                        <SelectItem value="Ciudad de México">Ciudad de México</SelectItem>
                        <SelectItem value="Coahuila">Coahuila</SelectItem>
                        <SelectItem value="Colima">Colima</SelectItem>
                        <SelectItem value="Durango">Durango</SelectItem>
                        <SelectItem value="Estado de México">Estado de México</SelectItem>
                        <SelectItem value="Guanajuato">Guanajuato</SelectItem>
                        <SelectItem value="Guerrero">Guerrero</SelectItem>
                        <SelectItem value="Hidalgo">Hidalgo</SelectItem>
                        <SelectItem value="Jalisco">Jalisco</SelectItem>
                        <SelectItem value="Michoacán">Michoacán</SelectItem>
                        <SelectItem value="Morelos">Morelos</SelectItem>
                        <SelectItem value="Nayarit">Nayarit</SelectItem>
                        <SelectItem value="Nuevo León">Nuevo León</SelectItem>
                        <SelectItem value="Oaxaca">Oaxaca</SelectItem>
                        <SelectItem value="Puebla">Puebla</SelectItem>
                        <SelectItem value="Querétaro">Querétaro</SelectItem>
                        <SelectItem value="Quintana Roo">Quintana Roo</SelectItem>
                        <SelectItem value="San Luis Potosí">San Luis Potosí</SelectItem>
                        <SelectItem value="Sinaloa">Sinaloa</SelectItem>
                        <SelectItem value="Sonora">Sonora</SelectItem>
                        <SelectItem value="Tabasco">Tabasco</SelectItem>
                        <SelectItem value="Tamaulipas">Tamaulipas</SelectItem>
                        <SelectItem value="Tlaxcala">Tlaxcala</SelectItem>
                        <SelectItem value="Veracruz">Veracruz</SelectItem>
                        <SelectItem value="Yucatán">Yucatán</SelectItem>
                        <SelectItem value="Zacatecas">Zacatecas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Teléfono del Equipo *</Label>
                    <Input
                      type="tel"
                      value={currentTeam.phoneNumber}
                      onChange={(e) => updateCurrentTeam("phoneNumber", e.target.value)}
                      maxLength={20}
                      placeholder="10 dígitos mínimo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Categoría *</Label>
                    <Select value={currentTeam.categoryId} onValueChange={(value) => updateCurrentTeam("categoryId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name} {cat.year_born && `(${cat.year_born})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Número de Jugadores *</Label>
                    <Input
                      type="number"
                      min="7"
                      max="17"
                      value={currentTeam.numberOfPlayers}
                      onChange={(e) => updateCurrentTeam("numberOfPlayers", parseInt(e.target.value) || 11)}
                    />
                    <p className="text-xs text-muted-foreground">Mínimo 7 jugadores, máximo 17</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Escudo del Equipo</Label>
                    {currentTeam.shieldFile ? (
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={URL.createObjectURL(currentTeam.shieldFile)} 
                            alt="Escudo del equipo" 
                            className="h-20 w-20 object-contain border rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={removeShield}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {currentTeam.shieldFile.name}
                        </p>
                      </div>
                    ) : (
                      <Input type="file" accept="image/*" onChange={handleShieldChange} />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Cédula del Equipo (Opcional)</Label>
                    {currentTeam.identificationFile ? (
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="h-20 w-20 flex items-center justify-center border rounded bg-muted">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={removeIdentification}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm text-muted-foreground">
                            {currentTeam.identificationFile.name}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => viewIdentification(currentTeam.identificationFile!)}
                          >
                            <Eye className="h-3 w-3 mr-1" /> Ver Cédula
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Input type="file" accept="image/*,.pdf" onChange={handleIdentificationChange} />
                    )}
                    <p className="text-xs text-muted-foreground">Imagen o PDF con la información del equipo</p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                  </Button>
                  <Button onClick={nextStep}>
                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Managers */}
            {currentStep === 2 && currentTeam && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Responsables del Equipo</h3>
                  <Button onClick={addManager} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Agregar Responsable
                  </Button>
                </div>

                {currentTeam.managers.map((manager, index) => (
                  <Card key={index} className="bg-muted/30">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nombre *</Label>
                          <Input
                            value={manager.firstName}
                            onChange={(e) => updateManager(index, "firstName", e.target.value)}
                            maxLength={100}
                            placeholder="Nombre"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Apellido *</Label>
                          <Input
                            value={manager.lastName}
                            onChange={(e) => updateManager(index, "lastName", e.target.value)}
                            maxLength={100}
                            placeholder="Apellido"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={manager.email}
                            onChange={(e) => updateManager(index, "email", e.target.value)}
                            maxLength={255}
                            placeholder="correo@ejemplo.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Teléfono *</Label>
                          <Input
                            type="tel"
                            value={manager.phone}
                            onChange={(e) => updateManager(index, "phone", e.target.value)}
                            maxLength={20}
                            placeholder="10 dígitos mínimo"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Cargo</Label>
                          <Input
                            value={manager.position}
                            onChange={(e) => updateManager(index, "position", e.target.value)}
                            maxLength={100}
                            placeholder="ej. Entrenador"
                          />
                        </div>
                        {currentTeam.managers.length > 2 && (
                          <div className="md:col-span-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeManager(index)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                  </Button>
                  <Button onClick={nextStep}>
                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <Clock className="mx-auto h-16 w-16 text-primary" />
                  <h2 className="text-2xl font-bold">Resumen y Pago</h2>
                  <p className="text-muted-foreground">
                    Revisa la información de tus {numberOfTeams} equipo{numberOfTeams > 1 ? 's' : ''} antes de proceder al pago
                  </p>
                </div>

                {/* Resumen detallado de equipos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Equipos Registrados</h3>
                  {teams.map((team, idx) => {
                    const category = categories.find(c => c.id === team.categoryId);
                    return (
                      <Card key={idx} className="border-2">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {team.shieldFile && <Shield className="h-5 w-5 text-primary" />}
                                Equipo {idx + 1}: {team.teamName}
                              </CardTitle>
                              <CardDescription>
                                {category?.name} • {team.state}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCurrentTeamIndex(idx);
                                  setCurrentStep(1);
                                }}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => confirmDeleteTeam(idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Teléfono</p>
                              <p className="font-medium">{team.phoneNumber}</p>
                            </div>
                            {team.academyName && (
                              <div>
                                <p className="text-muted-foreground">Academia</p>
                                <p className="font-medium">{team.academyName}</p>
                              </div>
                            )}
                          </div>
                          
                          {team.identificationFile && (
                            <div className="border-t pt-3">
                              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Cédula del Equipo
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewIdentification(team.identificationFile!)}
                              >
                                <Eye className="h-4 w-4 mr-2" /> Ver Cédula
                              </Button>
                            </div>
                          )}
                          
                          <div className="border-t pt-3">
                            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Responsables ({team.managers.length})
                            </p>
                            <div className="space-y-2">
                              {team.managers.map((manager, mIdx) => (
                                <div key={mIdx} className="text-sm bg-muted/30 p-2 rounded">
                                  <p className="font-medium">{manager.firstName} {manager.lastName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {manager.position || 'Responsable'} • {manager.email}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Card className="bg-primary/5">
                  <CardContent className="pt-6 space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Total a pagar</p>
                      <p className="text-4xl font-bold text-primary">${calculateTotalAmount().toLocaleString()} MXN</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        ({teams.length} equipo{teams.length > 1 ? 's' : ''} × $18,750)
                      </p>
                    </div>

                    <CountdownTimer 
                      targetDate={new Date('2025-02-28')} 
                      label="Inscripciones hasta"
                      accentColor="yellow"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <img src={bancoSantanderLogo} alt="Santander" className="h-6" />
                      Datos Bancarios
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Banco:</span>
                      <span className="font-semibold">Santander</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CLABE:</span>
                      <span className="font-mono font-semibold">014180515006871320</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Beneficiario:</span>
                      <span className="font-semibold">Club América</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="privacy"
                      checked={acceptPrivacy}
                      onCheckedChange={(checked) => setAcceptPrivacy(checked as boolean)}
                    />
                    <Label htmlFor="privacy" className="text-sm cursor-pointer">
                      Acepto el Aviso de Privacidad
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="disclaimer"
                      checked={acceptDisclaimer}
                      onCheckedChange={(checked) => setAcceptDisclaimer(checked as boolean)}
                    />
                    <Label htmlFor="disclaimer" className="text-sm cursor-pointer">
                      Acepto el Deslinde de Responsabilidad
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="minorCare"
                      checked={acceptMinorCare}
                      onCheckedChange={(checked) => setAcceptMinorCare(checked as boolean)}
                    />
                    <Label htmlFor="minorCare" className="text-sm cursor-pointer">
                      Acepto hacerme responsable del cuidado de los menores
                    </Label>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Importante:</strong> Después de hacer clic en "Registrar Equipos", deberás realizar la transferencia bancaria 
                    a la cuenta de Santander mostrada arriba. <strong>No podrás registrar jugadores hasta que un administrador verifique tu pago.</strong> 
                    Recibirás una notificación cuando tu pago sea confirmado y podrás continuar desde la página "Mis Equipos".
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                  </Button>
                  <Button
                    onClick={handlePayment}
                    disabled={!acceptPrivacy || !acceptDisclaimer || !acceptMinorCare || processingPayment}
                    size="lg"
                  >
                    {processingPayment ? "Guardando..." : "Registrar Equipos"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Players (after payment confirmation) */}
            {currentStep === 4 && currentTeam && (
              <div className="space-y-6">
                <div className="text-center mb-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">¡Pago Confirmado!</h3>
                  <p className="text-sm text-green-600 dark:text-green-500 mb-2">
                    Tu pago ha sido verificado. Ahora puedes registrar los jugadores de cada equipo
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">Jugadores ({currentTeam.numberOfPlayers} jugadores)</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Registra los {currentTeam.numberOfPlayers} jugadores para el equipo {currentTeam.teamName}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          generatePlayerTemplate();
                          toast({
                            title: "Plantilla descargada",
                            description: "Completa el archivo Excel y súbelo para cargar los jugadores"
                          });
                        }} 
                        variant="outline" 
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" /> Descargar Plantilla
                      </Button>
                      <Button onClick={addPlayer} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" /> Agregar Jugador
                      </Button>
                    </div>
                  </div>

                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <Label htmlFor="excel-upload" className="text-sm font-semibold">
                          Carga Masiva desde Excel (Todos los Equipos)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Sube un archivo Excel con todos los jugadores de todos tus equipos. El Excel debe incluir las columnas "Nombre del Equipo" y "Categoría"
                        </p>
                        <input
                          id="excel-upload"
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            try {
                              setLoading(true);
                              const result = await parsePlayerExcel(file, teams, categories);
                              
                              // Validar que haya datos
                              if (!result.players || result.players.length === 0) {
                                throw new Error("No se encontraron jugadores en el archivo");
                              }
                              
                              // Si hay errores, mostrar diálogo de validación
                              if (result.errors.length > 0 || result.warnings.length > 0) {
                                setValidationErrors(result.errors);
                                setValidationWarnings(result.warnings);
                                setPendingPlayers(result.players);
                                setShowValidationDialog(true);
                                return;
                              }
                              
                              // Si no hay errores ni warnings, distribuir jugadores a sus equipos
                              const updatedTeams = [...teams];
                              
                              result.players.forEach((player: any) => {
                                const teamIndex = updatedTeams.findIndex(
                                  t => t.teamName.toLowerCase() === player.teamName.toLowerCase()
                                );
                                
                                if (teamIndex !== -1) {
                                  // Verificar que la categoría coincida
                                  const category = categories.find(c => c.name === player.categoryName);
                                  if (category && updatedTeams[teamIndex].categoryId === category.id) {
                                    updatedTeams[teamIndex].players.push({
                                      firstName: player.firstName,
                                      paternalSurname: player.paternalSurname,
                                      maternalSurname: player.maternalSurname,
                                      birthDate: player.birthDate,
                                      curp: player.curp,
                                      parentName: player.parentName,
                                      parentEmail: player.parentEmail,
                                      parentPhone: player.parentPhone,
                                      position: player.position,
                                      jerseyNumber: player.jerseyNumber
                                    });
                                    updatedTeams[teamIndex].numberOfPlayers = updatedTeams[teamIndex].players.length;
                                  }
                                }
                              });
                              
                              setTeams(updatedTeams);
                              
                              const totalPlayers = result.players.length;
                              const teamsUpdated = updatedTeams.filter(t => t.players.length > 0).length;
                              
                              toast({
                                title: "¡Jugadores cargados!",
                                description: `Se cargaron ${totalPlayers} jugadores en ${teamsUpdated} equipos correctamente`
                              });
                            } catch (error: any) {
                              toast({
                                variant: "destructive",
                                title: "Error al cargar archivo",
                                description: error.message || "Verifica que el formato del Excel sea correcto"
                              });
                            } finally {
                              setLoading(false);
                              e.target.value = ''; // Reset input
                            }
                          }}
                        />
                        <Button asChild variant="secondary" size="sm" className="w-full sm:w-auto">
                          <label htmlFor="excel-upload" className="cursor-pointer">
                            <Upload className="h-4 w-4 mr-2" />
                            Cargar desde Excel
                          </label>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {currentTeam.players.map((player, index) => (
                  <Card key={index} className="bg-muted/30">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold">Jugador {index + 1}</h4>
                        {currentTeam.players.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePlayer(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nombre *</Label>
                          <Input
                            value={player.firstName}
                            onChange={(e) => updatePlayer(index, "firstName", e.target.value)}
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Apellido Paterno *</Label>
                          <Input
                            value={player.paternalSurname}
                            onChange={(e) => updatePlayer(index, "paternalSurname", e.target.value)}
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Apellido Materno *</Label>
                          <Input
                            value={player.maternalSurname}
                            onChange={(e) => updatePlayer(index, "maternalSurname", e.target.value)}
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fecha de Nacimiento *</Label>
                          <Input
                            type="date"
                            value={player.birthDate}
                            onChange={(e) => updatePlayer(index, "birthDate", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CURP *</Label>
                          <Input
                            value={player.curp}
                            onChange={(e) => updatePlayer(index, "curp", e.target.value.toUpperCase())}
                            maxLength={18}
                            placeholder="18 caracteres"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Número de Jersey *</Label>
                          <Input
                            value={player.jerseyNumber}
                            onChange={(e) => updatePlayer(index, "jerseyNumber", e.target.value)}
                            maxLength={2}
                            placeholder="1-99"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Posición</Label>
                          <Input
                            value={player.position}
                            onChange={(e) => updatePlayer(index, "position", e.target.value)}
                            maxLength={50}
                            placeholder="Ej: Delantero"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <h5 className="font-semibold text-sm">Datos del Tutor</h5>
                        </div>
                        <div className="space-y-2">
                          <Label>Nombre del Tutor *</Label>
                          <Input
                            value={player.parentName}
                            onChange={(e) => updatePlayer(index, "parentName", e.target.value)}
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email del Tutor *</Label>
                          <Input
                            type="email"
                            value={player.parentEmail}
                            onChange={(e) => updatePlayer(index, "parentEmail", e.target.value)}
                            maxLength={255}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Teléfono del Tutor *</Label>
                          <Input
                            type="tel"
                            value={player.parentPhone}
                            onChange={(e) => updatePlayer(index, "parentPhone", e.target.value)}
                            maxLength={20}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                  </Button>
                  <Button onClick={nextStep}>
                    {currentTeamIndex < numberOfTeams - 1 ? "Siguiente Equipo" : "Finalizar Registro"} 
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 5 && (
              <div className="text-center space-y-6 py-8">
                <CheckCircle className="mx-auto h-24 w-24 text-green-500" />
                <h2 className="text-3xl font-bold">¡Registro Completado!</h2>
                <p className="text-muted-foreground">
                  Has inscrito exitosamente {numberOfTeams} equipo{numberOfTeams > 1 ? 's' : ''} a la Copa Telmex Telcel
                </p>
                <div className="pt-4">
                  <Button onClick={() => navigate("/")} size="lg">
                    Volver al Inicio
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
      <FloatingWhatsApp />
      
      {/* Excel Validation Dialog */}
      <ExcelValidationDialog
        open={showValidationDialog}
        onClose={() => {
          setShowValidationDialog(false);
          setValidationErrors([]);
          setValidationWarnings([]);
          setPendingPlayers([]);
        }}
        errors={validationErrors}
        warnings={validationWarnings}
        onContinue={validationErrors.length === 0 ? () => {
          // Detectar si son equipos o jugadores por el contenido
          const isTeamData = pendingPlayers.length > 0 && 
            'teamName' in pendingPlayers[0] && 
            'managers' in pendingPlayers[0];
          
          if (isTeamData) {
            // Cargar equipos
            setTeams(pendingPlayers);
            setNumberOfTeams(pendingPlayers.length);
            setCurrentStep(3); // Ir directo al resumen/pago
            toast({
              title: "¡Equipos cargados!",
              description: `Se cargaron ${pendingPlayers.length} equipos correctamente`
            });
          } else {
            // Cargar jugadores - distribuir a sus equipos correspondientes
            const updatedTeams = [...teams];
            
            pendingPlayers.forEach((player: any) => {
              const teamIndex = updatedTeams.findIndex(
                t => t.teamName.toLowerCase() === player.teamName.toLowerCase()
              );
              
              if (teamIndex !== -1) {
                // Verificar que la categoría coincida
                const category = categories.find(c => c.name === player.categoryName);
                if (category && updatedTeams[teamIndex].categoryId === category.id) {
                  updatedTeams[teamIndex].players.push({
                    firstName: player.firstName,
                    paternalSurname: player.paternalSurname,
                    maternalSurname: player.maternalSurname,
                    birthDate: player.birthDate,
                    curp: player.curp,
                    parentName: player.parentName,
                    parentEmail: player.parentEmail,
                    parentPhone: player.parentPhone,
                    position: player.position,
                    jerseyNumber: player.jerseyNumber
                  });
                  updatedTeams[teamIndex].numberOfPlayers = updatedTeams[teamIndex].players.length;
                }
              }
            });
            
            setTeams(updatedTeams);
            
            const totalPlayers = pendingPlayers.length;
            const teamsUpdated = updatedTeams.filter(t => t.players.length > 0).length;
            
            toast({
              title: "¡Jugadores cargados!",
              description: `Se cargaron ${totalPlayers} jugadores en ${teamsUpdated} equipos correctamente`
            });
          }
          
          setShowValidationDialog(false);
          setPendingPlayers([]);
          setValidationErrors([]);
          setValidationWarnings([]);
        } : undefined}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              {teamToDelete !== null && (
                <>
                  Estás a punto de eliminar el equipo <strong>{teams[teamToDelete]?.teamName}</strong>.
                  <br /><br />
                  Esta acción no se puede deshacer y se perderá toda la información ingresada para este equipo (responsables, jugadores, etc.).
                  <br /><br />
                  El monto total a pagar se actualizará a <strong>${((teams.length - 1) * 18750).toLocaleString()} MXN</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeam} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar Equipo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
