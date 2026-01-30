'use client';

import React from 'react';

interface Column {
    key: string;
    label: string;
    type?: 'string' | 'number' | 'date' | 'currency';
}

interface TableRendererProps {
    data: any[];
    columns?: Column[];
    title?: string;
}

const formatValue = (value: any, type?: 'string' | 'number' | 'date' | 'currency'): string => {
    if (value === null || value === undefined) {
        return '';
    }

    switch (type) {
        case 'number':
            return typeof value === 'number' 
                ? value.toLocaleString() 
                : String(value);
        
        case 'currency':
            const numValue = typeof value === 'number' 
                ? value 
                : parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
            if (isNaN(numValue)) return String(value);
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(numValue);
        
        case 'date':
            try {
                const date = value instanceof Date ? value : new Date(value);
                if (isNaN(date.getTime())) return String(value);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                });
            } catch {
                return String(value);
            }
        
        default:
            return String(value);
    }
};

export const TableRenderer: React.FC<TableRendererProps> = ({
    data,
    columns,
    title,
}) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-sm text-gray-500 my-4">
                No data available for table
            </div>
        );
    }

    // Infer columns from data if not provided
    let tableColumns: Column[] = columns || [];
    if (tableColumns.length === 0 && data.length > 0) {
        const firstRow = data[0];
        tableColumns = Object.keys(firstRow).map((key) => {
            const value = firstRow[key];
            let type: 'string' | 'number' | 'date' | 'currency' = 'string';
            
            if (typeof value === 'number') {
                type = 'number';
            } else if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
                type = 'date';
            } else if (typeof value === 'string' && /^\$|USD|EUR|GBP/.test(value)) {
                type = 'currency';
            }

            return {
                key,
                label: key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())
                    .trim(),
                type,
            };
        });
    }

    return (
        <div className="w-full my-4 max-w-full">
            {title && (
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {title}
                </h3>
            )}
            <div className="overflow-x-auto -mx-1 px-1">
                <div className="border border-gray-200 rounded-lg shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: 'max-content' }}>
                    <thead className="bg-gray-50">
                        <tr>
                            {tableColumns.map((column) => (
                                <th
                                    key={column.key}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="hover:bg-gray-50 transition-colors"
                            >
                                {tableColumns.map((column) => (
                                    <td
                                        key={column.key}
                                        className="px-6 py-4 text-sm text-gray-900"
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        {formatValue(row[column.key], column.type)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-right">
                {data.length} {data.length === 1 ? 'row' : 'rows'}
            </div>
        </div>
    );
};
