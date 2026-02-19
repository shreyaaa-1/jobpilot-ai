/* ================= BASE SKELETON ================= */

export const SkeletonLoader = ({
  count = 1,
  height = 'h-4',
  width = 'w-full',
}) => {
  return (
    <div aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${height} ${width} mb-3 animate-pulse`}
        />
      ))}
    </div>
  )
}

/* ================= CARD ================= */

export const CardSkeleton = () => (
  <div className="card space-y-4">
    <SkeletonLoader height="h-6" width="w-1/3" />
    <SkeletonLoader height="h-4" width="w-3/4" />
    <SkeletonLoader height="h-4" width="w-2/3" />
    <SkeletonLoader height="h-4" width="w-1/2" />
  </div>
)

/* ================= TABLE ================= */

export const TableSkeleton = ({ rows = 5 }) => (
  <div
    className="space-y-3"
    aria-busy="true"
    aria-live="polite"
  >
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-3">
        <div className="skeleton h-10 w-full animate-pulse" />
      </div>
    ))}
  </div>
)
