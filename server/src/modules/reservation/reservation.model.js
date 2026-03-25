import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    reservationDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    numberOfGuests: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'active', 'cancelled'], default: 'active' }
}, { timestamps: true });

reservationSchema.index(
    { tableId: 1, reservationDate: 1, startTime: 1, endTime: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: ['pending', 'active'] } }
    }
);

export default mongoose.model("Reservation", reservationSchema);