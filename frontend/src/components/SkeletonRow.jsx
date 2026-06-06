export default function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-zinc-800">
      <td className="px-4 py-3">
        <div className="h-4 w-24 bg-zinc-800 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-48 bg-zinc-800 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-12 bg-zinc-800 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 bg-zinc-800 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-6 w-16 bg-zinc-800 rounded-full" />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-zinc-800 rounded-lg" />
          <div className="h-8 w-8 bg-zinc-800 rounded-lg" />
          <div className="h-8 w-8 bg-zinc-800 rounded-lg" />
          <div className="h-8 w-8 bg-zinc-800 rounded-lg" />
        </div>
      </td>
    </tr>
  )
}
