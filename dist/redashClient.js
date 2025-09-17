import axios from 'axios';
import * as dotenv from 'dotenv';
import { logger } from './logger.js';
dotenv.config();
// RedashClient class for API communication
export class RedashClient {
    client;
    baseUrl;
    apiKey;
    constructor() {
        this.baseUrl = process.env.REDASH_URL || '';
        this.apiKey = process.env.REDASH_API_KEY || '';
        if (!this.baseUrl || !this.apiKey) {
            throw new Error('REDASH_URL and REDASH_API_KEY must be provided in .env file');
        }
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Key ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: parseInt(process.env.REDASH_TIMEOUT || '30000')
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
}
// Export a singleton instance
export const redashClient = new RedashClient();
