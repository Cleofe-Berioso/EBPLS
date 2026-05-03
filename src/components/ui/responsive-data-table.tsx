import type { ReactNode } from "react";
import { TableContainer } from "@/components/ui/table-container";

export function ResponsiveDataTable({
  title,
  description,
  action,
  table,
  mobile,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  table: ReactNode;
  mobile: ReactNode;
}) {
  return (
    <TableContainer title={title} description={description} action={action}>
      <div className="hidden md:block">{table}</div>
      <div className="md:hidden">{mobile}</div>
    </TableContainer>
  );
}
