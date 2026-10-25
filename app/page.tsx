import Tab from "@/components/global/tabs/Tab";
import TabList from "@/components/global/tabs/TabList";
import TabPanel from "@/components/global/tabs/TabPanel";
import Tabs from "@/components/global/tabs/Tabs";
import ControlBar from "@/components/simulation/controlbar/ControlBar";
import SimulationCanvas from "@/components/simulation/SimulationCanvas";
import FilesPanel from "@/components/simulation/tabs/files/FilesPanel";
import MapPanel from "@/components/simulation/tabs/map/MapPanel";
import ScenarioPanel from "@/components/simulation/tabs/scenario/ScenarioPanel";
import SimulationPanel from "@/components/simulation/tabs/simulation/SimulationPanel";
import PopulationPanel from "@/components/simulation/tabs/population/PopulationPanel";
import StatsPanel from "@/components/simulation/tabs/stats/StatsPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evolution Simulation in the Browser",
  description:
    'Evolution and natural selection simulation running in the browser. Inspired on the video "I programmed some creatures. They Evolved." (by David R. Miller).',
};

export default function Home() {
  return (
    <main className="bg-grey-dark text-white">
      <ControlBar />

      <div className="min-h-screen">
        <div className="section-container py-5">
          <div className="grid gap-8 lg:grid-cols-2">
            <SimulationCanvas className="aspect-square w-full bg-grey-light" />

            <div>
              <Tabs>
                <TabList label="Simulation panels">
                  <Tab index={0}>Scenario</Tab>
                  <Tab index={1}>Simulation</Tab>
                  <Tab index={2}>Export</Tab>
                  <Tab index={3}>Tools</Tab>
                  <Tab index={4}>About</Tab>
                  {/* Old tabs: their components move to the new ones above */}
                  <Tab index={5}>Population</Tab>
                  <Tab index={6}>Stats</Tab>
                  <Tab index={7}>Map</Tab>
                  <Tab index={8}>Files</Tab>
                </TabList>

                <TabPanel index={0}>
                  <ScenarioPanel />
                </TabPanel>

                <TabPanel index={1}>
                  <SimulationPanel />
                </TabPanel>

                <TabPanel index={2}></TabPanel>

                <TabPanel index={3}></TabPanel>

                <TabPanel index={4}>
                  <p>
                      This is an environment to create <b>evolutionary simulations</b> inspired in the great video&nbsp;
                      <a
                    href="https://www.youtube.com/watch?v=N3tRFayqVtk"
                    target="_blank"
                  >
                    &apos;I programmed some creatures. They Evolved&apos;
                  </a>
                  , by davidrandallmiller.
                  </p>
                  <br/>
                  <p>How to use:</p>
                  <ul className="list-disc pl-6">
                    <li>Start by using one of the simulations based on the video in the &apos;Scenario&apos;&nbsp;panel.</li>
                    <li>Adjust simulation speed and restart in the control bar at the top.</li>
                    <li>See fitness evolution in &apos;Stats&apos;&nbsp;panel.</li>
                    <li>Modify scenario parameters in &apos;Scenario&apos;&nbsp;panel, and run options such as the seed in &apos;Simulation&apos;&nbsp;panel.</li>
                    <li>Edit the map in &apos;Map&apos;&nbsp;panel.</li>
                    <li>Create a gif or save an image of current generation in &apos;Files&apos;&nbsp;panel.</li>
                    <li>Save a copy of current simulation and load it again in &apos;Files&apos;&nbsp;panel.</li>
                  </ul>
                  <br/>
                  Source code:&nbsp;{" "}
                  <a
                    href="https://github.com/taganz/react-biosim"
                    target="_blank"
                  >
                    https://github.com/taganz/react-biosim
                  </a>
                  , by taganz. Feel free to leave your comments in the discussion section. 
                  <br/>
                  <br></br>This is a fork from the original port to react and typescript by carlo697:{" "}
                  <a
                    href="https://github.com/carlo697/react-biosim"
                    target="_blank"
                  >
                    https://github.com/carlo697/react-biosim
                  </a>
                  . Thanks to Carlos
                  <br/>
                </TabPanel>

                <TabPanel index={5}>
                  <PopulationPanel />
                </TabPanel>

                <TabPanel index={6}>
                  <StatsPanel />
                </TabPanel>

                <TabPanel index={7}>
                  <MapPanel />
                </TabPanel>

                <TabPanel index={8}>
                  <FilesPanel />
                </TabPanel>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
