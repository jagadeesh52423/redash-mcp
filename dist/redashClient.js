import axios from 'axios';
import * as dotenv from 'dotenv';
import * as https from 'https';
import { logger } from './logger.js';
dotenv.config();
// RedashClient class for API communication
export class RedashClient {
    client;
    baseUrl;
    apiKey;
    constructor(baseUrl, apiKey, timeout, rejectUnauthorized) {
        // Priority: constructor params > environment variables
        this.baseUrl = baseUrl || process.env.REDASH_URL || '';
        this.apiKey = apiKey || process.env.REDASH_API_KEY || '';
        const timeoutMs = timeout || parseInt(process.env.REDASH_TIMEOUT || '30000');
        if (!this.baseUrl || !this.apiKey) {
            throw new Error('REDASH_URL and REDASH_API_KEY must be provided either as constructor parameters or in .env file');
        }
        // Determine SSL verification setting with priority:
        // 1. Constructor parameter
        // 2. Environment variables
        // 3. Default to true (secure)
        let shouldRejectUnauthorized = true;
        if (rejectUnauthorized !== undefined) {
            shouldRejectUnauthorized = rejectUnauthorized;
        }
        else if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
            shouldRejectUnauthorized = false;
        }
        else if (process.env.REDASH_IGNORE_SSL_ERRORS === 'true') {
            shouldRejectUnauthorized = false;
        }
        // Create HTTPS agent with SSL certificate options
        const httpsAgent = new https.Agent({
            rejectUnauthorized: shouldRejectUnauthorized
        });
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Key ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: timeoutMs,
            httpsAgent: httpsAgent
        });
    }
    // Get all queries (with pagination)
    async getQueries(page = 1, pageSize = 25, q) {
        try {
            const response = await this.client.get('/api/queries', {
                params: { page, page_size: pageSize, q }
            });
            return {
                count: response.data.count,
                page: response.data.page,
                pageSize: response.data.page_size,
                results: response.data.results
            };
        }
        catch (error) {
            logger.error(`Error fetching queries: ${error}`);
            throw new Error('Failed to fetch queries from Redash');
        }
    }
    // Get a specific query by ID
    async getQuery(queryId) {
        try {
            const response = await this.client.get(`/api/queries/${queryId}`);
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching query ${queryId}:`, error);
            throw new Error(`Failed to fetch query ${queryId} from Redash`);
        }
    }
    // Create a new query
    async createQuery(queryData) {
        try {
            logger.info(`Creating new query: ${JSON.stringify(queryData)}`);
            logger.info(`Sending request to: ${this.baseUrl}/api/queries`);
            try {
                // Ensure we're passing the exact parameters the Redash API expects
                const requestData = {
                    name: queryData.name,
                    data_source_id: queryData.data_source_id,
                    query: queryData.query,
                    description: queryData.description || '',
                    options: queryData.options || {},
                    schedule: queryData.schedule || null,
                    tags: queryData.tags || []
                };
                logger.info(`Request data: ${JSON.stringify(requestData)}`);
                logger.info(`Request headers: ${JSON.stringify(this.client.defaults.headers)}`);
                const response = await this.client.post('/api/queries', requestData);
                logger.info(`Created query with ID: ${response.data.id}`);
                return response.data;
            }
            catch (axiosError) {
                // Log detailed axios error information
                logger.error(`Axios error in createQuery - Status: ${axiosError.response?.status || 'unknown'}`);
                logger.error(`Response data: ${JSON.stringify(axiosError.response?.data || {}, null, 2)}`);
                logger.error(`Request config: ${JSON.stringify({
                    url: axiosError.config?.url,
                    method: axiosError.config?.method,
                    headers: axiosError.config?.headers,
                    data: axiosError.config?.data
                }, null, 2)}`);
                if (axiosError.response) {
                    throw new Error(`Redash API error (${axiosError.response.status}): ${JSON.stringify(axiosError.response.data)}`);
                }
                else if (axiosError.request) {
                    throw new Error(`No response received from Redash API: ${axiosError.message}`);
                }
                else {
                    throw axiosError;
                }
            }
        }
        catch (error) {
            logger.error(`Error creating query: ${error instanceof Error ? error.message : String(error)}`);
            logger.error(`Stack trace: ${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}`);
            throw new Error(`Failed to create query: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Update an existing query
    async updateQuery(queryId, queryData) {
        try {
            logger.debug(`Updating query ${queryId}: ${JSON.stringify(queryData)}`);
            try {
                // Construct a request payload with only the fields we want to update
                const requestData = {};
                if (queryData.name !== undefined)
                    requestData.name = queryData.name;
                if (queryData.data_source_id !== undefined)
                    requestData.data_source_id = queryData.data_source_id;
                if (queryData.query !== undefined)
                    requestData.query = queryData.query;
                if (queryData.description !== undefined)
                    requestData.description = queryData.description;
                if (queryData.options !== undefined)
                    requestData.options = queryData.options;
                if (queryData.schedule !== undefined)
                    requestData.schedule = queryData.schedule;
                if (queryData.tags !== undefined)
                    requestData.tags = queryData.tags;
                if (queryData.is_archived !== undefined)
                    requestData.is_archived = queryData.is_archived;
                if (queryData.is_draft !== undefined)
                    requestData.is_draft = queryData.is_draft;
                logger.debug(`Request data for update: ${JSON.stringify(requestData)}`);
                const response = await this.client.post(`/api/queries/${queryId}`, requestData);
                logger.debug(`Updated query ${queryId}`);
                return response.data;
            }
            catch (axiosError) {
                // Log detailed axios error information
                logger.error(`Axios error in updateQuery - Status: ${axiosError.response?.status || 'unknown'}`);
                logger.error(`Response data: ${JSON.stringify(axiosError.response?.data || {}, null, 2)}`);
                logger.error(`Request config: ${JSON.stringify({
                    url: axiosError.config?.url,
                    method: axiosError.config?.method,
                    headers: axiosError.config?.headers,
                    data: axiosError.config?.data
                }, null, 2)}`);
                if (axiosError.response) {
                    throw new Error(`Redash API error (${axiosError.response.status}): ${JSON.stringify(axiosError.response.data)}`);
                }
                else if (axiosError.request) {
                    throw new Error(`No response received from Redash API: ${axiosError.message}`);
                }
                else {
                    throw axiosError;
                }
            }
        }
        catch (error) {
            logger.error(`Error updating query ${queryId}: ${error}`);
            throw new Error(`Failed to update query ${queryId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Archive (soft delete) a query
    async archiveQuery(queryId) {
        try {
            logger.debug(`Archiving query ${queryId}`);
            await this.client.delete(`/api/queries/${queryId}`);
            logger.debug(`Archived query ${queryId}`);
            return { success: true };
        }
        catch (error) {
            logger.error(`Error archiving query ${queryId}: ${error}`);
            throw new Error(`Failed to archive query ${queryId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // List available data sources
    async getDataSources() {
        try {
            const response = await this.client.get('/api/data_sources');
            return response.data;
        }
        catch (error) {
            logger.error(`Error fetching data sources: ${error}`);
            throw new Error('Failed to fetch data sources from Redash');
        }
    }
    // Execute a raw SQL query and return results
    async executeQuery(query, dataSourceId, parameters, maxAge = 0) {
        try {
            const requestData = {
                query,
                data_source_id: dataSourceId,
                parameters: parameters || {},
                max_age: maxAge
            };
            logger.debug(`Executing query: ${JSON.stringify(requestData)}`);
            const response = await this.client.post('/api/query_results', requestData);
            if (response.data.job) {
                // Query is being executed asynchronously, poll for results
                return await this.pollQueryResults(response.data.job.id);
            }
            // If query completed immediately, return the query result
            return response.data.query_result;
        }
        catch (error) {
            logger.error(`Error executing query: ${error}`);
            throw new Error(`Failed to execute query: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Execute a saved query by ID and return results
    async executeQueryById(queryId, parameters) {
        try {
            const response = await this.client.post(`/api/queries/${queryId}/results`, { parameters });
            if (response.data.job) {
                // Query is being executed asynchronously, poll for results
                return await this.pollQueryResults(response.data.job.id);
            }
            return response.data;
        }
        catch (error) {
            console.error(`Error executing query ${queryId}:`, error);
            throw new Error(`Failed to execute query ${queryId}`);
        }
    }
    // Poll for query execution results
    async pollQueryResults(jobId, timeout = 60000, interval = 1000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                const response = await this.client.get(`/api/jobs/${jobId}`);
                const job = response.data.job;
                if (job.status === 3) { // Completed
                    if (job.query_result_id) {
                        // Fetch the actual query results using the query_result_id
                        logger.debug(`Job completed, fetching results from query_result_id: ${job.query_result_id}`);
                        const resultsResponse = await this.client.get(`/api/query_results/${job.query_result_id}`);
                        return resultsResponse.data;
                    }
                    else {
                        throw new Error('Query completed but no query_result_id was provided');
                    }
                }
                else if (job.status === 4) { // Error
                    throw new Error(`Query execution failed: ${job.error}`);
                }
                logger.debug(`Job ${jobId} status: ${job.status}, continuing to poll...`);
                // Wait for the next poll
                await new Promise(resolve => setTimeout(resolve, interval));
            }
            catch (error) {
                logger.error(`Error polling for query results (job ${jobId}): ${error}`);
                // Extract detailed error information if available
                let errorMessage = `Failed to poll for query results (job ${jobId})`;
                // Check if it's an axios error with response data
                if (error.response) {
                    logger.error(`Axios error in polling - Status: ${error.response?.status || 'unknown'}`);
                    logger.error(`Response data: ${JSON.stringify(error.response?.data || {}, null, 2)}`);
                    // Include API response details in the error message
                    if (error.response.data) {
                        if (typeof error.response.data === 'string') {
                            errorMessage += `: ${error.response.data}`;
                        }
                        else if (error.response.data.message) {
                            errorMessage += `: ${error.response.data.message}`;
                        }
                        else {
                            errorMessage += `: ${JSON.stringify(error.response.data)}`;
                        }
                    }
                    else {
                        errorMessage += `: HTTP ${error.response.status}`;
                    }
                }
                else if (error instanceof Error) {
                    errorMessage += `: ${error.message}`;
                }
                else if (typeof error === 'string') {
                    errorMessage += `: ${error}`;
                }
                throw new Error(errorMessage);
            }
        }
        throw new Error(`Query execution timed out after ${timeout}ms`);
    }
    // Get all dashboards
    async getDashboards(page = 1, pageSize = 25) {
        try {
            const response = await this.client.get('/api/dashboards', {
                params: { page, page_size: pageSize }
            });
            return {
                count: response.data.count,
                page: response.data.page,
                pageSize: response.data.page_size,
                results: response.data.results
            };
        }
        catch (error) {
            console.error('Error fetching dashboards:', error);
            throw new Error('Failed to fetch dashboards from Redash');
        }
    }
    // Get a specific dashboard by ID
    async getDashboard(dashboardId) {
        try {
            const response = await this.client.get(`/api/dashboards/${dashboardId}`);
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching dashboard ${dashboardId}:`, error);
            throw new Error(`Failed to fetch dashboard ${dashboardId} from Redash`);
        }
    }
    // Create a new dashboard
    async createDashboard(dashboardData) {
        try {
            logger.info(`Creating new dashboard: ${JSON.stringify(dashboardData)}`);
            logger.info(`Sending request to: ${this.baseUrl}/api/dashboards`);
            try {
                // Ensure we're passing the exact parameters the Redash API expects
                const requestData = {
                    name: dashboardData.name,
                    tags: dashboardData.tags || [],
                    is_draft: dashboardData.is_draft !== undefined ? dashboardData.is_draft : true,
                    dashboard_filters_enabled: dashboardData.dashboard_filters_enabled !== undefined ? dashboardData.dashboard_filters_enabled : false
                };
                logger.info(`Request data: ${JSON.stringify(requestData)}`);
                const response = await this.client.post('/api/dashboards', requestData);
                logger.info(`Created dashboard with ID: ${response.data.id}`);
                return response.data;
            }
            catch (axiosError) {
                // Log detailed axios error information
                logger.error(`Axios error in createDashboard - Status: ${axiosError.response?.status || 'unknown'}`);
                logger.error(`Response data: ${JSON.stringify(axiosError.response?.data || {}, null, 2)}`);
                logger.error(`Request config: ${JSON.stringify({
                    url: axiosError.config?.url,
                    method: axiosError.config?.method,
                    headers: axiosError.config?.headers,
                    data: axiosError.config?.data
                }, null, 2)}`);
                if (axiosError.response) {
                    throw new Error(`Redash API error (${axiosError.response.status}): ${JSON.stringify(axiosError.response.data)}`);
                }
                else if (axiosError.request) {
                    throw new Error(`No response received from Redash API: ${axiosError.message}`);
                }
                else {
                    throw axiosError;
                }
            }
        }
        catch (error) {
            logger.error(`Error creating dashboard: ${error instanceof Error ? error.message : String(error)}`);
            logger.error(`Stack trace: ${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}`);
            throw new Error(`Failed to create dashboard: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Get a specific visualization by ID
    async getVisualization(visualizationId) {
        try {
            const response = await this.client.get(`/api/visualizations/${visualizationId}`);
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching visualization ${visualizationId}:`, error);
            throw new Error(`Failed to fetch visualization ${visualizationId} from Redash`);
        }
    }
    // Create a new widget
    async createWidget(widgetData) {
        try {
            logger.info(`Creating new widget: ${JSON.stringify(widgetData)}`);
            logger.info(`Sending request to: ${this.baseUrl}/api/widgets`);
            try {
                // Ensure we're passing the exact parameters the Redash API expects
                const requestData = {
                    dashboard_id: widgetData.dashboard_id,
                    width: widgetData.width || 1,
                    options: widgetData.options || {}
                };
                // For text widgets, include text field and set visualization_id to null
                if (widgetData.text !== undefined) {
                    requestData.text = widgetData.text;
                    requestData.visualization_id = null;
                }
                // For visualization widgets, include visualization_id
                else if (widgetData.visualization_id !== undefined) {
                    requestData.visualization_id = widgetData.visualization_id;
                }
                // If neither text nor visualization_id is provided, default to empty text widget
                else {
                    requestData.text = "";
                    requestData.visualization_id = null;
                }
                // Ensure options has proper structure for text widgets
                if (!requestData.options.position && requestData.text !== undefined) {
                    requestData.options.position = {
                        autoHeight: false,
                        sizeX: 3,
                        sizeY: 3,
                        minSizeX: 1,
                        maxSizeX: 6,
                        minSizeY: 1,
                        maxSizeY: 1000,
                        col: 0,
                        row: 0
                    };
                }
                // Ensure position has all required fields if it exists
                if (requestData.options.position) {
                    const pos = requestData.options.position;
                    requestData.options.position = {
                        autoHeight: pos.autoHeight !== undefined ? pos.autoHeight : false,
                        sizeX: pos.sizeX || 3,
                        sizeY: pos.sizeY || 3,
                        minSizeX: pos.minSizeX !== undefined ? pos.minSizeX : 1,
                        maxSizeX: pos.maxSizeX !== undefined ? pos.maxSizeX : 6,
                        minSizeY: pos.minSizeY !== undefined ? pos.minSizeY : 1,
                        maxSizeY: pos.maxSizeY !== undefined ? pos.maxSizeY : 1000,
                        col: pos.col !== undefined ? pos.col : 0,
                        row: pos.row !== undefined ? pos.row : 0
                    };
                }
                // Ensure isHidden is set
                if (requestData.options.isHidden === undefined) {
                    requestData.options.isHidden = false;
                }
                logger.info(`Request data: ${JSON.stringify(requestData)}`);
                const response = await this.client.post('/api/widgets', requestData);
                logger.info(`Created widget with ID: ${response.data.id}`);
                return response.data;
            }
            catch (axiosError) {
                // Log detailed axios error information
                logger.error(`Axios error in createWidget - Status: ${axiosError.response?.status || 'unknown'}`);
                logger.error(`Response data: ${JSON.stringify(axiosError.response?.data || {}, null, 2)}`);
                logger.error(`Request config: ${JSON.stringify({
                    url: axiosError.config?.url,
                    method: axiosError.config?.method,
                    headers: axiosError.config?.headers,
                    data: axiosError.config?.data
                }, null, 2)}`);
                if (axiosError.response) {
                    const errorData = axiosError.response.data;
                    let errorMessage = `Redash API error (${axiosError.response.status})`;
                    if (typeof errorData === 'string') {
                        errorMessage += `: ${errorData}`;
                    }
                    else if (errorData && typeof errorData === 'object') {
                        if (errorData.message) {
                            errorMessage += `: ${errorData.message}`;
                        }
                        else if (errorData.error) {
                            errorMessage += `: ${errorData.error}`;
                        }
                        else {
                            errorMessage += `: ${JSON.stringify(errorData)}`;
                        }
                    }
                    throw new Error(errorMessage);
                }
                else if (axiosError.request) {
                    throw new Error(`No response received from Redash API: ${axiosError.message}`);
                }
                else {
                    throw axiosError;
                }
            }
        }
        catch (error) {
            logger.error(`Error creating widget: ${error instanceof Error ? error.message : String(error)}`);
            logger.error(`Stack trace: ${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}`);
            throw new Error(`Failed to create widget: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Update an existing widget
    async updateWidget(widgetId, widgetData) {
        try {
            logger.debug(`Updating widget ${widgetId}: ${JSON.stringify(widgetData)}`);
            try {
                // First, get the current widget to preserve required fields
                const currentWidget = await this.client.get(`/api/widgets/${widgetId}`);
                const currentData = currentWidget.data;
                // Construct a request payload with current data and updates
                const requestData = {
                    id: widgetId,
                    dashboard_id: currentData.dashboard_id,
                    width: widgetData.width !== undefined ? widgetData.width : currentData.width,
                    options: widgetData.options !== undefined ? widgetData.options : currentData.options,
                    text: widgetData.text !== undefined ? widgetData.text : (currentData.text || "")
                };
                // Include visualization_id (either the actual ID or null for text widgets)
                if (currentData.visualization_id) {
                    requestData.visualization_id = currentData.visualization_id;
                }
                else {
                    requestData.visualization_id = null;
                }
                // Ensure options has proper structure with parameterMappings
                if (requestData.options && typeof requestData.options === 'object') {
                    if (!requestData.options.parameterMappings) {
                        requestData.options.parameterMappings = {};
                    }
                    if (requestData.options.isHidden === undefined) {
                        requestData.options.isHidden = false;
                    }
                }
                logger.debug(`Request data for widget update: ${JSON.stringify(requestData)}`);
                const response = await this.client.post(`/api/widgets/${widgetId}`, requestData);
                logger.debug(`Updated widget ${widgetId}`);
                return response.data;
            }
            catch (axiosError) {
                // Log detailed axios error information
                logger.error(`Axios error in updateWidget - Status: ${axiosError.response?.status || 'unknown'}`);
                logger.error(`Response data: ${JSON.stringify(axiosError.response?.data || {}, null, 2)}`);
                logger.error(`Request config: ${JSON.stringify({
                    url: axiosError.config?.url,
                    method: axiosError.config?.method,
                    headers: axiosError.config?.headers,
                    data: axiosError.config?.data
                }, null, 2)}`);
                if (axiosError.response) {
                    const errorData = axiosError.response.data;
                    let errorMessage = `Redash API error (${axiosError.response.status})`;
                    if (typeof errorData === 'string') {
                        errorMessage += `: ${errorData}`;
                    }
                    else if (errorData && typeof errorData === 'object') {
                        if (errorData.message) {
                            errorMessage += `: ${errorData.message}`;
                        }
                        else if (errorData.error) {
                            errorMessage += `: ${errorData.error}`;
                        }
                        else {
                            errorMessage += `: ${JSON.stringify(errorData)}`;
                        }
                    }
                    throw new Error(errorMessage);
                }
                else if (axiosError.request) {
                    throw new Error(`No response received from Redash API: ${axiosError.message}`);
                }
                else {
                    throw axiosError;
                }
            }
        }
        catch (error) {
            logger.error(`Error updating widget ${widgetId}: ${error}`);
            throw new Error(`Failed to update widget ${widgetId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Delete a widget
    async deleteWidget(widgetId) {
        try {
            logger.debug(`Deleting widget ${widgetId}`);
            await this.client.delete(`/api/widgets/${widgetId}`);
            logger.debug(`Deleted widget ${widgetId}`);
            return { success: true };
        }
        catch (error) {
            logger.error(`Error deleting widget ${widgetId}: ${error}`);
            throw new Error(`Failed to delete widget ${widgetId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
// Export a global variable for the client instance
export let redashClient;
// Initialize the client with optional configuration
export function initializeRedashClient(baseUrl, apiKey, timeout, rejectUnauthorized) {
    redashClient = new RedashClient(baseUrl, apiKey, timeout, rejectUnauthorized);
    return redashClient;
}
// Function to get the client instance, throwing an error if not initialized
export function getRedashClient() {
    if (!redashClient) {
        throw new Error('RedashClient not initialized. Please call initializeRedashClient() first or ensure proper configuration is available.');
    }
    return redashClient;
}
// Try to initialize with default (environment-based) configuration
try {
    redashClient = new RedashClient();
}
catch (error) {
    // Client will be initialized later with CLI arguments if environment variables are missing
    redashClient = undefined;
}
