import { generateMockExtractions } from '../../utils/mockData';
import { v4 as uuidv4 } from 'uuid';

// Mock the uuid v4 function
jest.mock('uuid', () => ({
    v4: jest.fn().mockReturnValue('mocked-uuid-value')
}));

describe('Mock Data Utilities', () => {
    describe('generateMockExtractions', () => {
        test('should generate valid extractions with the provided document ID', () => {
            const documentId = 'test-doc-id';
            const result = generateMockExtractions(documentId);

            // Check document ID
            expect(result.documentId).toBe(documentId);

            // Check extractions array
            expect(Array.isArray(result.extractions)).toBe(true);
            expect(result.extractions.length).toBeGreaterThanOrEqual(8); // Min 8 extractions
            expect(result.extractions.length).toBeLessThanOrEqual(12); // Max 12 extractions

            // Validate each extraction
            result.extractions.forEach(extraction => {
                expect(extraction).toHaveProperty('id', 'mocked-uuid-value');
                expect(extraction).toHaveProperty('text');
                expect(extraction).toHaveProperty('pageNumber');
                expect(extraction.pageNumber).toBeGreaterThanOrEqual(1);
                expect(extraction.pageNumber).toBeLessThanOrEqual(5); // Pages are 1-5
            });

            // Verify extractions are sorted by page number
            for (let i = 1; i < result.extractions.length; i++) {
                expect(result.extractions[i].pageNumber).toBeGreaterThanOrEqual(
                    result.extractions[i - 1].pageNumber
                );
            }
        });

        test('should use the legal phrases provided in the implementation', () => {
            const documentId = 'test-doc-id';
            const result = generateMockExtractions(documentId);

            // All texts should be one of the legal phrases
            const allTextsAreValid = result.extractions.every(extraction => {
                return [
                    "The parties hereby agree to the following terms and conditions:",
                    "In accordance with Section 2.1 of the Agreement,",
                    "Subject to applicable laws and regulations,",
                    "The undersigned parties mutually agree that,",
                    "Notwithstanding anything to the contrary herein,",
                    "This Agreement shall be governed by and construed in accordance with,",
                    "For the avoidance of doubt,",
                    "Without limiting the generality of the foregoing,",
                    "The parties acknowledge and agree that,",
                    "In witness whereof, the parties have executed this Agreement as of"
                ].includes(extraction.text);
            });

            expect(allTextsAreValid).toBe(true);
        });

        test('should distribute extractions across 5 pages', () => {
            const documentId = 'test-doc-id';

            // Run the function multiple times to ensure distribution
            for (let i = 0; i < 5; i++) {
                const result = generateMockExtractions(documentId);

                // Get unique page numbers
                const uniquePages = new Set(
                    result.extractions.map(extraction => extraction.pageNumber)
                );

                // With enough extractions (8-12), we should cover multiple pages
                expect(uniquePages.size).toBeGreaterThanOrEqual(3);
            }
        });
    });
}); 