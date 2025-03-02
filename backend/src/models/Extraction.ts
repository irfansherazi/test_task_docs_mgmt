import mongoose, { Schema, Document } from 'mongoose';
import { Types } from 'mongoose';

export interface IExtraction extends Document {
    documentId: Types.ObjectId;
    extractions: Array<{
        id: string;
        text: string;
        pageNumber: number;
    }>;
}

const ExtractionSchema: Schema = new Schema({
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
    extractions: [{
        id: { type: String, required: true },
        text: { type: String, required: true },
        pageNumber: { type: Number, required: true }
    }]
}, {
    timestamps: true
});

export default mongoose.model<IExtraction>('Extraction', ExtractionSchema); 