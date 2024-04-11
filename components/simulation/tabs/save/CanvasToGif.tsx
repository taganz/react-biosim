import React, { useEffect, useRef, useCallback} from 'react';
import GIF from 'gif.js';
// using GIF in react https://github.com/jnordberg/gif.js/issues/115
import Button from "@/components/global/Button";
import {stateInitialAtom, stateStartPendingAtom, stateRecordingAtom, stateSavePendingAtom, gifAtom, framesAtom} from "../../store/gif";

import {worldControllerAtom} from "../../store"
import { WorldEvents } from "@/simulation/events/WorldEvents";
import {atom, useAtom, useAtomValue} from 'jotai';
import {gifWorkerAsString} from "./gifWorkerAsString"


const CanvasToGIF: React.FC = () => {

  const worldController = useAtomValue(worldControllerAtom);

  // gif parameters

  // record a frame every N steps to keep generation size to 100 frames
  const gifStepsBetweenImageRecord = worldController ? Math.floor(worldController.stepsPerGen/100) : 5;  

  // delay in gif frames to keep gif duration similar to real time
  const gifFrameDelay = worldController ? Math.floor(worldController.stepsPerGen / 15) : 40;    

  // states
  const [stateInitial, setStateInitial] = useAtom(stateInitialAtom);
  const [stateRecording, setStateRecording] = useAtom(stateRecordingAtom);
  const [stateStartPending, setStateStartPending] = useAtom(stateStartPendingAtom);
  const [stateSavePending, setStateSavePending] = useAtom(stateSavePendingAtom);

  const [gif, setGif] = useAtom(gifAtom);
  const [frames, setFrames] = useAtom(framesAtom);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // get canvas into canvasRef.current when mounting
  useEffect(()=> {
    
    let canvas : HTMLCanvasElement = document.getElementById('simCanvas') as HTMLCanvasElement;;
    if (canvas) {
      canvasRef.current = canvas;
      //console.log("CanvasToGif canvasRef.current = ", canvasRef.current);
      setStateInitial(true);
      setStateStartPending(false);
      setStateRecording(false);
      setStateStartPending(false);
    }
    else {
      //console.log("CanvasToGif canvas not found! ", canvas);
    }
  }, []);
    
  
  const startRecording = () => {
    if (stateInitial || stateSavePending) {
      setStateInitial(false);
      setStateSavePending(false);
      setStateStartPending(true);
      setFrames(0);
        // --> setGif(new GIF({ workers: 2, workerScript: process.env.REACT_APP_PUBLIC_URL + '/gif.worker.js', quality: 10 }));
        // setGif(new GIF({ workers: 2, workerScript: 'http://localhost:3000/gif.workers.js', quality: 10 }));    // <--- conseguir url del servidor via process.env
        
      var workerStr =  gifWorkerAsString; // worker code as a string.
      var workerBlob = new Blob([workerStr as BlobPart], {   // RD: as BlobPart?
            type: 'application/javascript'
      });
      setGif(new GIF({
            workers: 2,
            workerScript: URL.createObjectURL(workerBlob),
            quality: 10
      }));        
      }
    }


  const downloadGIF = () => {
    if (stateSavePending) {
      setStateSavePending(false);
      setStateInitial(true);
      (gif as GIF).on('finished', (blob: any) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'sim'.concat(worldController==null ? "" : worldController.currentGen.toString(), '.gif');
        document.body.appendChild(a);
        a.click();
      });
      (gif as GIF).render();
      
    }
  };

  const onInitializeWorld = ()=> {
    if (stateStartPending || stateRecording) {
      setStateStartPending(false);
      setStateRecording(false);
      setStateSavePending(true);
    }
  }

  const onStartGeneration = ()=> {
    if (stateStartPending) {
      setStateStartPending(false);
      setStateRecording(true);
    }
    else {
      if (stateRecording) {
        setStateRecording(false);
        setStateSavePending(true);
      }      
    }

  }
  

  // add current canvas frame to GIF
  const onEndStep =() => {
    if (!canvasRef.current) {
        console.error("Canvas not found", canvasRef.current);
        return;
    }
    if (stateRecording) {
      const ctx = canvasRef.current.getContext('2d');

      if (ctx)  {    
        if (frames % gifStepsBetweenImageRecord == 0) {    
          // Add current canvas frame to GIF
          //(gif as GIF).addFrame(canvasRef.current, { copy: true, delay: 100 });
          (gif as GIF).addFrame(canvasRef.current, {copy: true, delay: gifFrameDelay });    
        }
        setFrames((frames) => frames+1);
      }
      else {
        console.log("ctx not found ", ctx, canvasRef.current);
      }
    }
  };

  // Bind worldController events
  useEffect(() => {
    if (worldController) {
      //onEndStep();

      worldController.events.addEventListener(
        WorldEvents.endStep,
        onEndStep
      );

      worldController.events.addEventListener(
        WorldEvents.initializeWorld,
        onInitializeWorld
      );
      worldController.events.addEventListener(
        WorldEvents.startGeneration,
        onStartGeneration
      );
      return () => {
        worldController.events.removeEventListener(
          WorldEvents.endStep,
          onEndStep
        );
        worldController.events.removeEventListener(
          WorldEvents.initializeWorld,
          onInitializeWorld
        );
        worldController.events.removeEventListener(
          WorldEvents.startGeneration,
          onStartGeneration
        );
        };
    }
  }, [onEndStep, worldController]);



  const handleSaveImage = () => {
    if (!canvasRef.current) {
      console.error("Canvas not found", canvasRef.current);
      return;
    }
    var mimeType = 'image/png'; // You can also use 'image/jpeg'
    var dataURL = canvasRef.current.toDataURL(mimeType);
    var link = document.createElement('a');
    link.href = dataURL;

    // Set the download attribute to specify the filename
    link.download = 'sim'.concat(worldController==null ? "" : worldController.currentGen.toString(), '.png'); 

    // Simulate a click on the link to trigger the download
    link.click();
  };


  return (
    <div>
    <br/>
    <h2> {stateInitial ? "Press Start to record a GIF for next generation" : ""}
		{stateStartPending ? " Recording will start at next generation..." : " "}  
		{stateRecording ? " Recording generation... ".concat((frames -1 as number).toString().concat(" steps ")) : " "}  
		{stateSavePending ? " Ready to download  ".concat((frames -1 as number).toString().concat(" steps "), ". Can take some time to render...") : " " } </h2>
    <div className="grid grid-cols-3 gap-4">
      {/*<canvas ref={canvasRef} width={400} height={400}></canvas>*/}
      <Button onClick={startRecording}>Record GIF</Button>
      <Button onClick={downloadGIF}>Download GIF</Button>
    </div>
    <br/>
    <p>Save a png image of canvas</p>
        <Button onClick={handleSaveImage}>Save image</Button>
    </div>
  );
};

export default CanvasToGIF;
