'use client';

import { User } from '@/api/user';
import { ReadableRoles } from '@/common/enums';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { convertISOtoReadableDate } from '@/lib/utils';
import { Column, ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { ReactElement } from 'react';

const sortableColumn = (
  column: Column<User, unknown>,
  header: string
): ReactElement => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {header}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

export const columns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: ({ column }) => sortableColumn(column, 'Id'),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => sortableColumn(column, 'Email'),
    cell: ({ row }) => <div className="lowercase">{row.getValue('email')}</div>,
  },
  {
    accessorKey: 'firstName',
    header: ({ column }) => sortableColumn(column, 'First Name'),
  },
  {
    accessorKey: 'lastName',
    header: ({ column }) => sortableColumn(column, 'Last Name'),
  },
  {
    accessorKey: 'role',
    header: ({ column }) => sortableColumn(column, 'Role'),
    cell: ({ row }) => {
      return <div>{ReadableRoles.get(row.original.role)}</div>;
    },
  },
  {
    accessorKey: 'Last Updated',
    header: ({ column }) => sortableColumn(column, 'Last Updated'),
    cell: ({ row }) => {
      return <div>{convertISOtoReadableDate(row.original.updatedAt)}</div>;
    },
  },
];
