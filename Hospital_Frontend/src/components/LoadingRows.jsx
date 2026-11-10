export default function LoadingRows({ count }) {
  return (
    <div className="loading-rows" aria-label="Loading">
      <span /><span /><span /><span />
      {Array.from({ length: Math.max(0, count - 1) }, (_, index) => <span key={index} />)}
    </div>
  )
}
