import { jest } from '@jest/globals';
import { Types } from 'mongoose';

interface MockItem {
    _id: Types.ObjectId;
    [key: string]: any;
}

export class MockModel {
    static mockData: MockItem[] = [];
    static mockById: Record<string, MockItem> = {};

    static mockClear(): void {
        this.mockData = [];
        this.mockById = {};
    }

    static find = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockImplementation(() => ({
            exec: jest.fn().mockResolvedValue(this.mockData)
        }))
    }));

    static findById = jest.fn().mockImplementation((id: string) => ({
        lean: jest.fn().mockImplementation(() => ({
            exec: jest.fn().mockResolvedValue(this.mockById[id] || null)
        }))
    }));

    static findOne = jest.fn().mockImplementation((criteria: Record<string, any>) => ({
        lean: jest.fn().mockImplementation(() => ({
            exec: jest.fn().mockResolvedValue(
                this.mockData.find(item =>
                    Object.entries(criteria).every(([key, value]) => item[key] === value)
                ) || null
            )
        }))
    }));

    static deleteOne = jest.fn().mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 })
    }));

    static create = jest.fn().mockImplementation((data: Record<string, any>) => {
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