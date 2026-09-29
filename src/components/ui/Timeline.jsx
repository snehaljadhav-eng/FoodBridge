import "./Timeline.css";

// steps: [{ label, timestamp }] — timestamp is an ISO string once
// that stage has happened, or falsy if it hasn't happened yet.
export default function Timeline({ steps }) {
  return (
    <ol className="timeline">
      {steps.map((step) => {
        const done = Boolean(step.timestamp);
        return (
          <li key={step.label} className={done ? "timeline-done" : "timeline-pending"}>
            <span className="timeline-marker" aria-hidden="true" />
            <div className="timeline-content">
              <div className="timeline-label">{step.label}</div>
              {done && (
                <div className="timeline-time">
                  {new Date(step.timestamp).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
