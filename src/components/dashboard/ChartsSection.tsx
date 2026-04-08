"use client";

import { BarChart3, TrendingUp, PieChart, AreaChart } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart as ReAreaChart,
  Area,
} from "recharts";

interface ChartsSectionProps {
  data: {
    vendasMensais: { mes: string; total: number }[];
    performanceML: { mes: string; vendas: number; visualizacoes: number }[];
    distribuicaoEstoque: { categoria: string; quantidade: number }[];
    evolucaoFinanceira: { mes: string; receita: number; despesa: number }[];
  };
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function ChartsSection({ data }: ChartsSectionProps) {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-foreground flex items-center">
        <BarChart3 className="h-6 w-6 mr-2" />
        Análises e Gráficos
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribuição de Estoque */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center mb-6">
            <PieChart className="h-5 w-5 text-purple-500 mr-2" />
            <h3 className="text-lg font-semibold text-foreground">
              Distribuição de Estoque
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={data.distribuicaoEstoque}
                  cx="50%"
                  cy="50%"
                  label
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="quantidade"
                  nameKey="categoria"
                >
                  {data.distribuicaoEstoque.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vendas Mensais */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center mb-6">
            <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold text-foreground">
              Vendas Mensais
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.vendasMensais}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Mercado Livre */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center mb-6">
            <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-foreground">
              Performance ML
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.performanceML}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="vendas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="visualizacoes"
                  fill="#60a5fa"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evolução Financeira */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center mb-6">
            <AreaChart className="h-5 w-5 text-orange-500 mr-2" />
            <h3 className="text-lg font-semibold text-foreground">
              Evolução Financeira
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ReAreaChart data={data.evolucaoFinanceira}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stackId="1"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="despesa"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                />
              </ReAreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
