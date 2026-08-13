import type { ReactNode } from "react";
import { TableContainer } from "@/components/ui/table-container";

type ResponsiveTableBreakpoint = "md" | "lg" | "xl";

const breakpointClasses: Record<
  ResponsiveTableBreakpoint,
  { table: string; mobile: string }
> = {
  md: { table: "hidden md:block", mobile: "md:hidden" },
  lg: { table: "hidden lg:block", mobile: "lg:hidden" },
  xl: { table: "hidden xl:block", mobile: "xl:hidden" },
};

export function ResponsiveDataTable({
  title,
  description,
  action,
  table,
  mobile,
  switchAt = "md",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  table: ReactNode;
  mobile: ReactNode;
  switchAt?: ResponsiveTableBreakpoint;
}) {
  const classes = breakpointClasses[switchAt];

  return (
    <TableContainer title={title} description={description} action={action}>
      <div className={classes.table}>{table}</div>
      <div className={classes.mobile}>{mobile}</div>
    </TableContainer>
  );
}
