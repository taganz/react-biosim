import Tab from "@/components/global/tabs/Tab";
import TabList from "@/components/global/tabs/TabList";
import TabPanel from "@/components/global/tabs/TabPanel";
import Tabs from "@/components/global/tabs/Tabs";
import Footer from "@/components/simulation/footer/Footer";
import SimulationCanvas from "@/components/simulation/SimulationCanvas";
import LoadPanel from "@/components/simulation/tabs/load/LoadPanel";
import MapPanel from "@/components/simulation/tabs/map/MapPanel";
import StartPanel from "@/components/simulation/tabs/start/StartPanel";
import PopulationPanel from "@/components/simulation/tabs/population/PopulationPanel";
import SavePanel from "@/components/simulation/tabs/save/SavePanel";
import SettingsPanel from "@/components/simulation/tabs/settings/SettingsPanel";
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
      <div className="min-h-screen">
        <div className="section-container py-5">
          <h1 className="mb-10 text-center text-4xl lg:text-5xl">
            Evolution Simulation
          </h1>

          <div className="grid gap-8 lg:grid-cols-2">
            <SimulationCanvas className="aspect-square w-full bg-grey-light" />

            <div>
              <Tabs>
                <TabList>
                  <Tab index={0}>Start</Tab>
                  <Tab index={1}>Population</Tab>
                  <Tab index={2}>Stats</Tab>
                  <Tab index={3}>Settings</Tab>
                  <Tab index={4}>Map</Tab>
                  <Tab index={5}>Save</Tab>
                  <Tab index={6}>Load</Tab>
                  <Tab index={7}>About</Tab>
                </TabList>

                <TabPanel index={0}>
                  <StartPanel />
                </TabPanel>

                <TabPanel index={1}>
                  <PopulationPanel />
                </TabPanel>

                <TabPanel index={2}>
                  <StatsPanel />
                </TabPanel>

                <TabPanel index={3}>
                  <SettingsPanel />
                </TabPanel>

                <TabPanel index={4}>
                  <MapPanel />
                </TabPanel>

                <TabPanel index={5}>
                  <SavePanel />
                </TabPanel>

                <TabPanel index={6}>
                  <LoadPanel />
                </TabPanel>

                <TabPanel index={7}>
                  Source code :{" "}
                  <a
                    href="https://github.com/taganz/react-biosim"
                    target="_blank"
                  >
                    https://github.com/taganz/react-biosim
                  </a>
                  <br></br>A fork from:{" "}
                  <a
                    href="https://github.com/carlo697/react-biosim"
                    target="_blank"
                  >
                    https://github.com/carlo697/react-biosim
                  </a>
                  <br></br>Based on the video:{" "}
                  <a
                    href="https://www.youtube.com/watch?v=N3tRFayqVtk"
                    target="_blank"
                  >
                    &apos;I programmed some creatures. They Evolved&apos;
                  </a>
                  , by davidrandallmiller.
                </TabPanel>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
