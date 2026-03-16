import { api } from "@/utils/api";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: App,
  loader: async () => {
    return await api.get("users").json();
  },
});

function App() {
  const router = useRouter();
  const data = Route.useLoaderData();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  async function handleAddUser() {
    await api.post("users", {
      json: { name, email },
    });
    router.invalidate();
  }

  return (
    <div>
      <div>
        {data.users.map((user: any) => {
          return <div key={user.id}>{user.name}</div>;
        })}
      </div>
      <div>
        <input placeholder="name" onChange={(e) => setName(e.target.value)} />
        <input placeholder="email" onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" onClick={handleAddUser}>
          Add User
        </button>
      </div>
    </div>
  );
}