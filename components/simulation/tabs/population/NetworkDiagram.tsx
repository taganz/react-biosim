"use client";

import { useId, useState } from "react";
import { Network } from "@/simulation/creature/brain/Network";
import { NeuronType } from "@/simulation/creature/brain/Neuron";

export const NETWORK_COLORS = {
  sensor: "#4f8cff",
  neuron: "#a8a8a8",
  action: "#f2a541",
  positive: "#3fb950",
  negative: "#f85149",
};

const WIDTH = 640;
const LABEL_WIDTH = 170; // room for sensor names on the left and action names on the right
const ROW_HEIGHT = 40;
const PADDING = 30;
const RADIUS = 11;

export const formatWeight = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(2)}`;

type NodeKey = string; // "s<sensor>", "n<neuron>" or "a<action>"

interface Props {
  network: Network;
  sensorLabels: string[];
  actionLabels: string[];
}

// Layered diagram: sensors on the left, internal neurons in the middle, actions on the right
export default function NetworkDiagram({ network, sensorLabels, actionLabels }: Props) {
  const markerId = useId();
  const [highlighted, setHighlighted] = useState<NodeKey | null>(null);

  const sensorIds = new Set<number>();
  const actionIds = new Set<number>();
  for (const connection of network.connections) {
    if (connection.sourceType === NeuronType.SENSOR) sensorIds.add(connection.sourceId);
    if (connection.sinkType !== NeuronType.NEURON) actionIds.add(connection.sinkId);
  }
  const sensors = Array.from(sensorIds).sort((a, b) => a - b);
  const actions = Array.from(actionIds).sort((a, b) => a - b);
  const neurons = network.neurons.map((_, index) => index);

  if (network.connections.length === 0) {
    return <p>This species has no connections: its creatures never act.</p>;
  }

  const height = PADDING * 2 + ROW_HEIGHT * Math.max(sensors.length, neurons.length, actions.length, 1);
  const rowY = (index: number, count: number) =>
    PADDING + ((height - PADDING * 2) * (index + 0.5)) / count;

  const positions = new Map<NodeKey, { x: number; y: number }>();
  sensors.forEach((id, i) => positions.set(`s${id}`, { x: LABEL_WIDTH, y: rowY(i, sensors.length) }));
  neurons.forEach((id, i) => positions.set(`n${id}`, { x: WIDTH / 2, y: rowY(i, neurons.length) }));
  actions.forEach((id, i) => positions.set(`a${id}`, { x: WIDTH - LABEL_WIDTH, y: rowY(i, actions.length) }));

  const nodeName = (key: NodeKey) => {
    const id = parseInt(key.slice(1));
    if (key[0] === "s") return sensorLabels[id] ?? `Sensor ${id}`;
    if (key[0] === "a") return actionLabels[id] ?? `Action ${id}`;
    return `N${id}`;
  };

  // duplicated genes create parallel connections; draw them as one line with the summed weight
  const merged = new Map<string, { from: NodeKey; to: NodeKey; weight: number; genes: number }>();
  for (const connection of network.connections) {
    const from: NodeKey =
      connection.sourceType === NeuronType.SENSOR ? `s${connection.sourceId}` : `n${connection.sourceId}`;
    const to: NodeKey =
      connection.sinkType === NeuronType.NEURON ? `n${connection.sinkId}` : `a${connection.sinkId}`;
    const existing = merged.get(`${from}-${to}`);
    if (existing) {
      existing.weight += connection.weight;
      existing.genes++;
    } else {
      merged.set(`${from}-${to}`, { from, to, weight: connection.weight, genes: 1 });
    }
  }

  const edges = Array.from(merged.values()).map(({ from, to, weight, genes }, index) => {
    const a = positions.get(from)!;
    const b = positions.get(to)!;

    let path: string;
    if (from === to) {
      // self connection: small loop above the neuron
      path = `M ${a.x - 6} ${a.y - RADIUS} C ${a.x - 30} ${a.y - 50}, ${a.x + 30} ${a.y - 50}, ${a.x + 6} ${a.y - RADIUS}`;
    } else if (from[0] === "n" && to[0] === "n") {
      // neuron to neuron in the same column: arc on the right side
      path = `M ${a.x + RADIUS} ${a.y} C ${a.x + 80} ${a.y}, ${b.x + 80} ${b.y}, ${b.x + RADIUS} ${b.y}`;
    } else {
      const middleX = (a.x + b.x) / 2;
      path = `M ${a.x + RADIUS} ${a.y} C ${middleX} ${a.y}, ${middleX} ${b.y}, ${b.x - RADIUS - 2} ${b.y}`;
    }

    return { index, from, to, path, weight, genes };
  });

  const isDimmed = (from: NodeKey, to: NodeKey) =>
    highlighted !== null && highlighted !== from && highlighted !== to;

  const nodeProps = (key: NodeKey) => ({
    tabIndex: 0,
    onMouseEnter: () => setHighlighted(key),
    onMouseLeave: () => setHighlighted(null),
    onFocus: () => setHighlighted(key),
    onBlur: () => setHighlighted(null),
    opacity: highlighted !== null && highlighted !== key &&
      !edges.some((e) => (e.from === highlighted && e.to === key) || (e.to === highlighted && e.from === key))
      ? 0.3
      : 1,
    className: "cursor-default outline-none",
  });

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Neuronal network with ${sensors.length} sensors, ${neurons.length} internal neurons and ${actions.length} actions`}
    >
      <defs>
        {(["positive", "negative"] as const).map((sign) => (
          <marker
            key={sign}
            id={`${markerId}-${sign}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            // fixed size, otherwise arrowheads grow with the line width
            markerUnits="userSpaceOnUse"
            markerWidth="10"
            markerHeight="10"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={NETWORK_COLORS[sign]} />
          </marker>
        ))}
      </defs>

      {edges.map(({ index, from, to, path, weight, genes }) => {
        const sign = weight >= 0 ? "positive" : "negative";
        return (
          <path
            key={index}
            d={path}
            fill="none"
            stroke={NETWORK_COLORS[sign]}
            strokeWidth={1 + Math.abs(weight) * 1.2}
            // dashed negatives so the sign doesn't depend on color alone
            strokeDasharray={sign === "negative" ? "6 4" : undefined}
            strokeOpacity={isDimmed(from, to) ? 0.1 : 0.85}
            markerEnd={`url(#${markerId}-${sign})`}
          >
            <title>
              {`${nodeName(from)} → ${nodeName(to)}: ${formatWeight(weight)}${genes > 1 ? ` (${genes} genes)` : ""}`}
            </title>
          </path>
        );
      })}

      {sensors.map((id) => {
        const { x, y } = positions.get(`s${id}`)!;
        return (
          <g key={`s${id}`} {...nodeProps(`s${id}`)}>
            <title>{`Sensor: ${nodeName(`s${id}`)}`}</title>
            <circle cx={x} cy={y} r={RADIUS} fill={NETWORK_COLORS.sensor} />
            <text x={x - RADIUS - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize={13} fill="currentColor">
              {nodeName(`s${id}`)}
            </text>
          </g>
        );
      })}

      {neurons.map((id) => {
        const { x, y } = positions.get(`n${id}`)!;
        const constant = !network.neurons[id].driven;
        return (
          <g key={`n${id}`} {...nodeProps(`n${id}`)}>
            <title>
              {constant
                ? `Neuron N${id}: no inputs, constant output (works as a bias)`
                : `Neuron N${id}`}
            </title>
            <circle
              cx={x}
              cy={y}
              r={RADIUS}
              fill={constant ? "none" : NETWORK_COLORS.neuron}
              stroke={NETWORK_COLORS.neuron}
              strokeWidth={2}
              strokeDasharray={constant ? "3 2" : undefined}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={10}
              fill={constant ? "currentColor" : "#1a1a1a"}
            >
              {`N${id}`}
            </text>
          </g>
        );
      })}

      {actions.map((id) => {
        const { x, y } = positions.get(`a${id}`)!;
        return (
          <g key={`a${id}`} {...nodeProps(`a${id}`)}>
            <title>{`Action: ${nodeName(`a${id}`)}`}</title>
            <circle cx={x} cy={y} r={RADIUS} fill={NETWORK_COLORS.action} />
            <text x={x + RADIUS + 6} y={y} textAnchor="start" dominantBaseline="middle" fontSize={13} fill="currentColor">
              {nodeName(`a${id}`)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function NetworkLegend() {
  const swatch = (color: string, dashed = false) => (
    <svg width="28" height="10" aria-hidden="true">
      <line x1="0" y1="5" x2="28" y2="5" stroke={color} strokeWidth="3" strokeDasharray={dashed ? "6 4" : undefined} />
    </svg>
  );
  const dot = (color: string, hollow = false) => (
    <svg width="14" height="14" aria-hidden="true">
      <circle
        cx="7"
        cy="7"
        r="5.5"
        fill={hollow ? "none" : color}
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray={hollow ? "2 1.5" : undefined}
      />
    </svg>
  );

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      <li className="flex items-center gap-1">{dot(NETWORK_COLORS.sensor)} Sensor</li>
      <li className="flex items-center gap-1">{dot(NETWORK_COLORS.neuron)} Neuron</li>
      <li className="flex items-center gap-1">{dot(NETWORK_COLORS.neuron, true)} Constant neuron (bias)</li>
      <li className="flex items-center gap-1">{dot(NETWORK_COLORS.action)} Action</li>
      <li className="flex items-center gap-1">{swatch(NETWORK_COLORS.positive)} Positive weight</li>
      <li className="flex items-center gap-1">{swatch(NETWORK_COLORS.negative, true)} Negative weight</li>
      <li>Thicker line = larger weight. Hover a node or line for details.</li>
    </ul>
  );
}
