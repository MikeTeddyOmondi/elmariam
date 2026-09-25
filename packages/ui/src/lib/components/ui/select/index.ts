import { Select as SelectPrimitive } from "bits-ui";
import Trigger from "./select-trigger.svelte";
import Content from "./select-content.svelte";
import Item from "./select-item.svelte";
import GroupHeading from "./select-group-heading.svelte";
import ScrollUpButton from "./select-scroll-up-button.svelte";
import ScrollDownButton from "./select-scroll-down-button.svelte";

const Root = SelectPrimitive.Root;
const Group = SelectPrimitive.Group;

export {
  Root,
  Group,
  GroupHeading,
  Trigger,
  Content,
  Item,
  ScrollUpButton,
  ScrollDownButton,
  //
  Root as SelectRoot,
  Trigger as SelectTrigger,
  Content as SelectContent,
  Item as SelectItem,
};

export { default as SelectField, type SelectOption } from "./select-field.svelte";
