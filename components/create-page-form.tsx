"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CreatePageForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = event.currentTarget;
    const title = String(new FormData(form).get("title") ?? "");
    const response = await fetch(`/api/workspaces/${workspaceId}/pages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setPending(false);
    if (!response.ok) return;
    const data = (await response.json()) as { page: { id: string } };
    form.reset();
    router.push(`/w/${workspaceId}/p/${data.page.id}`);
    router.refresh();
  }

  return (
    <form className="row" onSubmit={onSubmit}>
      <input name="title" placeholder="Page title" required />
      <button className="btn accent" disabled={pending} type="submit">
        New page
      </button>
    </form>
  );
}
