# Evolution simulator

This is a tool to simulate evolution and natural selection

## What you will see in this simulation

In this simulation, you will see how creatures evolve.
The creatures have a "brain" that is determined by their genome.
The "brain" determines how the creatures move. Since the genome is random at the beginning, you will see that the creatures move unpredictably.
After a few generations, you will see how "natural selection" causes the creatures' brains to "adapt" to maximize their chances of survival.

## How it works

The simulation will start on its own.
You will see generations of creatures succeeding.
In each generation, the following occurs:
- Creatures of different species are born (with random genomes).
- They move according to their "brain."
- Generations last for a certain number of steps.
- When the generation ends, creatures that are not in the reproduction zone die.
- The survivors reproduce, passing their genome to their descendants. Mutations can occur during reproduction.
- And the next generation begins.

## What to observe

In each generation, there is a percentage of survivors. You can see this in the status bar.
In the "Stats" tab, you can see how the percentage of survival changes.

## How to experiment

In the "map" tab, you can change the distribution of obstacles, the survival zone, and the spawn zone.

## Credits

Source code : https://github.com/taganz/react-biosim

A fork from: https://github.com/carlo697/react-biosim

Based on the video: "I programmed some creatures. They Evolved", by davidrandallmiller.

## Changes at taganz version

Spawn zone: This rectangle indicates the area around which creatures will spawn.

# Technical

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.


