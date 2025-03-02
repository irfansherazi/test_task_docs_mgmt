import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDocument {
    title: string;
    description: string;
    fileName: string;
    filePath: string;
    fileType: string;
    metadata: {
        size: number;
        uploadedBy: string;
        version: number;
        pageCount: number;
    };
}

interface DocumentTimestamps {
    createdAt: Date;
    updatedAt: Date;
}

export interface DocumentWithId extends IDocument {
    _id: Types.ObjectId;
}

export type DocumentWithTimestamps = Document<Types.ObjectId, {}, IDocument> & DocumentWithId & DocumentTimestamps;

const DocumentSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, required: true },
    metadata: {
        size: { type: Number, required: true },
        uploadedBy: { type: String, required: true },
        version: { type: Number, default: 1 },
        pageCount: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

export default mongoose.model<DocumentWithTimestamps>('Document', DocumentSchema); 