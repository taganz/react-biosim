import classNames from "classnames";
import { LoadStatus } from "@/hooks/useSimulationLoader";

interface Props {
  status: LoadStatus;
}

export default function StatusMessage({ status }: Props) {
  if (status.state === "idle") return null;

  return (
    <p
      // errors interrupt screen readers, progress and success are announced politely
      role={status.state === "error" ? "alert" : "status"}
      className={classNames(
        "rounded-md p-2 text-sm",
        status.state === "error" && "bg-red",
        status.state === "loading" && "bg-grey-mid",
        status.state === "success" && "border border-grey-mid"
      )}
    >
      {status.message}
    </p>
  );
}
