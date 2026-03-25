import * as reservationService from "./reservation.service.js";

export const createAllReservations = async(req, res) => {
    try{
        const result = await reservationService.createReservation(req.body, req.user);
        res.status(201).json(result);
    }
    catch (error) {
        console.error("Błąd podczas tworzenia rezerwacji:", error);
        if (error?.code === 11000) {
            res.status(409).json({ error: "Ten stolik ma już rezerwację na wybraną godzinę" });
            return;
        }
        res.status(error.status || 500).json({ error: "Błąd serwera", details: error.message });
    }
}

export const getAllReservations = async(req, res) => {
    try{
        const result = await reservationService.getAllReservations();
        res.status(200).json(result);
    }
    catch (error) {
        console.error("Błąd podczas pobierania rezerwacji:", error);
        res.status(error.status || 500).json({ error: "Błąd serwera", details: error.message });
    }
}

export const cancelReservation = async(req, res) => {
    try{
        const result = await reservationService.cancelReservation(req.params.id);
        res.status(200).json(result);
    }
    catch (error) {
        console.error("Błąd podczas anulowania rezerwacji:", error);
        res.status(error.status || 500).json({ error: "Błąd serwera", details: error.message });
    }
}