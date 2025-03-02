import { jest } from '@jest/globals';
import { Types } from 'mongoose';

// Define the structure of items stored in the mock database
interface MockItem {
    _id: Types.ObjectId;
    [key: string]: any;
}

// Define mongoose-like return types
type DeleteResult = { deletedCount: number };

// Need to re-type Jest's mock functionality to match our needs
type MockFn = ReturnType<typeof jest.fn>;

export class MockModel {
    static mockData: MockItem[] = [];
    static mockById: Record<string, MockItem> = {};

    static mockClear(): void {
        this.mockData = [];
        this.mockById = {};
    }

    // Create the mock functions with proper type assertions
    static find: MockFn = jest.fn();
    static findById: MockFn = jest.fn();
    static findOne: MockFn = jest.fn();
    static deleteOne: MockFn = jest.fn();
    static create: MockFn = jest.fn();

    // Initialize the mocks
    static {
        this.find.mockImplementation(() => ({
            lean: () => ({
                exec: () => Promise.resolve(this.mockData)
            })
        }));

        this.findById.mockImplementation((id: string) => ({
            lean: () => ({
                exec: () => Promise.resolve(this.mockById[id] || null)
            })
        }));

        this.findOne.mockImplementation((criteria: Record<string, any>) => ({
            lean: () => ({
                exec: () => Promise.resolve(
                    this.mockData.find(item =>
                        Object.entries(criteria).every(([key, value]) => item[key] === value)
                    ) || null
                )
            })
        }));

        this.deleteOne.mockImplementation(() => ({
            exec: () => Promise.resolve({ deletedCount: 1 } as DeleteResult)
        }));

        this.create.mockImplementation((data: Record<string, any>) => {
            const newItem: MockItem = {
                ...data,
                _id: new Types.ObjectId(),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            this.mockData.push(newItem);
            this.mockById[newItem._id.toString()] = newItem;
            return Promise.resolve(newItem);
        });
    }
}

export const createMockDocument = (override: Record<string, any> = {}): MockItem => ({
    _id: new Types.ObjectId(),
    title: 'Test Document',
    description: 'Test Description',
    fileName: 'test.pdf',
    filePath: '/path/to/test.pdf',
    fileType: 'application/pdf',
    metadata: {
        size: 12345,
        uploadedBy: 'test-user',
        version: 1,
        pageCount: 5
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...override
}); 