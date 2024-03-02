import Tab from "@/components/global/tabs/Tab";
import TabList from "@/components/global/tabs/TabList";
import TabPanel from "@/components/global/tabs/TabPanel";
import Tabs from "@/components/global/tabs/Tabs";
import Footer from "@/components/simulation/footer/Footer";
import SimulationCanvas from "@/components/simulation/SimulationCanvas";
import LoadPanel from "@/components/simulation/tabs/load/LoadPanel";
import MapPanel from "@/components/simulation/tabs/map/MapPanel";
import PopulationPanel from "@/components/simulation/tabs/population/PopulationPanel";
import SavePanel from "@/components/simulation/tabs/save/SavePanel";
import SettingsPanel from "@/components/simulation/tabs/settings/SettingsPanel";
import StatsPanel from "@/components/simulation/tabs/stats/StatsPanel";

export default function Home() {
  return (
    <main className="bg-grey-dark text-white">
      <div className="min-h-screen">
        <div className="section-container py-5">
          <h1 className="mb-10 text-center text-4xl lg:text-5xl">
            Evolution Simulator
          </h1>

          <div className="grid gap-8 lg:grid-cols-2">
            <SimulationCanvas className="aspect-square w-full bg-grey-light" />

            <div>
              <Tabs>
                <TabList>
                  <Tab index={0}>Population</Tab>
                  <Tab index={1}>Stats</Tab>
                  <Tab index={2}>Settings</Tab>
                  <Tab index={3}>Map</Tab>
                  <Tab index={4}>Save</Tab>
                  <Tab index={5}>Load</Tab>
                  <Tab index={6}>About</Tab>
                </TabList>

                <TabPanel index={0}>
                  <PopulationPanel />
                </TabPanel>

                <TabPanel index={1}>
                  <StatsPanel />
                </TabPanel>

                <TabPanel index={2}>
                  <SettingsPanel />
                </TabPanel>

                <TabPanel index={3}>
                  <MapPanel />
                </TabPanel>

                <TabPanel index={4}>
                  <SavePanel />
                </TabPanel>

                <TabPanel index={5}>
                  <LoadPanel />
                </TabPanel>

                <TabPanel index={6}>
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
                    &apos;I programmed some creatures. They Evolved&apos;;
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
