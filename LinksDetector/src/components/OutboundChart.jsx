import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from "recharts";

const COLORS = ["#0088FE", "#FF8042", "#00C49F", "#FF6384"];

export default function OutboundChart({ data }) {
  // Check if data is defined and is an array
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div>No Data Available</div>; // Display a fallback message when data is missing
  }

  return (
    <div className="chart-box">
      <h3>Domain Flow Funnel</h3>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            label
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
