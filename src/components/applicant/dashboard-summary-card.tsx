import type { ReactNode } from "react";
import { StatCard } from "@/components/ui/stat-card";

interface DashboardSummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  tone?: "green" | "blue" | "amber" | "red" | "slate";
}

export function DashboardSummaryCard({
  title,
  value,
  subtitle,
  icon,
  tone = "green",
}: DashboardSummaryCardProps) {
  return <StatCard title={title} value={value} subtitle={subtitle} icon={icon} tone={tone} />;
}
