import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";



export default function FlowChart({ data }) {
  return (
    <div className="chart-box">
      <h3>Daily Visitors</h3>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="visits" stroke="#0b5ed7" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
