"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "");
    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setPending(false);
    if (!response.ok) {
      setError("Could not create workspace.");
      return;
    }
    const data = (await response.json()) as { workspace: { id: string } };
    form.reset();
    router.push(`/w/${data.workspace.id}`);
    router.refresh();
  }

  return (
    <form className="row" onSubmit={onSubmit}>
      <input name="name" placeholder="Workspace name" required />
      <button className="btn accent" disabled={pending} type="submit">
        Create
      </button>
      {error ? <span className="error">{error}</span> : null}
    </form>
  );
}
