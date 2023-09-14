const { Ticket } = require('../../../models/tickets');
const { ticketsServices } = require('../../../repositories/index');

class TicketsServices {
  getAllTickets = async (res) => {
    try {
      const tickets = await ticketsServices.findAll();
      const data = tickets;
      return res.sendSuccess(data);
    } catch (error) {
      return res.sendServerError('Error al obtener los tickets');
    }
  };
  getTicketById = async (tid, res) => {
    try {
      const ticket = await ticketsServices.findById(tid);
      if (!ticket) {
        return res.sendNotFound('Ticket no encontrado');
      } else {
        const data = ticket;
        return res.sendSuccess(data);
      }
    } catch (error) {
      return res.sendServerError('Error al obtener el ticket');
    }
  };
  addTicket = async (payload, res) => {
    try {
      const { code, purchase_datetime, amount, purchaser } = payload;
      const newTicket = new Ticket({
        code,
        purchase_datetime,
        amount,
        purchaser,
      });
      await ticketsServices.create(newTicket);
      const data = newTicket;
      return res.sendSuccess({ message: 'Ticket agregado correctamente', payload: data });
    } catch (error) {
      return res.sendServerError('Error al agregar el ticket');
    }
  };
  deleteTicket = async (tid, res) => {
    try {
      const deletedTicket = await ticketsServices.findByIdAndDelete(tid);
      if (!deletedTicket) {
        return res.sendNotFound('Ticket no encontrado');
      } else {
        const data = deletedTicket;
        return res.sendSuccess({ message: 'Ticket eliminado correctamente', payload: data });
      }
    } catch (error) {
      return res.sendServerError('Error al eliminar el ticket');
    }
  };
}
module.exports = new TicketsServices();