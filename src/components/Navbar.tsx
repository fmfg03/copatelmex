import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User, Users, ChevronDown, Shield, Key, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import copaTelmexLogo from "@/assets/copa-telmex-logo.png";

export const Navbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleChangePassword = async () => {
    if (!user?.email) return;
    
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el correo de cambio de contraseña",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Correo enviado",
        description: "Revisa tu bandeja de entrada para cambiar tu contraseña",
      });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => checkAdminRole(session.user.id), 0);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
    setIsAdmin(data === true);
  };

  const navLinks = [
    { name: "Inicio", href: "/", disabled: false },
    { name: "Información", href: "/tournament-info", disabled: false },
    { name: "Calendario", href: "/schedule", disabled: true },
    { name: "Multimedia", href: "/media", disabled: true },
    { name: "Sede", href: "/#sedes", disabled: false },
    { name: "Contacto", href: "/contacto", disabled: false },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-secondary dark:bg-secondary/95 shadow-md border-b border-transparent dark:border-border backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <img 
              src={copaTelmexLogo} 
              alt="Copa Telmex Telcel"
              title="Copa Telmex Telcel"
              fetchPriority="high"
              width="64"
              height="64"
              className="h-12 sm:h-14 md:h-16 w-auto object-contain"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <div key={link.name} className="relative group">
                <a
                  href={link.disabled ? "#" : link.href}
                  onClick={(e) => {
                    if (link.disabled) {
                      e.preventDefault();
                      return;
                    }
                    if (link.href.startsWith("/#")) {
                      e.preventDefault();
                      navigate("/");
                      setTimeout(() => {
                        const element = document.querySelector(link.href.substring(1));
                        element?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    } else if (link.href === "/tournament-info" || link.href === "/register" || link.href === "/schedule" || link.href === "/contacto") {
                      e.preventDefault();
                      navigate(link.href);
                    }
                  }}
                  className={`px-4 py-2 text-white rounded-lg transition-all duration-fast font-semibold text-sm tracking-wide ${
                    link.disabled 
                      ? "cursor-not-allowed opacity-60" 
                      : "hover:text-primary"
                  }`}
                >
                  <span className={link.disabled ? "group-hover:hidden" : ""}>
                    {link.name}
                  </span>
                  {link.disabled && (
                    <span className="hidden group-hover:inline">
                      PRÓXIMAMENTE
                    </span>
                  )}
                </a>
              </div>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              variant="default"
              asChild
              className="bg-accent hover:bg-accent/90 text-white shadow-lg"
            >
              <a href="/cedula-inscripcion.pdf" download>
                <Download className="w-4 h-4 mr-2" />
                Cédula de Inscripción
              </a>
            </Button>
            <ThemeToggle />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-white hover:bg-primary hover:text-white border-white/30"
                  >
                    <User className="w-4 h-4 mr-2" />
                    ¡Hola, {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}!
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.user_metadata?.full_name || 'Usuario'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/my-teams")} className="cursor-pointer">
                    <Users className="w-4 h-4 mr-2" />
                    Mis Equipos
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
                      <Shield className="w-4 h-4 mr-2" />
                      Panel de Administrador
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleChangePassword} className="cursor-pointer">
                    <Key className="w-4 h-4 mr-2" />
                    Cambiar Contraseña
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate("/");
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-white hover:text-primary rounded-lg transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 animate-accordion-down">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <div key={link.name} className="relative group">
                  <a
                    href={link.disabled ? "#" : link.href}
                    onClick={(e) => {
                      if (link.disabled) {
                        e.preventDefault();
                        return;
                      }
                      setIsOpen(false);
                      if (link.href.startsWith("/#")) {
                        e.preventDefault();
                        navigate("/");
                        setTimeout(() => {
                          const element = document.querySelector(link.href.substring(1));
                          element?.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                      } else if (link.href === "/tournament-info" || link.href === "/register" || link.href === "/schedule" || link.href === "/contacto") {
                        e.preventDefault();
                        navigate(link.href);
                      }
                    }}
                    className={`px-4 py-3 text-white rounded-lg transition-colors font-medium block ${
                      link.disabled 
                        ? "cursor-not-allowed opacity-60" 
                        : "hover:text-primary"
                    }`}
                  >
                    <span className={link.disabled ? "group-hover:hidden" : ""}>
                      {link.name}
                    </span>
                    {link.disabled && (
                      <span className="hidden group-hover:inline">
                        PRÓXIMAMENTE
                      </span>
                    )}
                  </a>
                </div>
              ))}
              <div className="px-4 py-2">
                <ThemeToggle />
              </div>
              <Button
                variant="default"
                asChild
                className="bg-accent hover:bg-accent/90 text-white w-full"
              >
                <a href="/cedula-inscripcion.pdf" download onClick={() => setIsOpen(false)}>
                  <Download className="w-4 h-4 mr-2" />
                  Cédula de Inscripción
                </a>
              </Button>
              {user && (
                <>
                  <div className="px-4 py-2 text-white font-medium border-t border-white/20 mt-2 pt-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      ¡Hola, {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}!
                    </div>
                    <p className="text-xs text-white/70 mt-1">{user.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/my-teams");
                    }}
                    className="w-full"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Mis Equipos
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsOpen(false);
                        navigate("/admin");
                      }}
                      className="w-full"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Panel de Administrador
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                      handleChangePassword();
                    }}
                    className="w-full"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Cambiar Contraseña
                  </Button>
                </>
              )}
              {user && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setIsOpen(false);
                    navigate("/");
                  }}
                  className="w-full text-destructive hover:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
