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

// Values of one creature's network in the last step
export type NetworkActivity = {
  inputs: number[];   // sensor values
  neurons: number[];  // internal neuron outputs (-1..1)
  actions: number[];  // action outputs (-1..1)
};

interface Props {
  network: Network;
  sensorLabels: string[];
  actionLabels: string[];
  // when set, nodes show their values and lines the signal they carry (value × weight)
  activity?: NetworkActivity;
}

// brighter for values far from 0; values beyond ±1 are shown as fully bright
const intensity = (value: number) => 0.2 + 0.8 * Math.min(1, Math.abs(value));
const formatValue = (value: number) => value.toFixed(2);

// Layered diagram: sensors on the left, internal neurons in the middle, actions on the right
export default function NetworkDiagram({ network, sensorLabels, actionLabels, activity }: Props) {
  const markerId = useId();
  const [highlighted, setHighlighted] = useState<NodeKey | null>(null);

  const valueOf = (key: NodeKey): number | undefined => {
    if (!activity) return undefined;
    const id = parseInt(key.slice(1));
    if (key[0] === "s") return activity.inputs[id];
    if (key[0] === "n") return activity.neurons[id];
    return activity.actions[id];
  };

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
        const sourceValue = valueOf(from);
        // with activity, lines show the signal they carry in this step instead of the weight
        const signal = sourceValue !== undefined ? sourceValue * weight : undefined;
        const shown = signal ?? weight;
        const sign = shown >= 0 ? "positive" : "negative";
        const genesNote = genes > 1 ? ` (${genes} genes)` : "";
        return (
          <path
            key={index}
            d={path}
            fill="none"
            stroke={NETWORK_COLORS[sign]}
            strokeWidth={1 + Math.min(Math.abs(shown), 4) * 1.2}
            // dashed negatives so the sign doesn't depend on color alone
            strokeDasharray={sign === "negative" ? "6 4" : undefined}
            strokeOpacity={isDimmed(from, to) ? 0.1 : signal !== undefined ? intensity(signal) : 0.85}
            markerEnd={`url(#${markerId}-${sign})`}
          >
            <title>
              {signal !== undefined
                ? `${nodeName(from)} → ${nodeName(to)}: ${formatValue(sourceValue!)} × ${formatWeight(weight)} = ${formatWeight(signal)}${genesNote}`
                : `${nodeName(from)} → ${nodeName(to)}: ${formatWeight(weight)}${genesNote}`}
            </title>
          </path>
        );
      })}

      {sensors.map((id) => {
        const key = `s${id}`;
        const { x, y } = positions.get(key)!;
        const value = valueOf(key);
        return (
          <g key={key} {...nodeProps(key)}>
            <title>{`Sensor: ${nodeName(key)}${value !== undefined ? ` = ${formatValue(value)}` : ""}`}</title>
            <circle
              cx={x}
              cy={y}
              r={RADIUS}
              fill={NETWORK_COLORS.sensor}
              fillOpacity={value !== undefined ? intensity(value) : 1}
              stroke={NETWORK_COLORS.sensor}
            />
            <NodeLabel x={x - RADIUS - 6} y={y} anchor="end" name={nodeName(key)} value={value} />
          </g>
        );
      })}

      {neurons.map((id) => {
        const key = `n${id}`;
        const { x, y } = positions.get(key)!;
        const constant = !network.neurons[id].driven;
        const value = valueOf(key);
        return (
          <g key={key} {...nodeProps(key)}>
            <title>
              {(constant
                ? `Neuron N${id}: no inputs, constant output (works as a bias)`
                : `Neuron N${id}`) + (value !== undefined ? ` = ${formatValue(value)}` : "")}
            </title>
            <circle
              cx={x}
              cy={y}
              r={RADIUS}
              fill={constant ? "none" : NETWORK_COLORS.neuron}
              fillOpacity={value !== undefined ? intensity(value) : 1}
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
            {value !== undefined && (
              <text x={x} y={y + RADIUS + 11} textAnchor="middle" fontSize={10} fill="currentColor">
                {formatValue(value)}
              </text>
            )}
          </g>
        );
      })}

      {actions.map((id) => {
        const key = `a${id}`;
        const { x, y } = positions.get(key)!;
        const value = valueOf(key);
        return (
          <g key={key} {...nodeProps(key)}>
            <title>{`Action: ${nodeName(key)}${value !== undefined ? ` = ${formatValue(value)}` : ""}`}</title>
            <circle
              cx={x}
              cy={y}
              r={RADIUS}
              fill={NETWORK_COLORS.action}
              fillOpacity={value !== undefined ? intensity(value) : 1}
              stroke={NETWORK_COLORS.action}
            />
            <NodeLabel
              x={x + RADIUS + 6}
              y={y}
              anchor="start"
              name={nodeName(key)}
              value={value}
              // positive outputs are the ones that make the creature act
              valueColor={value !== undefined && value > 0 ? NETWORK_COLORS.positive : undefined}
            />
          </g>
        );
      })}
    </svg>
  );
}

// node name, with its value on a second line when showing activity
function NodeLabel({ x, y, anchor, name, value, valueColor }: {
  x: number;
  y: number;
  anchor: "start" | "end";
  name: string;
  value?: number;
  valueColor?: string;
}) {
  if (value === undefined) {
    return (
      <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize={13} fill="currentColor">
        {name}
      </text>
    );
  }
  return (
    <text x={x} y={y - 7} textAnchor={anchor} fontSize={13} fill="currentColor">
      <tspan x={x} dominantBaseline="middle">{name}</tspan>
      <tspan x={x} dy={15} fontSize={11} fill={valueColor ?? "currentColor"} fontWeight={valueColor ? "bold" : undefined}>
        {formatValue(value)}
      </tspan>
    </text>
  );
}

// showingActivity: lines show the signal of the current step instead of the weight
export function NetworkLegend({ showingActivity = false }: { showingActivity?: boolean }) {
  const lineMeaning = showingActivity ? "signal" : "weight";
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
      <li className="flex items-center gap-1">{swatch(NETWORK_COLORS.positive)} Positive {lineMeaning}</li>
      <li className="flex items-center gap-1">{swatch(NETWORK_COLORS.negative, true)} Negative {lineMeaning}</li>
      <li>
        {showingActivity
          ? "Thicker, brighter line = stronger signal (value × weight); brighter node = value further from 0. Positive action values (green) make the creature act."
          : "Thicker line = larger weight."}{" "}
        Hover a node or line for details.
      </li>
    </ul>
  );
}
