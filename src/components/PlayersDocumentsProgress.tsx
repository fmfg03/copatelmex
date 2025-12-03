import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PlayerProgress {
  id?: string;
  firstName: string;
  lastName: string;
  documents_complete?: boolean;
  documents_verified?: boolean;
}

interface PlayersDocumentsProgressProps {
  players: PlayerProgress[];
}

export const PlayersDocumentsProgress = ({ players }: PlayersDocumentsProgressProps) => {
  const totalPlayers = players.length;
  const completedPlayers = players.filter(p => p.documents_complete).length;
  const verifiedPlayers = players.filter(p => p.documents_verified).length;
  const rejectedPlayers = players.filter(p => p.documents_complete && p.documents_verified === false).length;
  const progressPercentage = totalPlayers > 0 ? (completedPlayers / totalPlayers) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Progreso de Documentos
        </CardTitle>
        <CardDescription>
          Completa los documentos de todos los jugadores para proceder con la inscripción
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {completedPlayers} de {totalPlayers} jugadores completos
            </span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        <div className="grid gap-2">
          {players.map((player, index) => (
            <div
              key={player.id || index}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-america-blue/5 transition-colors"
            >
              <span className="font-medium">
                {player.firstName} {player.lastName}
              </span>
              <div className="flex items-center gap-2">
                {player.documents_verified === false ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <span className="text-sm text-destructive font-medium">Rechazado</span>
                  </>
                ) : player.documents_verified === true ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Verificado</span>
                  </>
                ) : player.documents_complete ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-blue-600 font-medium">Pendiente verificación</span>
                  </>
                ) : (
                  <>
                    <Circle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Incompleto</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {rejectedPlayers > 0 && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
            <p className="text-sm text-destructive font-medium">
              ⚠️ {rejectedPlayers} jugador{rejectedPlayers > 1 ? 'es tienen' : ' tiene'} documentos rechazados que necesitan ser corregidos
            </p>
          </div>
        )}

        {completedPlayers === totalPlayers && totalPlayers > 0 && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              ✓ Todos los jugadores tienen sus documentos completos. {verifiedPlayers === totalPlayers ? 'Puedes proceder con la inscripción.' : 'Esperando verificación de administradores.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
