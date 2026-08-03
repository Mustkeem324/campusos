import React from 'react';
import { Search, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyStateMessage?: string;
  emptyStateDescription?: string;
  searchable?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  loading?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyStateMessage = 'No data found',
  emptyStateDescription = 'There are no records to display.',
  searchable,
  searchQuery,
  onSearchChange,
  loading
}: DataTableProps<T>) {

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm flex flex-col w-full">
      {searchable && (
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Input 
            leftIcon={<Search size={16} />}
            placeholder="Search records..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted text-text-secondary text-xs uppercase font-semibold">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-4 text-${col.align || 'left'}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border relative" aria-live="polite">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-12 text-center text-text-secondary">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-8 h-8 rounded-full border-4 border-border border-t-primary animate-spin"></div>
                    <span className="font-medium text-text-secondary text-sm">Loading records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-12 text-center text-text-secondary">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-surface-muted rounded-full flex items-center justify-center mb-4 text-border">
                      <Inbox size={32} />
                    </div>
                    <p className="text-lg font-semibold text-text-primary mb-1">{emptyStateMessage}</p>
                    <p className="text-sm">{emptyStateDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr key={keyExtractor(item)} className="hover:bg-surface-muted/50 transition">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-6 py-4 text-${col.align || 'left'}`}>
                      {col.render ? col.render(item) : String(item[col.key as keyof T] || '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {!loading && data.length > 0 && (
        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-text-secondary bg-surface-muted/30">
          <div>
            Showing <span className="font-medium text-text-primary">{data.length}</span> records
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<ChevronLeft size={16} />} disabled>
              Previous
            </Button>
            <Button variant="secondary" size="sm" rightIcon={<ChevronRight size={16} />} disabled>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
