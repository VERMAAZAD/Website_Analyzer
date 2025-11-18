

export default function RecentTable({ users }) {
  return (
    <div className="table-box">
      <h3>Recent Visitor Flow</h3>

      <table>
        <thead>
          <tr>
            <th>User UID</th>
            <th>From Domain</th>
            <th>To Domain</th>
            <th>Time</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u, i) => (
            <tr key={i}>
              <td>{u.uid}</td>
              <td>{u.from}</td>
              <td>{u.to}</td>
              <td>{new Date(u.time).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
