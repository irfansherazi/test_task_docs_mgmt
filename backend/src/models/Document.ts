import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
    title: string;
    description: string;
    fileName: string;
    filePath: string;
    fileType: string;
    uploadDate: Date;
    lastModified: Date;
    tags: string[];
    metadata: {
        size: number;
        uploadedBy: string;
        version: number;
    };
}

const DocumentSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    lastModified: { type: Date, default: Date.now },
    tags: [{ type: String }],
    metadata: {
        size: { type: Number, required: true },
        uploadedBy: { type: String, required: true },
        version: { type: Number, default: 1 }
    }
}, {
    timestamps: true
});

export default mongoose.model<IDocument>('Document', DocumentSchema); 