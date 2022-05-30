import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import clsx from "clsx";
import { useCombobox } from "downshift";
import { useState } from "react";
import { LabelText } from "~/components";
import { requireUser } from "~/session.server";
import { searchCustomers } from "~/models/customer.server";

export const loader: LoaderFunction = async ({ request }) => {
	requireUser(request)

	const url = new URL(request.url)

	const search = await searchCustomers(url.searchParams.get('q') || '')

	return json(search)
};

type Customer = { id: string; name: string; email: string };

export function CustomerCombobox({ error }: { error?: string | null }) {
	const fetcher = useFetcher()

	console.log('CustomerCombobox fetcher', fetcher)

  const id = "customer-combobox";

  // 💿 set this to the customer data you get from the fetcher (if it exists)
  const customers: Array<Customer> = [];
  const [selectedCustomer, setSelectedCustomer] = useState<
    Customer | null | undefined
  >(null);

  const cb = useCombobox<Customer>({
    id,
    onSelectedItemChange: ({ selectedItem }) => {
      setSelectedCustomer(selectedItem);
    },
    items: customers,
    itemToString: (item) => (item ? item.name : ""),
    onInputValueChange: (changes) => {
			fetcher.submit({ q: changes.inputValue }, { action: "/resources/customers" });
    },
  });

  const displayMenu = cb.isOpen && customers.length > 0;

  return (
    <div className="relative">
      <input
        name="customerId"
        type="hidden"
        value={selectedCustomer?.id ?? ""}
      />
      <div className="flex flex-wrap items-center gap-1">
        <label {...cb.getLabelProps()}>
          <LabelText>Customer</LabelText>
        </label>
        {error ? (
          <em id="customer-error" className="text-d-p-xs text-red-600">
            {error}
          </em>
        ) : null}
      </div>
      <div {...cb.getComboboxProps()}>
        <input
          {...cb.getInputProps({
            className: clsx("text-lg w-full border border-gray-500 px-2 py-1", {
              "rounded-t rounded-b-0": displayMenu,
              rounded: !displayMenu,
            }),
            "aria-invalid": Boolean(error) || undefined,
            "aria-errormessage": error ? "customer-error" : undefined,
          })}
        />
      </div>
      <ul
        {...cb.getMenuProps({
          className: clsx(
            "absolute z-10 bg-white shadow-lg rounded-b w-full border border-t-0 border-gray-500 max-h-[180px] overflow-scroll",
            { hidden: !displayMenu }
          ),
        })}
      >
        {cb.isOpen
          ? customers.map((customer, index) => (
              <li
                className={clsx("cursor-pointer py-1 px-2", {
                  "bg-green-200": cb.highlightedIndex === index,
                })}
                key={customer.id}
                {...cb.getItemProps({ item: customer, index })}
              >
                {customer.name} ({customer.email})
              </li>
            ))
          : null}
      </ul>
    </div>
  );
}
