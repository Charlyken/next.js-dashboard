'use server';

import {z} from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Define a Zod schema for the form data
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce
        .number()
        .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
});

// Create a new type that omits the 'id' and 'date' fields for the create action
const CreateInvoice = FormSchema.omit({id: true, date: true});

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];

    };
    message?: string | null;

};

// Server action to create a new invoice
export async function createInvoice (prevState: State, formData: FormData){
    // Validate and parse the form data using Zod
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if(!validatedFields.success){
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    const {customerId, amount, status} = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    // Insert the new invoice into the database
    try{
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;} catch (error) {
        console.error(error);
    }

    // Revalidate the invoices page and redirect back to it
    revalidatePath('/dashboard/invoices');

    // Redirect to the invoices page after creation
    redirect('/dashboard/invoices');
}

// Create a new type that omits the 'id' and 'date' fields for the update action
const UpdateInvoice = FormSchema.omit({id : true, date: true});

// Server action to update an existing invoice
export async function updateInvoice(id: string, formData : FormData){
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    const amountInCents = amount * 100;

    // Update the existing invoice in the database
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

    // Revalidate the invoices page and redirect back to it
    revalidatePath('/dashboard/invoices');

    // Redirect to the invoices page after update
    redirect('/dashboard/invoices');

}

export async function deleteInvoice(id: string) {
    // Delete the invoice from the database
    await sql`
    DELETE FROM invoices
    WHERE id = ${id}
  `;
}