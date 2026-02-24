import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import {fetchCustomers, fetchInvoiceById} from '@/app/lib/data';

/**
 * Fetches the invoice and customers data, then renders the edit invoice form with breadcrumbs.
 *
 * @returns {JSX.Element} The main content of the edit invoice page, including breadcrumbs and the edit form.
 * @constructor
 */
export default async function Page(props : { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;
    const [invoice, customers] = await Promise.all([
        fetchInvoiceById(id),
        fetchCustomers()
    ]);
    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Invoices', href: '/dashboard/invoices' },
                    {
                        label: 'Edit Invoice',
                        href: `/dashboard/invoices/${id}/edit`,
                        active: true,
                    },
                ]}
            />
            <Form invoice={invoice} customers={customers} />
        </main>
    );
}