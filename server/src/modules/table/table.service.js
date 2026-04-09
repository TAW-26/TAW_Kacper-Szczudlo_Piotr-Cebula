import Table from "./table.model.js";
import Reservation from "../reservation/reservation.model.js";

const BLOCKING_RESERVATION_STATUSES = ["active", "pending"];

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

const isSameDay = (leftDate, rightDate) =>
	leftDate.getFullYear() === rightDate.getFullYear() &&
	leftDate.getMonth() === rightDate.getMonth() &&
	leftDate.getDate() === rightDate.getDate();

const hasReservationNow = (reservation, now) => {
	if (!BLOCKING_RESERVATION_STATUSES.includes(reservation.status)) {
		return false;
	}

	const reservationDate = new Date(reservation.reservationDate);
	if (Number.isNaN(reservationDate.getTime()) || !isSameDay(reservationDate, now)) {
		return false;
	}

	const startMinutes = toMinutes(reservation.startTime);
	const endMinutes = toMinutes(reservation.endTime);

	if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes) || startMinutes >= endMinutes) {
		return false;
	}

	const nowMinutes = now.getHours() * 60 + now.getMinutes();
	return nowMinutes >= startMinutes && nowMinutes < endMinutes;
};

export const getAllTables = async () => {
	const now = new Date();
	const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

	const [tables, reservations] = await Promise.all([
		Table.find(),
		Reservation.find({
			status: { $in: BLOCKING_RESERVATION_STATUSES },
			reservationDate: { $gte: dayStart, $lt: dayEnd },
		}).select("tableId reservationDate startTime endTime status"),
	]);

	const reservedTableIds = new Set(
		reservations.filter((reservation) => hasReservationNow(reservation, now)).map((reservation) => String(reservation.tableId)),
	);

	const normalizedTables = tables.map((table) => {
		const tableData = table.toObject();
		const isReservedNow = reservedTableIds.has(String(table._id));

		if (isReservedNow) {
			return { ...tableData, status: "reserved" };
		}

		if (tableData.status === "reserved") {
			return { ...tableData, status: "available" };
		}

		return tableData;
	});

	return { tables: normalizedTables };
};

export const createTable = async ({ tableNumber, capacity }) => {
	if (!tableNumber || !capacity) {
		throw createError(400, "Numer i pojemność są wymagane");
	}

	const existingTable = await Table.findOne({ tableNumber });
	if (existingTable) {
		throw createError(400, `Stolik o numerze ${tableNumber} już istnieje`);
	}

	const newTable = new Table({ tableNumber, capacity });
	const savedTable = await newTable.save();
	return { message: "Stolik został utworzony", data: savedTable };
};

export const updateTable = async (id, payload) => {
	if (payload?.status === "reserved") {
		throw createError(400, "Status 'reserved' jest ustawiany automatycznie na podstawie rezerwacji");
	}

	const updatedTable = await Table.findByIdAndUpdate(id, payload, { new: true });
	if (!updatedTable) {
		throw createError(404, "Stolik nie znaleziona");
	}

	return { message: "Stolik został zaktualizowany", data: updatedTable };
};

export const deleteTable = async (id) => {
	const deletedTable = await Table.findByIdAndDelete(id);
	if (!deletedTable) {
		throw createError(404, "Stolik nie znaleziona");
	}

	return { message: "Stolik został usunięty", data: deletedTable };
};