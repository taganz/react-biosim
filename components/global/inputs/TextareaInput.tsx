import classNames from "classnames";
import { PropsWithChildren } from "react";
import TextareaAutosize, {
  TextareaAutosizeProps,
} from "react-textarea-autosize";

interface Props
  extends PropsWithChildren,
    TextareaAutosizeProps,
    React.RefAttributes<HTMLTextAreaElement> {}

export default function TextareaInput({ children, ...rest }: Props) {
  return (
    <div className="relative">
      <TextareaAutosize
        className={classNames(
          "word-spacing-md word w-full resize-none bg-grey-mid p-3 text-xs"
        )}
        {...rest}
      />
    </div>
  );
}
