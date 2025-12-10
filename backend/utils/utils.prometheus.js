import promClient from 'prom-client'

class PrometheusMetrics {
    constructor() {
        this.register = new promClient.Registry()

        promClient.collectDefaultMetrics({ 
            register: this.register,
            prefix: 'nodejs_'
        })

        this.httpRequestDuration = new promClient.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.5, 1, 5]
        })

        this.httpRequestTotal = new promClient.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code']
        })

        this.websocketConnections = new promClient.Gauge({
            name: 'websocket_connections_active',
            help: 'Number of active WebSocket connections',
            labelNames: ['type']
        })

        this.databaseQueries = new promClient.Counter({
            name: 'database_queries_total',
            help: 'Total number of database queries',
            labelNames: ['operation', 'table', 'status']
        })

        this.register.registerMetric(this.httpRequestDuration)
        this.register.registerMetric(this.httpRequestTotal)
        this.register.registerMetric(this.websocketConnections)
        this.register.registerMetric(this.databaseQueries)
    }

    trackRequest(request, reply) {
        const start = Date.now()
        
        reply.raw.on('finish', () => {
            const duration = (Date.now() - start) / 1000
            const route = request.routeOptions?.url || request.url
            const method = request.method
            const statusCode = reply.statusCode

            this.httpRequestDuration.observe(
                { method, route, status_code: statusCode },
                duration
            )

            this.httpRequestTotal.inc({
                method,
                route,
                status_code: statusCode
            })
        })
    }

    incrementWebSocket(type = 'general') {
        this.websocketConnections.inc({ type })
    }

    decrementWebSocket(type = 'general') {
        this.websocketConnections.dec({ type })
    }

    trackDatabaseQuery(operation, table, status = 'success') {
        this.databaseQueries.inc({ operation, table, status })
    }

    async getMetrics() {
        return await this.register.metrics()
    }

    getContentType() {
        return this.register.contentType
    }
}

const metrics = new PrometheusMetrics()
export default metrics
