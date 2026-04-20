import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, style, ...props }, ref) => (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table
        ref={ref}
        className={cn(className)}
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13.5,
          borderTop: "1px solid var(--ink)",
          borderBottom: "1px solid var(--ink)",
          ...style,
        }}
        {...props}
      />
    </div>
  )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn(className)} {...props} />
  )
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn(className)} {...props} />
  )
);
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, style, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(className)}
      style={{ borderBottom: "1px solid var(--rule-soft)", ...style }}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, style, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(className)}
      style={{
        padding: "12px 14px",
        textAlign: "left",
        fontFamily: "var(--mono)",
        fontSize: 10,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "var(--ink)",
        fontWeight: 600,
        borderBottom: "2px solid var(--ink)",
        background: "var(--paper)",
        ...style,
      }}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, style, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(className)}
      style={{
        padding: "12px 14px",
        fontFamily: "var(--serif)",
        fontSize: 14,
        color: "var(--ink)",
        verticalAlign: "baseline",
        ...style,
      }}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
