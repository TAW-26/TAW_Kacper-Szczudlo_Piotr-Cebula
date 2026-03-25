import Reservation from "./reservation.model.js";
import Table from "../table/table.model.js";

const BLOCKING_STATUSES = ["active", "pending"];

const createError = (status, message) => {
	const error = new Error(message);
	error.status = status;
	return error;
};

const toMinutes = (timeValue) => {
	if (typeof timeValue !== "string") {
		return Number.NaN;
	}

	const [rawHours, rawMinutes] = timeValue.split(":");
	const hours = Number(rawHours);
	const minutes = Number(rawMinutes);

	if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
		return Number.NaN;
	}

	if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
		return Number.NaN;
	}

	return hours * 60 + minutes;
};

export const createReservation = async (payload, user) => {
	const { reservationDate, startTime, endTime, numberOfGuests } = payload;
	const userId = user?.userId;

	if (!userId) {
		throw createError(401, "Brak poprawnych danych użytkownika w tokenie");
	}

	if (!reservationDate || !startTime || !endTime || !numberOfGuests) {
		throw createError(400, "Brakuje wymaganych danych");
	}

	const startMinutes = toMinutes(startTime);
	const endMinutes = toMinutes(endTime);

	if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
		throw createError(400, "Nieprawidłowy format godzin. Użyj HH:mm");
	}

	if (startMinutes >= endMinutes) {
		throw createError(400, "Godzina zakończenia musi być późniejsza niż rozpoczęcia");
	}

	const suitableTables = await Table.find({
		capacity: { $gte: numberOfGuests }
	});

	if (suitableTables.length === 0) {
		throw createError(404, "Brak dostępnych stolików dla podanej liczby gości");
	}

	let assignedTableId = null;

	for (const table of suitableTables) {
		const overlappingReservations = await Reservation.find({
			tableId: table._id,
			reservationDate,
			status: { $in: BLOCKING_STATUSES },
			$or: [
				{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }
			]
		});

		if (!overlappingReservations.length) {
			assignedTableId = table._id;
			break;
		}
	}

	if (!assignedTableId) {
		throw createError(404, "Brak dostępnych stolików dla podanego terminu");
	}

	const newReservation = new Reservation({
		userId,
		tableId: assignedTableId,
		reservationDate,
		startTime,
		endTime,
		numberOfGuests,
		status: "active"
	});

	const savedReservation = await newReservation.save();
	return { message: "Rezerwacja została utworzona", data: savedReservation };
};

export const getAllReservations = async () => {
	const reservations = await Reservation.find()
		.populate("userId", "email role")
		.populate("tableId", "tableNumber capacity");

	return { reservations };
};

export const cancelReservation = async (id) => {
	const reservation = await Reservation.findByIdAndUpdate(
		id,
		{ status: "cancelled" },
		{ new: true }
	);

	if (!reservation) {
		throw createError(404, "Rezerwacja nie znaleziona");
	}

	return { message: "Rezerwacja została anulowana", data: reservation };
};