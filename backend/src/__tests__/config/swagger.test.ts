import { swaggerSpec } from '../../config/swagger';

// Define an interface for the swagger spec
interface SwaggerSpec {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
    };
    servers: Array<{ url: string }>;
    components: {
        securitySchemes: {
            bearerAuth: {
                type: string;
                scheme: string;
                bearerFormat: string;
            }
        }
    };
}

// Mock the swaggerJsdoc module
jest.mock('swagger-jsdoc', () => {
    return jest.fn().mockImplementation((options) => {
        // Just return the options structure to verify it was correctly configured
        return {
            ...options.definition,
            apis: options.apis
        };
    });
});

describe('Swagger Configuration', () => {
    test('should export a swagger spec object', () => {
        // Verify the swagger spec is exported and has expected structure
        expect(swaggerSpec).toBeDefined();
        expect(swaggerSpec).toHaveProperty('openapi');
        expect(swaggerSpec).toHaveProperty('info');
        expect(swaggerSpec).toHaveProperty('servers');
        expect(swaggerSpec).toHaveProperty('components');
    });

    test('should have the correct API information', () => {
        const spec = swaggerSpec as SwaggerSpec;
        expect(spec.openapi).toBe('3.0.0');
        expect(spec.info.title).toBe('Document Management API');
        expect(spec.info.version).toBe('1.0.0');
        expect(spec.info.description).toBe('API documentation for the Document Management System');
    });

    test('should configure API server correctly', () => {
        const spec = swaggerSpec as SwaggerSpec;
        expect(spec.servers).toBeInstanceOf(Array);
        expect(spec.servers[0].url).toBe('/api');
    });

    test('should set up security schemes correctly', () => {
        const spec = swaggerSpec as SwaggerSpec;
        expect(spec.components.securitySchemes.bearerAuth).toBeDefined();
        expect(spec.components.securitySchemes.bearerAuth.type).toBe('http');
        expect(spec.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
        expect(spec.components.securitySchemes.bearerAuth.bearerFormat).toBe('JWT');
    });
}); 