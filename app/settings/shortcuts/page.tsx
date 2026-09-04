import { SettingsSection } from "@/components/settings/SettingsSection";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

const SHORTCUTS: { title: string; description: string; keys: string[] }[] = [
  {
    title: "Switch view",
    description: "Gantt shows each task as a bar on a continuous time axis (Y M W D H). Calendar shows a year, month, week or day (Y M W D).",
    keys: ["Gantt", "Calendar"],
  },
  {
    title: "Zoom in or out",
    description: "Steps through years, months, weeks, days and hours, keeping the time under the cursor in place. Ctrl or ⌘ with the mouse wheel, or a trackpad pinch, does the same.",
    keys: ["-", "+"],
  },
  {
    title: "Previous or next unit",
    description: "Scrolls the timeline by one unit of the current scale (year, month, week, day or hour).",
    keys: ["←", "→"],
  },
  {
    title: "Jump to now",
    description: "Centres the current time on the timeline.",
    keys: ["T"],
  },
  {
    title: "Pan the timeline",
    description: "Hold Space and drag anywhere on the board. The mouse wheel also scrolls sideways.",
    keys: ["Space", "Drag"],
  },
  {
    title: "Move or resize a task",
    description: "Drag a bar to translate it by whole units of the current scale (15 minutes at hour scale). Drag the left or right edge to change the start or end. Drop on the delete zone at the bottom to remove it, with undo.",
    keys: ["Drag"],
  },
  {
    title: "Add a task",
    description: "Type in the SubHeader field to create a task on the unit at the centre of the view, or drag on an empty lane to create one on the swept range.",
    keys: ["Enter"],
  },
  {
    title: "Save a task",
    description: "While editing a title, saves the changes and closes the editor.",
    keys: ["Enter"],
  },
  {
    title: "Cancel editing",
    description: "Discards unsaved title and note changes.",
    keys: ["Esc"],
  },
];

export default function ShortcutsSettingsPage() {
  return (
    <SettingsSection title="Shortcuts" description="Keyboard and pointer shortcuts on the timeline.">
      <ItemGroup className="rounded-lg border">
        {SHORTCUTS.map((shortcut, index) => (
          <div key={shortcut.title}>
            {index > 0 && <ItemSeparator />}
            <Item size="sm">
              <ItemContent>
                <ItemTitle>{shortcut.title}</ItemTitle>
                <ItemDescription>{shortcut.description}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <KbdGroup>
                  {shortcut.keys.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </KbdGroup>
              </ItemActions>
            </Item>
          </div>
        ))}
      </ItemGroup>
    </SettingsSection>
  );
}
