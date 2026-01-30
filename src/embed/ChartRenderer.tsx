'use client';

import React from 'react';
import {
    LineChart,
    BarChart,
    PieChart,
    AreaChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Line,
    Bar,
    Pie,
    Area,
    Cell,
    ResponsiveContainer,
} from 'recharts';

interface ChartRendererProps {
    data: any[];
    annotation?: any;
    query?: any;
    title?: string;
    chartType?: 'bar' | 'line' | 'pie' | 'area';
}

const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884d8',
    '#82ca9d',
];

export const ChartRenderer: React.FC<ChartRendererProps> = ({
    data,
    annotation,
    query,
    title,
    chartType: propChartType,
}) => {
    console.log('ChartRenderer data:', data);
    console.log('ChartRenderer annotation:', annotation);
    console.log('ChartRenderer query:', query);
    console.log('ChartRenderer title:', title);
    console.log('ChartRenderer chartType:', propChartType);
    if (!data || data.length === 0) {
        return (
            <div className="text-sm text-gray-500">
                No data available for charting
            </div>
        );
    }

    // Determine chart type: use prop if provided, otherwise infer from query/data
    let chartType: 'line' | 'bar' | 'pie' | 'area' = propChartType || 'bar';

    // If chartType not provided, infer from query or data structure
    if (!propChartType) {
        // Check if there's a time dimension (suggests line/area chart)
        const hasTimeDimension =
            query?.timeDimensions && query.timeDimensions.length > 0;
        const measureCount = query?.measures?.length || 0;

        if (hasTimeDimension) {
            chartType = measureCount > 1 ? 'area' : 'line';
        } else if (measureCount === 1 && data.length <= 10) {
            chartType = 'pie';
        }
    }

    // Transform data for Recharts format
    const chartData = data.map((item) => {
        const transformed: any = {};
        Object.keys(item).forEach((key) => {
            // Handle nested objects (like dates)
            if (typeof item[key] === 'object' && item[key] !== null) {
                // Skip empty objects/arrays
                if (Array.isArray(item[key]) && item[key].length === 0) {
                    return;
                }
            }
            // Convert numeric strings to numbers
            const value = item[key];
            if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) {
                transformed[key] = parseFloat(value);
            } else {
                transformed[key] = value;
            }
        });
        return transformed;
    });

    // Get measure and dimension keys
    const dataKeys = Object.keys(chartData[0] || {});
    const measureKeys = dataKeys.filter(
        (key) =>
            typeof chartData[0]?.[key] === 'number' &&
            (annotation?.measures?.[key] ||
                key.includes('count') ||
                key.includes('sum'))
    );
    const dimensionKeys = dataKeys.filter(
        (key) =>
            typeof chartData[0]?.[key] !== 'number' ||
            (!measureKeys.includes(key) &&
                !key.includes('count') &&
                !key.includes('sum'))
    );

    // Render chart based on type
    const renderChart = () => {
        switch (chartType) {
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey={dimensionKeys[0] || dataKeys[0]}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            {measureKeys.map((key, index) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={COLORS[index % COLORS.length]}
                                    strokeWidth={2}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey={dimensionKeys[0] || dataKeys[0]}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            {measureKeys.map((key, index) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stackId="1"
                                    stroke={COLORS[index % COLORS.length]}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                const pieData = chartData.map((item, index) => ({
                    name:
                        String(item[dimensionKeys[0] || dataKeys[0]]) ||
                        `Item ${index + 1}`,
                    value: Number(item[measureKeys[0] || dataKeys[1]]) || 0,
                }));
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'bar':
            default:
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey={dimensionKeys[0] || dataKeys[0]}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            {measureKeys.map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );
        }
    };

    return (
        <div className="w-full my-4">
            {title && (
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {title}
                </h3>
            )}
            {renderChart()}
        </div>
    );
};
