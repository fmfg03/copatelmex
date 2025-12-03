import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

type TrendDataPoint = {
  date: string;
  registrations: number;
  payments: number;
};

type TrendChartProps = {
  data: TrendDataPoint[];
  period: "day" | "week";
};

export const TrendChart = ({ data, period }: TrendChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Tendencia de Inscripciones ({period === "day" ? "Diaria" : "Semanal"})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }} 
              angle={-45} 
              textAnchor="end" 
              height={60}
            />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="registrations" 
              stroke="#0f4c81" 
              strokeWidth={2}
              name="Inscripciones"
              dot={{ r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="payments" 
              stroke="#22c55e" 
              strokeWidth={2}
              name="Pagos"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
