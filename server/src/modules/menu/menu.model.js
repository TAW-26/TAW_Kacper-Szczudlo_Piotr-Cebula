import mongoose from "mongoose";

const menuSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    imageUrl: { type: String },
    externalSource: { type: String },
    externalId: { type: String }
}, { timestamps: true });

menuSchema.index({ externalSource: 1, externalId: 1 }, { unique: true, sparse: true });

export default mongoose.model("Menu", menuSchema);