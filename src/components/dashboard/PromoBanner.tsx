export function PromoBanner() {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-[#4f46e5] to-[#6d28d9] px-6 py-3 text-sm text-white">
      <span className="font-bold">The Next Era of Search Has Arrived</span>
      <span className="text-white/85">Customers are searching right now. Don't get left out of the AI answers.</span>
      <button
        type="button"
        disabled
        className="ml-auto rounded-md bg-white px-4 py-1.5 text-sm font-semibold text-indigo-700"
      >
        Learn about AI Visibility →
      </button>
      <span className="text-xs text-white/70">powered by VOCE</span>
    </div>
  );
}
