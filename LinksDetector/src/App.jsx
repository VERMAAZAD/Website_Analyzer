import CreateLink from "./CreateLink";
import LinkStats from "./LinkStats";

export default function App() {
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Link Generator + Tracker</h1>
      <CreateLink />
      <hr style={{ margin: "40px 0" }} />
      <LinkStats />
    </div>
  );
}
