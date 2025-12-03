import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const FloatingCTA = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't show on register page
  if (!isVisible || location.pathname === '/register') return null;

  return (
    <div className="fixed bottom-8 right-8 z-40 animate-scale-in">
      <div className="relative">
        <Button
          onClick={() => {
            navigate(user ? "/register" : "/auth");
            window.scrollTo(0, 0);
          }}
          className="bg-primary hover:bg-primary/90 text-secondary shadow-2xl hover:shadow-yellow hover:scale-105 text-lg px-8 py-6 h-auto rounded-full font-bold"
        >
          ¡Inscríbete aquí!
        </Button>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground rounded-full p-1.5 hover:bg-secondary/90 shadow-lg"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
