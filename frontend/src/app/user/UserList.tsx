import { useEffect, useState } from 'react';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { getUsers, User } from '@/api/user';

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    getUsers().then((users) => {
      setUsers(users);
      setLoading(false);
    });
  }, []);

  return (
    <div className="container mx-auto py-10">
      <DataTable loading={loading} columns={columns} data={users} />
    </div>
  );
}
