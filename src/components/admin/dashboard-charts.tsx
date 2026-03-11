"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/index";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface VolumeData {
  date: string;
  amount: number;
}

interface TxnTypeData {
  type: string;
  count: number;
  volume: number;
}

interface KycData {
  name: string;
  value: number;
  color: string;
}

interface Props {
  volumeData: VolumeData[];
  txnTypeData: TxnTypeData[];
  kycData: KycData[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium text-slate-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === "number" && p.value > 100 ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export function DashboardCharts({ volumeData, txnTypeData, kycData }: Props) {
  const barColors = ["#0A2540", "#1E40AF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* === Volume Over Time (Area Chart) === */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-800 font-heading">Volume des transactions (30 jours)</h3>
        </CardHeader>
        <CardBody>
          {volumeData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              Aucune donnée de transaction sur les 30 derniers jours
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={volumeData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  name="Volume"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fill="url(#volumeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      {/* === KYC Status (Pie Chart) === */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-800 font-heading">Statut KYC</h3>
        </CardHeader>
        <CardBody>
          {kycData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              Aucune soumission KYC
            </div>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={kycData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {kycData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, ""]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {kycData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* === Transaction Types (Bar Chart) === */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-800 font-heading">Transactions complétées par type</h3>
        </CardHeader>
        <CardBody>
          {txnTypeData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              Aucune transaction complétée
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={txnTypeData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="type"
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Nombre" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {txnTypeData.map((_, i) => (
                    <Cell key={i} fill={barColors[i % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
