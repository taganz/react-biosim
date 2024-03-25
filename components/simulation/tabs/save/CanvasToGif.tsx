import React, { useEffect, useRef, useCallback} from 'react';
import GIF from 'gif.js';
// using GIF in react https://github.com/jnordberg/gif.js/issues/115
import Button from "@/components/global/Button";
import {recordingAtom, recordingStopPendingAtom, savePendingAtom, gifAtom, framesAtom} from "../../store/gif";
import {worldAtom} from "../../store"
import { WorldEvents } from "@/simulation/events/WorldEvents";
import {atom, useAtom, useAtomValue} from 'jotai';
import {gifWorkerAsString} from "./gifWorkerAsString"


const CanvasToGIF: React.FC = () => {

  const [recording, setRecording] = useAtom(recordingAtom);
  const [recordingStopPending, setRecordingStopPending] = useAtom(recordingStopPendingAtom);
  const [savePending, setSavePending] = useAtom(savePendingAtom);
  const [gif, setGif] = useAtom(gifAtom);
  const [frames, setFrames] = useAtom(framesAtom);
  const world = useAtomValue(worldAtom);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
    
  // get canvas into canvasRef.current when mounting
  useEffect(()=> {
    
    let canvas : HTMLCanvasElement = document.getElementById('simCanvas') as HTMLCanvasElement;;
    if (canvas) {
        canvasRef.current = canvas;
        //console.log("CanvasToGif canvasRef.current = ", canvasRef.current);
      }
    else {
      //console.log("CanvasToGif canvas not found! ", canvas);
    }
  }, []);
    
  
  const startRecording = () => {
    if (!recording) {
      setRecording(true);
      setSavePending(true)
      if (!recordingStopPending) {
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
     setRecordingStopPending(false);
    }
  };

  const stopRecording = () => {
    if (recording) {
      setRecording(false);
      setRecordingStopPending(true);
    }
  };

  const downloadGIF = () => {
    if (savePending) {
      (gif as GIF).on('finished', (blob: any) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'sim'.concat(world==null ? "" : world.currentGen.toString(), '.gif');
        document.body.appendChild(a);
        a.click();
      });
      (gif as GIF).render();
      setSavePending(false);
      setRecordingStopPending(false);
      setRecording(false);
    }
  };

  const onInitializeWorld = ()=> {
    setRecording(false);
    setSavePending(false);
    // --> destruir el gif?
    }
  const onStartGeneration = ()=> {
    if (recordingStopPending) {
      setRecordingStopPending(false);
    }
  }

  // add current canvas frame to GIF
  const onEndStep =() => {
    if (!canvasRef.current) {
        console.error("Canvas not found", canvasRef.current);
        return;
    }
    if (recording || recordingStopPending) {
      const ctx = canvasRef.current.getContext('2d');
      const gifStepsBetweenImageRecord = 5;  // Record a frames evert N steps   - recommended 3 - 10
      const gifFrameDelay = 20;    
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

  // Bind world events
  useEffect(() => {
    if (world) {
      //onEndStep();

      world.events.addEventListener(
        WorldEvents.endStep,
        onEndStep
      );

      world.events.addEventListener(
        WorldEvents.initializeWorld,
        onInitializeWorld
      );
      world.events.addEventListener(
        WorldEvents.startGeneration,
        onStartGeneration
      );
      return () => {
        world.events.removeEventListener(
          WorldEvents.endStep,
          onEndStep
        );
        world.events.removeEventListener(
          WorldEvents.initializeWorld,
          onInitializeWorld
        );
        world.events.removeEventListener(
          WorldEvents.startGeneration,
          onStartGeneration
        );
        };
    }
  }, [onEndStep, world]);



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
    link.download = 'sim'.concat(world==null ? "" : world.currentGen.toString(), '.png'); 

    // Simulate a click on the link to trigger the download
    link.click();
  };


  return (
    <div>
      GIF generation. Long gifs can take some time to render
    <h2> {savePending ? (frames as number).toString().concat(" frames - ") : ""} {recording ? " Recording..." : " "}  {recordingStopPending ? " Recording will stop at generation end" : " " } {!recording && !recordingStopPending && savePending ? " Ready to download" : " " } </h2>
    <div className="grid grid-cols-3 gap-4">
      {/*<canvas ref={canvasRef} width={400} height={400}></canvas>*/}
      <Button onClick={startRecording}>Start Recording</Button>
      <Button onClick={stopRecording}>Stop Recording</Button>
      <Button onClick={downloadGIF}>Download GIF</Button>
    </div>
    <br/>
        <Button onClick={handleSaveImage}>Save image</Button>
    </div>
  );
};

export default CanvasToGIF;
