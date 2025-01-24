import { User } from '@/common/types';
import { useEffect, useState } from 'react';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import axiosClient from '@/lib/apiClient';

export default function UserList() {
  const client = axiosClient();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    client
      .get('/users')
      .then((response) => {
        setUsers(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
      });
  }, []); // executes once

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable loading={loading} columns={columns} data={users} />
    </div>
  );
}
