import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Mail, Inbox, Send, Clock, Search, Eye, Trash2, MailOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const AdminEmail = () => {
  const [inbox, setInbox] = useState<any[]>([]);
  const [sendLog, setSendLog] = useState<any[]>([]);
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [inboxRes, logRes, scheduledRes] = await Promise.all([
      supabase.from("email_inbox").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("email_send_log").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("scheduled_emails").select("*").order("scheduled_at", { ascending: false }).limit(50),
    ]);
    setInbox(inboxRes.data || []);
    setSendLog(logRes.data || []);
    setScheduled(scheduledRes.data || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("email_inbox").update({ is_read: true }).eq("id", id);
    fetchData();
  };

  const deleteEmail = async (id: string) => {
    const { error } = await supabase.from("email_inbox").delete().eq("id", id);
    if (!error) { toast({ title: "Eliminado" }); fetchData(); }
  };

  const cancelScheduled = async (id: string) => {
    const { error } = await supabase.from("scheduled_emails").update({ status: "cancelled" }).eq("id", id);
    if (!error) { toast({ title: "Cancelado" }); fetchData(); }
  };

  const filteredInbox = inbox.filter(e =>
    searchTerm === "" ||
    e.from_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.from_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = inbox.filter(e => !e.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="w-6 h-6" /> Correo Electrónico
        </h2>
        {unreadCount > 0 && <Badge variant="destructive">{unreadCount} sin leer</Badge>}
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Inbox className="w-4 h-4" />Bandeja ({inbox.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="w-4 h-4" />Enviados ({sendLog.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />Programados ({scheduled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por remitente o asunto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>De</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">Cargando...</TableCell></TableRow>
                ) : filteredInbox.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Bandeja vacía</TableCell></TableRow>
                ) : (
                  filteredInbox.map((email) => (
                    <TableRow key={email.id} className={!email.is_read ? "font-semibold bg-muted/50" : ""}>
                      <TableCell>
                        <div>{email.from_name || email.from_email}</div>
                        <div className="text-xs text-muted-foreground">{email.from_email}</div>
                      </TableCell>
                      <TableCell>{email.subject || "(Sin asunto)"}</TableCell>
                      <TableCell>{new Date(email.created_at).toLocaleDateString("es-MX", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedEmail(email); markAsRead(email.id); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!email.is_read && (
                            <Button size="sm" variant="ghost" onClick={() => markAsRead(email.id)}>
                              <MailOpen className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => deleteEmail(email.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Destinatarios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sendLog.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No hay correos enviados</TableCell></TableRow>
                ) : (
                  sendLog.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.subject || "-"}</TableCell>
                      <TableCell>{log.recipient_count}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === "sent" ? "default" : "destructive"}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(log.created_at).toLocaleDateString("es-MX", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Programado para</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduled.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No hay correos programados</TableCell></TableRow>
                ) : (
                  scheduled.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell>{email.subject}</TableCell>
                      <TableCell>{new Date(email.scheduled_at).toLocaleDateString("es-MX", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                      <TableCell>
                        <Badge variant={email.status === "pending" ? "secondary" : email.status === "sent" ? "default" : "destructive"}>
                          {email.status === "pending" ? "Pendiente" : email.status === "sent" ? "Enviado" : email.status === "cancelled" ? "Cancelado" : email.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {email.status === "pending" && (
                          <Button size="sm" variant="destructive" onClick={() => cancelScheduled(email.id)}>Cancelar</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEmail?.subject || "(Sin asunto)"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              De: {selectedEmail?.from_name} &lt;{selectedEmail?.from_email}&gt;
            </div>
            <div className="text-sm text-muted-foreground">
              Para: {selectedEmail?.to_email}
            </div>
            <div className="text-sm text-muted-foreground">
              Fecha: {selectedEmail && new Date(selectedEmail.created_at).toLocaleString("es-MX")}
            </div>
            <div className="border-t pt-4">
              {selectedEmail?.html_content ? (
                <div dangerouslySetInnerHTML={{ __html: selectedEmail.html_content }} />
              ) : (
                <p className="whitespace-pre-wrap">{selectedEmail?.text_content || "Sin contenido"}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
