// apps/platform/src/routes/index.tsx
import { api } from '@/utils/api';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    return await api.get('users').json();
  },
});

function App() {
  const data = Route.useLoaderData();

  return (
    <div>
      <div>
        {data.users.map((user) => {
          return <div key={user.id}>{user.name}</div>;
        })}
      </div>
    </div>
  );
}