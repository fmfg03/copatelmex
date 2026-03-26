import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Search, Send, Bot, FileText, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const AdminWhatsApp = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [quickReplies, setQuickReplies] = useState<any[]>([]);
  const [autoReplies, setAutoReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [directionFilter, setDirectionFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [msgsRes, templatesRes, quickRes, autoRes] = await Promise.all([
      supabase.from("whatsapp_message_log").select("*").order("sent_at", { ascending: false }).limit(200),
      supabase.from("whatsapp_templates").select("*").order("created_at", { ascending: false }),
      supabase.from("whatsapp_quick_replies").select("*").order("usage_count", { ascending: false }),
      supabase.from("whatsapp_auto_replies").select("*").order("priority", { ascending: true }),
    ]);
    setMessages(msgsRes.data || []);
    setTemplates(templatesRes.data || []);
    setQuickReplies(quickRes.data || []);
    setAutoReplies(autoRes.data || []);
    setLoading(false);
  };

  const filteredMessages = messages.filter(m => {
    const matchesSearch = searchTerm === "" ||
      m.recipient_phone?.includes(searchTerm) ||
      m.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.message_content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDirection = directionFilter === "all" || m.direction === directionFilter;
    return matchesSearch && matchesDirection;
  });

  // Group messages by phone number for conversation view
  const conversations = messages.reduce((acc: Record<string, any[]>, msg) => {
    const phone = msg.recipient_phone;
    if (!acc[phone]) acc[phone] = [];
    acc[phone].push(msg);
    return acc;
  }, {});

  const conversationList = Object.entries(conversations).map(([phone, msgs]) => ({
    phone,
    name: (msgs as any[])[0]?.recipient_name || phone,
    lastMessage: (msgs as any[])[0],
    count: (msgs as any[]).length,
    unread: (msgs as any[]).filter((m: any) => !m.is_read && m.direction === "inbound").length,
  })).sort((a, b) => new Date(b.lastMessage.sent_at).getTime() - new Date(a.lastMessage.sent_at).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6" /> WhatsApp
        </h2>
      </div>

      <Tabs defaultValue="conversations">
        <TabsList>
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />Conversaciones
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <Send className="w-4 h-4" />Mensajes ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />Plantillas ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="auto" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />Auto-respuestas ({autoReplies.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="mt-4">
          <Card className="divide-y">
            {conversationList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No hay conversaciones</div>
            ) : (
              conversationList.map((conv) => (
                <div key={conv.phone} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{conv.name}</span>
                      {conv.unread > 0 && <Badge variant="destructive" className="text-xs">{conv.unread}</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">{conv.phone}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-md mt-1">
                      {conv.lastMessage.direction === "inbound" ? <ArrowDownLeft className="w-3 h-3 inline mr-1" /> : <ArrowUpRight className="w-3 h-3 inline mr-1" />}
                      {conv.lastMessage.message_content?.substring(0, 80)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(conv.lastMessage.sent_at).toLocaleDateString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))
            )}
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por teléfono, nombre o mensaje..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger><SelectValue placeholder="Dirección" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="outbound">Enviados</SelectItem>
                <SelectItem value="inbound">Recibidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dir</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Mensaje</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay mensajes</TableCell></TableRow>
                ) : (
                  filteredMessages.slice(0, 50).map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell>
                        {msg.direction === "inbound" ? <ArrowDownLeft className="w-4 h-4 text-blue-500" /> : <ArrowUpRight className="w-4 h-4 text-green-500" />}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{msg.recipient_phone}</TableCell>
                      <TableCell>{msg.recipient_name || "-"}</TableCell>
                      <TableCell className="max-w-[250px] truncate">{msg.message_content}</TableCell>
                      <TableCell>
                        <Badge variant={msg.status === "sent" || msg.status === "delivered" ? "default" : "secondary"}>
                          {msg.status || "sent"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(msg.sent_at).toLocaleDateString("es-MX", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead>Contenido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay plantillas</TableCell></TableRow>
                ) : (
                  templates.map((tpl) => (
                    <TableRow key={tpl.id}>
                      <TableCell className="font-medium">{tpl.name}</TableCell>
                      <TableCell>{tpl.template_type || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={tpl.approval_status === "approved" ? "default" : "secondary"}>
                          {tpl.approval_status || "draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>{tpl.is_active ? "✅" : "❌"}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{tpl.content}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="auto" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo Trigger</TableHead>
                  <TableHead>Respuesta</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Activo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {autoReplies.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay auto-respuestas</TableCell></TableRow>
                ) : (
                  autoReplies.map((ar) => (
                    <TableRow key={ar.id}>
                      <TableCell className="font-medium">{ar.name}</TableCell>
                      <TableCell>{ar.trigger_type}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{ar.reply_content}</TableCell>
                      <TableCell>{ar.priority}</TableCell>
                      <TableCell>{ar.is_active ? "✅" : "❌"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
