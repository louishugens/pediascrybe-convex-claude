import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { $createListItemNode, $createListNode } from "@lexical/list";

export default function prepopulatedText() {
  const root = $getRoot();
  if (root.getFirstChild() === null) {
    const paragraph = $createParagraphNode();
    paragraph.append($createTextNode("Play around with the list plugin here!"));
    root.append(paragraph);
  }

  const bulletList = $createListNode("bullet");
  bulletList.append(
    $createListItemNode().append(
      $createTextNode(`This is a bullet list example.`)
    ),
    $createListItemNode().append(
      $createTextNode(`And the below sample is a bullet list.`)
    )
  );
  root.append(bulletList);

  const numberedList = $createListNode("number");
  numberedList.append(
    $createListItemNode().append(
      $createTextNode(`This is a numbered list example.`)
    ),
    $createListItemNode().append($createTextNode(`Try nesting the lists.`))
  );
  root.append(numberedList);

  const paragraph2 = $createParagraphNode();
  paragraph2.append(
    $createTextNode("\nThis is a more complex check list example.")
  );
  root.append(paragraph2);

  const checkList = $createListNode("check");
  checkList.append(
    $createListItemNode().append(
      $createTextNode(`Try clicking on the check boxes.`)
    ),
    $createListItemNode().append($createTextNode(`Try the plugin yourself:)`))
  );
  root.append(checkList);
}
