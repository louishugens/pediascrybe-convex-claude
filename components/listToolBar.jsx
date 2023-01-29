import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useState } from "react";

import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  REMOVE_LIST_COMMAND
} from "@lexical/list";

import * as React from "react";

const blockTypeToBlockName = {
  bullet: "Bulleted List",
  number: "Numbered List",
  check: "Check List",
  paragraph: "Normal"
};

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState(
    "paragraph"
  );

  const formatList = (listType) => {
    console.log(blockType);
    // if (listType === "number" && blockType !== "number") {
    //   editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    //   setBlockType(blockTypeToBlockName["number"]);
    // } else if (listType === "bullet" && blockType !== "bullet") {
    //   editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    //   setBlockType(blockTypeToBlockName["bullet"]);
    // } else if (listType === "check" && blockType !== "check") {
    //   editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    //   setBlockType(blockTypeToBlockName["check"]);
    // } else {
    //   editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    //   setBlockType(blockTypeToBlockName["paragraph"]);
    // }

    if (listType === "bullet" && blockType !== "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      setBlockType("bullet");
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      setBlockType("paragraph");
    }
  };

  return (
    <div className="toolbar">
      <button
        disabled={false}
        className={"toolbar-item spaced"}
        onClick={() => formatList("bullet")}
      >
        <span className="text">Bullet List</span>
      </button>
      {/* <button
        disabled={false}
        className={"toolbar-item spaced"}
        onClick={() => formatList("number")}
      >
        <span className="text">Numbered List</span>
      </button>
      <button
        disabled={false}
        className={"toolbar-item spaced"}
        onClick={() => formatList("check")}
      >
        <span className="text">Check List</span>
      </button> */}
    </div>
  );
}
