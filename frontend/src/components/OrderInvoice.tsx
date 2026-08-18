import { INVOICE_SELLER } from '@/lib/invoiceConfig';

/** Structural shape covering both the customer's OrderDetail and staff's
 * StaffOrderDetail - both already carry everything an invoice needs, so one
 * component renders either without the caller reshaping anything. */
export interface InvoiceOrder {
  order_id: string;
  status: string;
  payment_status: string;
  items: {
    id: number;
    product_snapshot: { name: string; sku: string; price: string };
    quantity: number;
    price: string;
  }[];
  subtotal: string;
  discount: string;
  total: string;
  delivery_charge: string;
  shipping_address: Record<string, string>;
  delivery_type: string;
  created_at: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  razorpay_payment_id: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function rupees(amount: string | number) {
  return `Rs. ${Number(amount).toFixed(2)}`;
}

/** A printable invoice, styled as its own light "paper" regardless of the
 * site's committed dark theme - nobody wants to print a black page, and the
 * on-screen preview should already look like what comes out of the printer. */
export function OrderInvoice({ order }: { order: InvoiceOrder }) {
  const address = order.shipping_address;

  return (
    <div className="invoice-print-area mx-auto max-w-[800px] bg-white text-[#1a1a1a] p-8 sm:p-12 my-8 border border-[#ddd] print:border-0 print:my-0 print:p-0 print:max-w-none">
      <div className="flex justify-between items-start border-b-2 border-[#1a1a1a] pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{INVOICE_SELLER.name}</h1>
          {INVOICE_SELLER.addressLines.map((line) => (
            <p key={line} className="text-sm text-[#555]">
              {line}
            </p>
          ))}
          <p className="text-sm text-[#555]">Phone: {INVOICE_SELLER.phone}</p>
          {INVOICE_SELLER.gstin && <p className="text-sm text-[#555]">GSTIN: {INVOICE_SELLER.gstin}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold uppercase tracking-wide">Invoice</h2>
          <p className="text-sm text-[#555] mt-1">Order {order.order_id}</p>
          <p className="text-sm text-[#555]">Date: {formatDate(order.created_at)}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#888] mb-1.5">Bill To</p>
          <p className="font-semibold">{order.customer_name || '—'}</p>
          {order.customer_email && <p className="text-sm text-[#555]">{order.customer_email}</p>}
          {order.customer_phone && <p className="text-sm text-[#555]">{order.customer_phone}</p>}
          {order.delivery_type === 'home' && address && (
            <div className="text-sm text-[#555] mt-2">
              <p>{address.address_line1}</p>
              {address.address_line2 && <p>{address.address_line2}</p>}
              {address.landmark && <p>{address.landmark}</p>}
              <p>
                {address.city}, {address.state} - {address.pincode}
              </p>
            </div>
          )}
          {order.delivery_type === 'store_pickup' && (
            <p className="text-sm text-[#555] mt-2">Store pickup — no delivery address.</p>
          )}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-[#888] mb-1.5">Payment</p>
          <p className="text-sm capitalize">Status: {order.payment_status}</p>
          <p className="text-sm capitalize">Order status: {order.status}</p>
          {order.razorpay_payment_id && (
            <p className="text-sm text-[#555] break-all">Ref: {order.razorpay_payment_id}</p>
          )}
        </div>
      </div>

      <table className="w-full text-sm mb-8 border-collapse">
        <thead>
          <tr className="border-b-2 border-[#1a1a1a] text-left">
            <th className="py-2 font-bold">Item</th>
            <th className="py-2 font-bold">SKU</th>
            <th className="py-2 font-bold text-right">Qty</th>
            <th className="py-2 font-bold text-right">Price</th>
            <th className="py-2 font-bold text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-[#eee]">
              <td className="py-2.5 pr-3">{item.product_snapshot.name}</td>
              <td className="py-2.5 pr-3 text-[#555]">{item.product_snapshot.sku}</td>
              <td className="py-2.5 text-right">{item.quantity}</td>
              <td className="py-2.5 text-right">{rupees(item.price)}</td>
              <td className="py-2.5 text-right">{rupees(Number(item.price) * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-full sm:w-64 grid gap-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[#555]">Subtotal</span>
            <span>{rupees(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#555]">Delivery</span>
            <span>{rupees(order.delivery_charge)}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between">
              <span className="text-[#555]">Discount</span>
              <span>−{rupees(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t-2 border-[#1a1a1a] pt-2 mt-1">
            <span>Total</span>
            <span>{rupees(order.total)}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#888] border-t border-[#eee] pt-4">
        Prices are inclusive of all applicable taxes (GST included). This is a computer-generated
        invoice and does not require a signature.
      </p>
    </div>
  );
}
