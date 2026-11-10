export default function PageHeader({ title, subtitle, action }) {
  return (
    <section className="page-heading">
      <div>
        <p className="eyebrow">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        <h1>{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      {action && <div className="heading-actions">{action}</div>}
    </section>
  )
}
