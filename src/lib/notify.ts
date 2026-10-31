import type { Order } from './types';

/** Optional e-mail for each new order (set SMTP_HOST + ORDER_EMAIL_TO). */
export async function notifyByEmail(order: Order) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ORDER_EMAIL_TO } = process.env;
  if (!SMTP_HOST || !ORDER_EMAIL_TO) return;
  const nodemailer = await import('nodemailer');
  const port = Number(SMTP_PORT) || 465;
  const transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined });
  const lines = order.items.map((i) => `• ${i.qty} × ${i.name}${i.unit ? ' (' + i.unit + ')' : ''} — ${i.lineTotal} DT`);
  await transport.sendMail({
    from: SMTP_USER || ORDER_EMAIL_TO,
    to: ORDER_EMAIL_TO,
    subject: `Nouvelle commande ${order.id} — ${order.customer.name}`,
    text: [`Commande ${order.id}`, '', ...lines, '', `Total : ${order.total} DT`, '', `Client : ${order.customer.name}`, `Téléphone : ${order.customer.phone}`, `Adresse : ${order.customer.address}`, order.customer.note ? `Note : ${order.customer.note}` : ''].join('\n'),
  });
}
