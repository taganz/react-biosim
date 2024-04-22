import { eventLoggerAtom } from "@/components/simulation/store";
import EventLogger from "@/simulation/logger/EventLogger";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useInterval } from "react-use";

/*
"this hook is designed to fetch a property value from an EventLogger instance 
at regular intervals, updating the state and returning the latest value. 
The optional compare function allows for more fine-grained control over 
when to update the state based on changes in the property value"
*/
export default function useEventLoggerPropertyValue<T>(
  getter: (eventLogger: EventLogger) => T,
  defaultValue: T,
  compare?: (a: T, b: T) => boolean
) {
  const eventLogger = useAtomValue(eventLoggerAtom);
  const [value, setValue] = useState(() =>
    eventLogger ? getter(eventLogger) : defaultValue
  );

  useInterval(() => {
    if (eventLogger) {
      const newValue = getter(eventLogger);
      if (compare) {
        if (!compare(value, newValue)) {
          setValue(newValue);
        }
      } else {
        setValue(newValue);
      }
    }
  }, 20);

  return value;
}
