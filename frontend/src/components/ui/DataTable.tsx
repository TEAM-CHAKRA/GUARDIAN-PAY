'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No records found on the ledger.',
  className,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto rounded-xl border border-[rgba(97,65,60,0.35)] bg-[#1A2C30]/50 backdrop-blur-xl',
        className
      )}
    >
      <table className="w-full text-left text-sm text-[#F8F9FA] border-collapse">
        <thead className="bg-[#122023]/90 text-xs font-mono uppercase tracking-wider text-[#C5BDB7] border-b border-[rgba(97,65,60,0.35)]">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={cn('px-4 py-3.5 font-medium whitespace-nowrap', col.headerClassName)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgba(97,65,60,0.2)] font-sans">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-[#C5BDB7]">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#FE7E3C]" />
                  <span className="font-mono text-xs">Querying cryptographic records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-[#C5BDB7]">
                <div className="flex flex-col items-center justify-center gap-1 font-mono text-xs">
                  <span className="text-[#C5BDB7]">[EMPTY LEDGER NODE]</span>
                  <span>{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((item, rowIdx) => (
              <tr
                key={item.id ? String(item.id) : rowIdx}
                onClick={() => onRowClick && onRowClick(item)}
                className={cn(
                  'transition-colors duration-150',
                  onRowClick
                    ? 'hover:bg-[#FE7E3C]/[0.08] cursor-pointer'
                    : 'hover:bg-[#0E6873]/20'
                )}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={cn('px-4 py-3.5 whitespace-nowrap align-middle', col.className)}
                  >
                    {col.cell
                      ? col.cell(item)
                      : col.accessorKey
                      ? String(item[col.accessorKey] ?? '')
                      : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
