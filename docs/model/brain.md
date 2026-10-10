# Brain and genome

Source: [simulation/creature/brain/](../../simulation/creature/brain/), mainly [Genome.ts](../../simulation/creature/brain/Genome.ts), [CreatureBrain.ts](../../simulation/creature/brain/CreatureBrain.ts) and [Network.ts](../../simulation/creature/brain/Network.ts). The design follows biosim4's `feedForward.cpp`.

## From gene to connection

A genome is a list of 32-bit integers. Each gene encodes one connection:

```
bit  31        30 ─ 24      23        22 ─ 16      15 ─────────── 0
   ┌────────┬────────────┬────────┬────────────┬──────────────────┐
   │ source │ source id  │  sink  │  sink id   │      weight      │
   │  type  │  (7 bits)  │  type  │  (7 bits)  │    (16 bits)     │
   └────────┴────────────┴────────┴────────────┴──────────────────┘
    1 = sensor            1 = action             value / 8192 − 4
    0 = neuron            0 = neuron             → [−4, +4)
```

The 7-bit ids are mapped onto what exists, using a modulo:

| Field | Taken modulo |
|---|---|
| source id, when the source is a sensor | number of **enabled** sensors |
| source id, when the source is a neuron | **Max neurons** |
| sink id, when the sink is an action | number of **enabled** actions |
| sink id, when the sink is a neuron | **Max neurons** |

So a gene does not name a sensor: it names "the *n*-th enabled sensor". The same genome wires up differently if the list of enabled sensors or actions changes.

## Building the network

`CreatureBrain` turns the list of connections into a network once, when the creature is born:

1. **Decode** every gene into a connection.
2. **Prune useless neurons.** A neuron whose only outputs go back to itself cannot affect any action. It is removed with all the connections that feed it. The check is repeated until nothing more can be removed, because removing one neuron can make another useless.
3. **Renumber** the remaining internal neurons as 0, 1, 2…. These are the N0, N1… labels in the diagrams.
4. **Order** the connections: first all connections into neurons, then all connections into actions.
5. Mark each neuron as **driven** if it receives input from a sensor or from another neuron. A neuron with no inputs, or only a connection to itself, is **undriven**. It keeps its initial output of **0.5** forever and works as a constant bias. The network diagrams show these as dashed *constant neurons*.

Duplicate genes add up: two genes with the same source and sink act as one connection with the sum of their weights.

## Computing a step

Every step, `Network.feedForward(sensorValues)`:

1. Resets the action sums and the neuron accumulators to 0.
2. Runs the connections into neurons. Each one adds `input × weight` to its target neuron's accumulator. The input is a sensor value, or **the output another neuron had in the previous step**.
3. Updates the output of every driven neuron to `tanh(accumulator)`. This happens just before the first connection into an action.
4. Runs the connections into actions. Each one adds `input × weight` to its action, using the neuron outputs just computed.
5. Applies `tanh` to each action sum. Every action output is therefore between −1 and 1.

`tanh` here is a fast rational approximation that is clamped to ±1 beyond ±3.

Some consequences:

- **Neurons give the brain memory.** Connections between neurons, including a neuron's connection to itself, use the value from the previous step, so the network can keep state over time.
- **Sensor → action genes are instant.** Paths that go through a neuron also act within the same step, because neuron outputs are updated before the actions are computed.
- A neuron with a constant output of 0.5 adds a **bias** to everything it feeds.

### How the action outputs are used

| Action | Fires when | Strength |
|---|---|---|
| Movement actions | output > 0 | the output is added to the urge to move |
| Photosynthesis | output > 0 | water taken = `MASS_WATER_TO_MASS_PER_STEP × output` |
| Reproduction | output > 0 | the output is not used |
| AttackPlant, AttackAnimal | output > 0.6 | the output is not used |

A negative output does nothing. In particular, MoveNorth with a negative output does **not** push the creature south.

## Reading the diagrams

The Population tab shows the pruned network (see [Population and brains](../user/population-and-brains.md)). The **What drives each action** table multiplies the weights along every path from a sensor (or a constant neuron) to an action and adds the paths together. This is a linear estimate: it ignores `tanh` saturation and self-connections ([networkInfluence.ts](../../simulation/creature/brain/Helpers/networkInfluence.ts)).

## Mutation

When a child is created from a parent, `Genome.clone()` copies the genes and may change them:

1. **Point mutation**, with probability **Mutation probability**: one randomly chosen gene changes according to **Mutation mode**:
   - `wholeGene`: replaced by a new random gene;
   - `singleBit`: one random bit is flipped;
   - `singleHexDigit`: one of its 8 hexadecimal digits is replaced by a random digit.
2. **Insertion or deletion**, with probability **Insertion/Deletion probability**:
   - with probability `deletionRatio` (0.5 by default), one random gene is removed, as long as at least one gene remains;
   - otherwise, one random gene is added at the end, as long as the genome is shorter than **Max genome size**.

So each child has at most one point mutation and one insertion or deletion. Generation-1 creatures are not mutated.

What the mutation modes mean in practice:

- `wholeGene` makes big jumps: the connection can change source, target and weight all at once.
- `singleBit` usually makes small changes, but one flipped bit in a type or id field rewires the connection entirely.
- `singleHexDigit` falls in between.
