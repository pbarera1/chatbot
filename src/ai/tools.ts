import { tool as createTool } from 'ai';
import { z } from 'zod';

export const weatherTool = createTool({
    description: 'Display the weather for a location',
    inputSchema: z.object({
        location: z.string().describe('The location to get the weather for'),
    }),
    execute: async function ({ location }) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return { weather: 'Sunny', temperature: 75, location };
    },
});

// Example chart data - in production, this would come from your MCP server or database
const exampleChartData = [
    {
        activityType: 'Outgoing Phone Call',
        count: 14363,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Incoming Phone Call',
        count: 3849,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Outbound Email',
        count: 2553,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Committed Face Appointment',
        count: 1952,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Letter',
        count: 1638,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Inbound Email',
        count: 1571,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Text Message Conversation',
        count: 1259,
        user: 'Mike Jacobs',
    },
    {
        activityType: 'Committed Phone Appointment',
        count: 508,
        user: 'Mike Jacobs',
    },
];

export const chartTool = createTool({
    description:
        'Display a chart or visualization. Use this tool whenever the user asks to show data as a chart, visualize data, create a graph, display a bar chart, line chart, pie chart, or any other visualization. Always use this tool when the user mentions charts, graphs, or visualizations.',
    inputSchema: z.object({
        data: z
            .array(z.object({}).passthrough())
            .optional()
            .describe(
                'Array of data objects to display in the chart. Each object can have any properties with any values. If not provided, example data will be used.'
            ),
        title: z.string().optional().describe('Title for the chart'),
        chartType: z
            .enum(['bar', 'line', 'pie', 'area'])
            .optional()
            .describe('Type of chart to display'),
    }),
    execute: async function ({ data, title, chartType }) {
        console.log('[Chart Tool] Executing with params:', {
            data: data?.length,
            title,
            chartType,
        });

        // Simulate API call delay
        // await new Promise((resolve) => setTimeout(resolve, 2000));

        // If no data provided, use example data
        console.log('chart tool data', data);
        const chartData = data && data.length > 0 ? data : exampleChartData;

        console.log(
            '[Chart Tool] Returning chart data:',
            chartData.length,
            'items'
        );

        return {
            data: chartData,
            annotation: {
                measures: {
                    count: {
                        title: 'Count',
                        type: 'number',
                    },
                },
                dimensions: {
                    activityType: {
                        title: 'Activity Type',
                        type: 'string',
                    },
                },
            },
            query: {
                measures: ['count'],
                dimensions: ['activityType'],
            },
            title: title || 'Activity Counts',
            chartType: chartType || 'bar',
        };
    },
});

export const tableTool = createTool({
    description:
        'MANDATORY: Use this tool to display ANY structured data in a table format. You MUST use this tool whenever you have data that contains multiple rows with the same properties/columns, such as lists of records, query results, employee data, financial data, or any tabular information. DO NOT format data as markdown tables in your text response - ALWAYS use this tool instead. This tool creates an interactive, formatted table component that is much better than markdown. Use this tool when: (1) You receive data from report-query-tool or any MCP tool that returns structured/array data, (2) The user asks for a list, table, or structured data display, (3) You have multiple records with the same fields/properties. The tool accepts an array of objects where each object is a row.',
    inputSchema: z.object({
        data: z
            .array(z.object({}).passthrough())
            .describe(
                'Array of data objects to display in the table. Each object represents a row, and its properties represent columns.'
            ),
        title: z.string().optional().describe('Title for the table'),
        columns: z
            .array(
                z.object({
                    key: z.string().describe('Column key/property name'),
                    label: z.string().describe('Display label for the column'),
                    type: z
                        .enum(['string', 'number', 'date', 'currency'])
                        .optional()
                        .describe('Data type for formatting'),
                })
            )
            .optional()
            .describe(
                'Optional array of column definitions. If not provided, columns will be inferred from the data.'
            ),
    }),
    execute: async function ({ data, title, columns }) {
        console.log('[Table Tool] Executing with params:', {
            data: data?.length,
            title,
            columns: columns?.length,
        });

        if (!data || data.length === 0) {
            return {
                data: [],
                columns: [],
                title: title || 'Empty Table',
            };
        }

        // If columns not provided, infer from first data object
        let inferredColumns = columns;
        if (!inferredColumns && data.length > 0) {
            const firstRow = data[0];
            inferredColumns = Object.keys(firstRow).map((key) => {
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

        console.log(
            '[Table Tool] Returning table data:',
            data.length,
            'rows,',
            inferredColumns?.length || 0,
            'columns'
        );

        return {
            data,
            columns: inferredColumns || [],
            title: title || 'Data Table',
        };
    },
});

export const tools = {
    displayWeather: weatherTool,
    displayChart: chartTool,
    displayTable: tableTool,
};
