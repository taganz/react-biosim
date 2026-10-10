import { Influence, InfluencePath } from "@/simulation/creature/brain/Helpers/networkInfluence";
import { formatWeight, NETWORK_COLORS } from "./NetworkDiagram";

interface Props {
  influences: Influence[];
  sensorLabels: string[];
  actionLabels: string[];
}

const describePath = ({ via, value }: InfluencePath) =>
  `${via.length === 0 ? "direct" : `via ${via.map((neuron) => `N${neuron}`).join(" → ")}`} ${formatWeight(value)}`;

export default function NetworkInfluenceTable({ influences, sensorLabels, actionLabels }: Props) {
  if (influences.length === 0) return null;

  const maxEffect = Math.max(...influences.map((influence) => Math.abs(influence.total)), 0.0001);

  return (
    <div className="flex flex-col gap-2">
      <table className="w-full text-left text-sm">
        <caption className="mb-2 text-left text-xs">
          How much each sensor pushes each action, adding up every path between them.
          Positive values push the action, negative values hold it back; movement actions
          only happen when their output is positive.
        </caption>
        <thead>
          <tr className="border-b border-grey-mid">
            <th scope="col" className="py-1 pr-2">Action</th>
            <th scope="col" className="py-1 pr-2">Driven by</th>
            <th scope="col" className="py-1 pr-2">Effect</th>
            <th scope="col" className="py-1">Paths</th>
          </tr>
        </thead>
        <tbody>
          {influences.map((influence) => {
            const { source, action, total, paths } = influence;
            const sourceLabel =
              source.type === "sensor"
                ? sensorLabels[source.index] ?? `Sensor ${source.index}`
                : `Constant N${source.neuron}`;
            const color = total >= 0 ? NETWORK_COLORS.positive : NETWORK_COLORS.negative;

            return (
              <tr
                key={`${source.type}-${source.type === "sensor" ? source.index : source.neuron}-${action}`}
                className="border-b border-grey-mid/40 align-top"
              >
                <td className="py-1 pr-2">{actionLabels[action] ?? `Action ${action}`}</td>
                <td className="py-1 pr-2">{sourceLabel}</td>
                <td className="py-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-right tabular-nums">{formatWeight(total)}</span>
                    <span
                      aria-hidden="true"
                      className="inline-block h-2 rounded-sm"
                      style={{ width: `${(Math.abs(total) / maxEffect) * 4}rem`, backgroundColor: color }}
                    />
                  </div>
                </td>
                <td className="py-1 text-xs">
                  {paths.length === 1 && paths[0].via.length === 0 ? "direct" : paths.map(describePath).join(" · ")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs">
        This is a linear estimate: it ignores how neurons saturate and their connections to
        themselves, so read it as a tendency, not an exact value.
      </p>
    </div>
  );
}
