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
    title: "Zoom in or out",
    description: "Steps through years, months, weeks, days and hours, keeping the time under the cursor in place. Ctrl or ⌘ with the mouse wheel, or a trackpad pinch, does the same.",
    keys: ["-", "+"],
  },
  {
    title: "Previous or next column",
    description: "Scrolls the timeline one column and selects it.",
    keys: ["←", "→"],
  },
  {
    title: "Jump to now",
    description: "Centres the column that contains the current time.",
    keys: ["T"],
  },
  {
    title: "Pan the timeline",
    description: "Hold Space and drag anywhere on the board. The mouse wheel also scrolls sideways.",
    keys: ["Space", "Drag"],
  },
  {
    title: "Add a task",
    description: "Type in a column's “Add a task” field, then press Enter.",
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
