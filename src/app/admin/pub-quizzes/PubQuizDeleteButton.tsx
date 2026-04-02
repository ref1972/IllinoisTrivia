"use client";

import { removePubQuiz } from "./actions";

export default function PubQuizDeleteButton({ id }: { id: number }) {
  return (
    <form
      action={removePubQuiz.bind(null, id)}
      onSubmit={e => { if (!confirm("Delete this listing?")) e.preventDefault(); }}
      className="inline"
    >
      <button type="submit" className="text-red-400 hover:text-red-600 text-sm">Delete</button>
    </form>
  );
}
