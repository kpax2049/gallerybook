import { User } from '@/common/types';
import { useEffect, useState } from 'react';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';

async function fetchUsers(): Promise<User[]> {
  const response = await fetch('http://localhost:3333/users', {
    // headers: {
    //   Authorization:
    //     'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQzLCJlbWFpbCI6ImtwYXhkZTM0QGdtYWlsLmNvbSIsImlhdCI6MTczNzU0OTI1MSwiZXhwIjoxNzM3NTUwMTUxfQ.uu2BMrdhqfRLDeNkYjKWGeZm8X47N1ULJ0yIW1mHlUc',
    // },
  });
  const data = await response.json();
  return data;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          throw error;
        }
      }
    }
    fetchData();
  }, []);
  if (error) {
    return <div>Error: {error}</div>;
  }
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={users} />
    </div>
  );
}
